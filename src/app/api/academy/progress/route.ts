import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
  }

  const { userId, workshopId, watchedSeconds, duration } = body as Record<string, unknown>;
  if (
    typeof userId !== "string" ||
    typeof workshopId !== "string" ||
    !Number.isFinite(watchedSeconds) ||
    !Number.isFinite(duration) ||
    (watchedSeconds as number) < 0 ||
    (duration as number) < 0
  ) {
    return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  });
  if (!currentUser || currentUser.id !== userId) {
    return NextResponse.json({ error: "User does not match session" }, { status: 403 });
  }

  const workshop = await prisma.workshop.findFirst({
    where: { id: workshopId, isPublished: true },
    select: { id: true },
  });
  if (!workshop) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  const watched = Math.floor(watchedSeconds as number);
  const length = Math.floor(duration as number);
  const completed = length > 0 && watched >= length * 0.5;
  const progress = await prisma.videoProgress.upsert({
    where: { userId_workshopId: { userId: currentUser.id, workshopId } },
    create: {
      userId: currentUser.id,
      workshopId,
      watchedSeconds: watched,
      duration: length,
      completed,
    },
    update: { watchedSeconds: watched, duration: length, completed },
    select: { watchedSeconds: true, duration: true, completed: true },
  });

  return NextResponse.json(progress);
}
