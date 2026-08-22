import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageRoles } from "@/lib/roles";

/**
 * Records that belong to the organisation rather than to the person. Nothing
 * cascades from User in the schema, and deleting a member must never quietly
 * take an event or an application review with it.
 */
const SHARED_RECORDS = [
  { key: "submissions", label: "application submission" },
  { key: "reviews", label: "application review" },
  { key: "drafts", label: "application draft" },
  { key: "createdEvents", label: "created event" },
  { key: "createdApps", label: "created program application" },
  { key: "uploadedFiles", label: "uploaded file" },
  { key: "itemScans", label: "item scan" },
  { key: "auditLogs", label: "audit log entry" },
] as const;

function plural(count: number, label: string): string {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

/** Removes a member. Executive only. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAuthenticatedUser();

  if (!actor) {
    return createErrorResponse("Unauthorized", "UNAUTHENTICATED", 401);
  }

  if (!canManageRoles(actor.role)) {
    return createErrorResponse(
      "Only an Executive can remove members.",
      "FORBIDDEN",
      403
    );
  }

  const { id } = await params;

  if (id === actor.id) {
    return createErrorResponse(
      "You can't remove your own account.",
      "SELF_DELETE",
      409
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      clerkId: true,
      email: true,
      role: true,
      _count: {
        select: {
          submissions: true,
          reviews: true,
          drafts: true,
          createdEvents: true,
          createdApps: true,
          uploadedFiles: true,
          itemScans: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!target) {
    return createErrorResponse("Member not found.", "NOT_FOUND", 404);
  }

  if (target.role === "EXECUTIVE") {
    const executives = await prisma.user.count({ where: { role: "EXECUTIVE" } });
    if (executives <= 1) {
      return createErrorResponse(
        "This is the last Executive. Promote someone else first.",
        "LAST_EXECUTIVE",
        409
      );
    }
  }

  // Refuse rather than orphan or silently destroy organisational records.
  const blocking = SHARED_RECORDS.filter(({ key }) => target._count[key] > 0).map(
    ({ key, label }) => plural(target._count[key], label)
  );

  if (blocking.length > 0) {
    return createErrorResponse(
      `This member still has ${blocking.join(", ")}. Set their role to Member instead of removing them.`,
      "HAS_RECORDS",
      409,
      { blocking }
    );
  }

  // The Clerk delete runs inside the transaction so the two systems cannot
  // disagree: if Clerk rejects it, the database rows come back. Leaving the
  // login alive would let onboarding recreate the row from the same account.
  try {
    await prisma.$transaction(
      async (tx) => {
        // Personal rows only: profile, program memberships, and their RSVPs
        // (Attendance cascades from RSVP).
        await tx.rSVP.deleteMany({ where: { userId: id } });
        await tx.membership.deleteMany({ where: { userId: id } });
        await tx.profile.deleteMany({ where: { userId: id } });
        await tx.user.delete({ where: { id } });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            actionType: "MEMBER_REMOVED",
            entityType: "User",
            entityId: id,
            metadataJson: {
              email: target.email,
              role: target.role,
              clerkId: target.clerkId,
            },
          },
        });

        const clerk = await clerkClient();
        try {
          await clerk.users.deleteUser(target.clerkId);
        } catch (clerkError) {
          // Already gone in Clerk is the end state we want, not a failure.
          const status = (clerkError as { status?: number })?.status;
          if (status !== 404) throw clerkError;
        }
      },
      { timeout: 15_000 }
    );
  } catch (error) {
    console.error("Failed to remove member", id, error);
    return createErrorResponse(
      "Couldn't delete the login, so nothing was removed. Try again.",
      "CLERK_DELETE_FAILED",
      502
    );
  }

  revalidatePath("/admin/members");

  return NextResponse.json({ success: true });
}
