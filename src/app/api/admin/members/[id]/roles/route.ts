import type { MembershipType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageRoles, isAssignableProgram, isAssignableUserRole } from "@/lib/roles";

type Body = { role?: unknown; programs?: unknown };

/**
 * Replaces a member's roles. Executive only.
 *
 * The permission role is a single field, so it is overwritten. Programs are
 * Membership rows, so the incoming list is reconciled against what is active:
 * anything dropped is ended rather than deleted, and anything added starts a
 * new dated row. Past stints stay on the record.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAuthenticatedUser();

  if (!actor) {
    return createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401);
  }

  if (!canManageRoles(actor.role)) {
    return createErrorResponse(
      "Only an Executive can change roles.",
      "FORBIDDEN",
      403
    );
  }

  const { id } = await params;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("Malformed JSON body.", "BAD_REQUEST", 400);
  }

  if (!isAssignableUserRole(body.role)) {
    return createErrorResponse("Unknown role.", "BAD_REQUEST", 400, {
      role: body.role,
    });
  }
  const role: UserRole = body.role;

  if (!Array.isArray(body.programs) || !body.programs.every(isAssignableProgram)) {
    return createErrorResponse("Unknown program.", "BAD_REQUEST", 400, {
      programs: body.programs,
    });
  }
  // Deduplicated so a repeated value can't open two concurrent rows.
  const programs = [...new Set(body.programs as MembershipType[])];

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      memberships: {
        where: { activeFlag: true },
        select: { id: true, membershipType: true },
      },
    },
  });

  if (!target) {
    return createErrorResponse("Member not found.", "NOT_FOUND", 404);
  }

  // Demoting the last Executive locks everyone out of role management, and
  // there is no UI to undo it. Refuse instead.
  if (target.role === "EXECUTIVE" && role !== "EXECUTIVE") {
    const executives = await prisma.user.count({ where: { role: "EXECUTIVE" } });
    if (executives <= 1) {
      return createErrorResponse(
        "This is the last Executive. Promote someone else first.",
        "LAST_EXECUTIVE",
        409
      );
    }
  }

  const now = new Date();
  const active = new Set(target.memberships.map((m) => m.membershipType));
  const toEnd = target.memberships.filter((m) => !programs.includes(m.membershipType));
  const toStart = programs.filter((program) => !active.has(program));

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { role } }),

    ...toEnd.map((membership) =>
      prisma.membership.update({
        where: { id: membership.id },
        data: { activeFlag: false, endDate: now },
      })
    ),

    ...toStart.map((membershipType) =>
      prisma.membership.create({
        data: { userId: id, membershipType, startDate: now, activeFlag: true },
      })
    ),

    prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        actionType: "ROLE_CHANGE",
        entityType: "User",
        entityId: id,
        metadataJson: {
          from: { role: target.role, programs: [...active] },
          to: { role, programs },
        },
      },
    }),
  ]);

  // The members list, the dashboard cards and the profile all read these.
  revalidatePath("/admin/members");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return NextResponse.json({ success: true, role, programs });
}
