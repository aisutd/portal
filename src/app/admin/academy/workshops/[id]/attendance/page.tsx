import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { canManageAcademy } from "@/lib/roles";
import { WorkshopAttendanceClient, type AcademyMemberAttendance } from "@/components/admin/workshop-attendance-client";

export default async function WorkshopAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workshopId } = await params;
  const actor = await getAuthenticatedUser();

  if (!actor) {
    return notFound();
  }

  const canCheckIn = canManageAcademy(actor.role, actor.team);

  // 1. Fetch Workshop with Quiz
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: {
      id: true,
      title: true,
      quiz: { select: { id: true } },
    },
  });

  if (!workshop) return notFound();

  // 2. Fetch Users with active AI Academy Membership
  // 2. Fetch Users with active AI Academy Membership
const activeAcademyUsers = await prisma.user.findMany({
  where: {
    memberships: {
      some: {
        membershipType: "AI_ACADEMY",
        activeFlag: true, // Updated from status: "ACTIVE"
      },
    },
  },
  include: {
    profile: true,
    attendances: {
      where: { workshopId },
    },
    quizAttempts: workshop.quiz
      ? {
          where: { quizId: workshop.quiz.id, passed: true },
          take: 1,
          orderBy: { submittedAt: "desc" }, // Updated from createdAt to submittedAt
        }
      : false,
  },
  orderBy: { email: "asc" },
});

  // 3. Map Data for Client
const membersData: AcademyMemberAttendance[] = activeAcademyUsers.map((user) => {
  const name = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : user.email;

  const attendance = user.attendances[0];
  const quizAttempt = user.quizAttempts?.[0];

  return {
    userId: user.id,
    name,
    email: user.email,
    membershipStatus: "ACTIVE",
    hasAttended: !!attendance,
    checkedInAt: attendance?.checkedInAt ?? null,
    method: attendance?.method ?? null,
    quizAttempt: quizAttempt
      ? {
          score: quizAttempt.score,
          passed: quizAttempt.passed,
          completedAt: quizAttempt.submittedAt, // Updated from quizAttempt.createdAt
          answersCount: 0,
        }
      : null,
  };
});

  return (
    <WorkshopAttendanceClient
      workshopId={workshop.id}
      workshopTitle={workshop.title}
      members={membersData}
      canCheckIn={canCheckIn}
    />
  );
}