import "server-only";

import { prisma } from "@/lib/prisma";
import {
  buildAnswerKey,
  gradeQuiz,
  parseQuizQuestions,
  quizAnswersSchema,
  toMemberQuestions,
  type MemberQuizQuestion,
  type QuizQuestionResult,
} from "@/lib/academy-quiz";

/**
 * Read models for the member-facing Academy pages.
 *
 * Everything here is plain serializable data so it can cross into client
 * components, and quiz answer keys are stripped before they leave.
 */

export type AcademyWorkshopSummary = {
  id: string;
  title: string;
  description: string;
  location: string;
  /** ISO string. */
  startTime: string;
  /** ISO string. */
  endTime: string;
  hasRecording: boolean;
  /** ISO string. Null while no published quiz or deadline is set. */
  quizDueAt: string | null;
  /** Whether the viewer has attendance credit. False when signed out. */
  hasAttended: boolean;
  imageUrl: string | null;
};

export type AcademyQuizAttempt = {
  /** Percent. */
  score: number;
  correctCount: number;
  total: number;
  passed: boolean;
  /** ISO string. */
  submittedAt: string;
  results: QuizQuestionResult[];
  /** Populated only on a passing attempt. */
  answerKey: Record<string, number> | null;
};

export type AcademyWorkshopDetail = AcademyWorkshopSummary & {
  viewerId: string | null;
  recordingUrl: string | null;
  progressCompleted: boolean;
  summary: string | null;
  questions: MemberQuizQuestion[];
  /** The viewer's most recent submission, if they've taken the quiz. */
  latestAttempt: AcademyQuizAttempt | null;
};

export type AcademyResource = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  href: string;
};

const WORKSHOP_WHERE = { isPublished: true };

export async function listAcademyWorkshops(
  viewerId: string | null
): Promise<AcademyWorkshopSummary[]> {
  const workshops = await prisma.workshop.findMany({
    where: WORKSHOP_WHERE,
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startTime: true,
      endTime: true,
      recordingUrl: true,
      quizDueAt: true,
      quiz: { select: { isPublished: true } },
      imageUrl: true,
    },
  });

  // Query all workshop attendance credits for the user in a single request
  const attendedIds = viewerId
    ? new Set(
        (
          await prisma.attendance.findMany({
            where: {
              userId: viewerId,
              workshopId: { in: workshops.map((w) => w.id) },
            },
            select: { workshopId: true },
          })
        )
          .map((a) => a.workshopId)
          .filter((id): id is string => id !== null)
      )
    : new Set<string>();

  return workshops.map((w) => ({
    id: w.id,
    title: w.title,
    description: w.description,
    location: w.location ?? "TBD",
    startTime: w.startTime.toISOString(),
    endTime: w.endTime.toISOString(),
    hasRecording: Boolean(w.recordingUrl),
    quizDueAt: w.quiz?.isPublished ? w.quizDueAt?.toISOString() ?? null : null,
    hasAttended: attendedIds.has(w.id),
    imageUrl: w.imageUrl,
  }));
}

