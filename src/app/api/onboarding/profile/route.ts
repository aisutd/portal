import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ProfileCompletionStatus, UserRole } from "@prisma/client";

const VALID_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];
const VALID_DEGREES = ["Bachelors", "Masters", "PhD"];

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the DB user, or create one if the Clerk webhook hasn't fired yet
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { profile: true },
  });

  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Could not determine your email address." },
        { status: 400 }
      );
    }

    user = await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        id: clerkId,
        clerkId,
        email,
        role: UserRole.MEMBER,
      },
      include: { profile: true },
    });
  }

  if (user.profile) {
    return NextResponse.json(
      { error: "Profile already exists." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const {
    firstName,
    lastName,
    middleName,
    prefName,
    year,
    degree,
    major,
    utdEmail,
    utdNetId,
    githubUrl,
    linkedinUrl,
    portfolioUrl,
  } = body;

  if (!firstName?.trim() || !lastName?.trim() || !prefName?.trim()) {
    return NextResponse.json(
      { error: "First name, last name, and preferred name are required." },
      { status: 400 }
    );
  }

  if (!year || !VALID_YEARS.includes(year)) {
    return NextResponse.json(
      { error: "Please select a valid year." },
      { status: 400 }
    );
  }

  if (!degree || !VALID_DEGREES.includes(degree)) {
    return NextResponse.json(
      { error: "Please select a valid degree." },
      { status: 400 }
    );
  }

  if (!major?.trim()) {
    return NextResponse.json(
      { error: "Major is required." },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: (middleName ?? "").trim(),
      prefName: prefName.trim(),
      year,
      degree,
      major: major.trim(),
      utdEmail: utdEmail?.trim() || null,
      utdNetId: utdNetId?.trim() || null,
      githubUrl: githubUrl?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null,
      portfolioUrl: portfolioUrl?.trim() || null,
      profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
    },
  });

  return NextResponse.json({ success: true, profileId: profile.id });
}
