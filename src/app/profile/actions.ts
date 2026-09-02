"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  const getString = (key: string) => {
    const val = formData.get(key);
    return typeof val === "string" ? val.trim() : "";
  };

  await prisma.profile.update({
    where: { userId: dbUser.id },
    data: {
      firstName: getString("firstName"),
      lastName: getString("lastName"),
      prefName: getString("prefName") || null,
      phoneNumber: getString("phoneNumber") || null,
      personalEmail: getString("personalEmail") || null,
      major: getString("major") || null,
      degree: getString("degree") || null,
      year: getString("year") || null,
      linkedinUrl: getString("linkedinUrl") || null,
      githubUrl: getString("githubUrl") || null,
      portfolioUrl: getString("portfolioUrl") || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}