export async function getAcademyWorkshop(
  id: string,
  viewerId: string | null
): Promise<AcademyWorkshopDetail | null> {
  const workshop = await prisma.workshop.findFirst({
    where: { id, ...WORKSHOP_WHERE },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startTime: true,
      endTime: true,
      recordingUrl: true,
      summary: true,
      quizDueAt: true,
      quiz: { select: { id: true, questionsJson: true, isPublished: true } },
      imageUrl: true,
    },
  });

  if (!workshop) return null;

  const quiz = workshop.quiz?.isPublished ? workshop.quiz : null;
  const questions = quiz ? parseQuizQuestions(quiz.questionsJson) : [];

  // Fetch attendance record & latest quiz attempt for signed-in viewer
  const [attendance, attempt, videoProgress] = viewerId
    ? await Promise.all([
        prisma.attendance.findFirst({
          where: { userId: viewerId, workshopId: workshop.id },
          select: { id: true },
        }),
        quiz
          ? prisma.quizAttempt.findFirst({
              where: { quizId: quiz.id, userId: viewerId },
              orderBy: { submittedAt: "desc" },
              select: { answersJson: true, submittedAt: true, passed: true },
            })
          : null,
        prisma.videoProgress.findUnique({
          where: { userId_workshopId: { userId: viewerId, workshopId: workshop.id } },
          select: { completed: true },
        }),
      ])
    : [null, null, null];

  const latestAttempt: AcademyQuizAttempt | null = attempt
    ? (() => {
        const answers = quizAnswersSchema.safeParse(attempt.answersJson);
        const graded = gradeQuiz(
          questions,
          answers.success ? answers.data : {},
          100
        );

        return {
          score: graded.score,
          correctCount: graded.correctCount,
          total: graded.total,
          passed: attempt.passed,
          submittedAt: attempt.submittedAt.toISOString(),
          results: graded.results,
          answerKey: attempt.passed ? buildAnswerKey(questions) : null,
        };
      })()
    : null;

  return {
    viewerId,
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    location: workshop.location ?? "TBD",
    startTime: workshop.startTime.toISOString(),
    endTime: workshop.endTime.toISOString(),
    hasRecording: Boolean(workshop.recordingUrl),
    hasAttended: Boolean(attendance),
    recordingUrl: workshop.recordingUrl ?? null,
    progressCompleted: videoProgress?.completed ?? false,
    imageUrl: workshop.imageUrl ?? null,
    summary: workshop.summary ?? null,
    quizDueAt: workshop.quizDueAt?.toISOString() ?? null,
    questions: toMemberQuestions(questions),
    latestAttempt,
  };
}

export async function listAcademyResources(): Promise<AcademyResource[]> {
  const resources = await prisma.academyResource.findMany({
    where: { isPublished: true, href: { not: null } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      href: true,
    },
  });

  return resources.map((r) => ({ ...r, href: r.href as string }));
}

/**
 * Picks what to headline on the Academy hub, in order of what a member most
 * needs right now: a session in progress, then the newest replay they can
 * watch, then whatever is scheduled next.
 */
export async function getFeaturedWorkshop(
  viewerId: string | null
): Promise<AcademyWorkshopDetail | null> {
  const now = new Date();

  const happeningNow = await prisma.workshop.findFirst({
    where: { ...WORKSHOP_WHERE, startTime: { lte: now }, endTime: { gte: now } },
    orderBy: { startTime: "asc" },
    select: { id: true },
  });

  if (happeningNow) return getAcademyWorkshop(happeningNow.id, viewerId);

  const latestReplay = await prisma.workshop.findFirst({
    where: {
      ...WORKSHOP_WHERE,
      endTime: { lt: now },
      recordingUrl: { not: null },
    },
    orderBy: { startTime: "desc" },
    select: { id: true },
  });

  if (latestReplay) return getAcademyWorkshop(latestReplay.id, viewerId);

  const nextUp = await prisma.workshop.findFirst({
    where: { ...WORKSHOP_WHERE, startTime: { gt: now } },
    orderBy: { startTime: "asc" },
    select: { id: true },
  });

  return nextUp ? getAcademyWorkshop(nextUp.id, viewerId) : null;
}

export function isWorkshopPast(workshop: { endTime: string }): boolean {
  return new Date(workshop.endTime).getTime() < Date.now();
}

export function hasWorkshopStarted(workshop: { startTime: string }): boolean {
  return new Date(workshop.startTime).getTime() <= Date.now();
}

export function isWorkshopInProgress(workshop: {
  startTime: string;
  endTime: string;
}): boolean {
  const now = Date.now();
  return (
    new Date(workshop.startTime).getTime() <= now &&
    now <= new Date(workshop.endTime).getTime()
  );
}
