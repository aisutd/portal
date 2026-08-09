import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileWizard } from "@/components/onboarding/profile-wizard";

export const metadata: Metadata = {
  title: "AIS Portal — Complete Your Profile",
  description: "Set up your AIS member profile.",
};

export default async function SetupPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/onboarding?mode=signup");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { profile: true },
  });

  if (dbUser?.profile) redirect("/dashboard");

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-cream px-[24px] py-[60px]">
      <div>
         <img
          className="h-10 shrink-0 object-contain sm:h-12"
          src="/ais_logo_black.png"
          alt="AIS Logo"
        />
      </div>

      <h1 className="mt-[24px] font-display text-[32px] font-bold leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
        Complete Your Profile
      </h1>
      <p className="mt-[8px] max-w-[420px] text-center font-body text-[15px] font-normal leading-[22.5px] text-ink-muted">
        Tell us a bit about yourself so we can personalize your AIS experience.
      </p>

      <div className="mt-[32px] w-full max-w-[520px]">
        <ProfileWizard email={email} />
      </div>
    </div>
  );
}
