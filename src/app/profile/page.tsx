import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getProfileCompletion } from "@/lib/dashboard-utils";
import { MobileProfile } from "@/components/mobile/profile/MobileProfile";
import { PasswordResetButton } from "@/components/profile/PasswordResetButton";
import { ResumeUploadButton } from "@/components/profile/ResumeUploadButton";
import { ProfileForm } from "@/components/profile/profile-form";
import { UTD_MAJORS, UTD_DEGREES, ACADEMIC_YEARS } from "@/lib/utd-data";
import { updateProfile } from "./actions";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/onboarding");

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      profile: {
        include: { resumeFile: true },
      },
    },
  });

  if (!user || !user.profile) redirect("/dashboard");

  const profile = user.profile;
  const completion = await getProfileCompletion(user.id);

  return (
    <>
      <div className="md:hidden">
        <MobileProfile profile={profile} completion={completion} updateProfile={updateProfile} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Profile" />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            <h1 className="style-page-title leading-[43.2px] tracking-[-0.4px] text-brand">
              Profile
            </h1>

            {completion.percent < 100 && (
              <div className="mt-[16px] flex w-full items-center justify-between rounded-lg bg-[#f9d5d3] px-[21px] py-[16px]">
                <span className="style-body-text font-bold text-[#9a3b36]">
                  Your profile is {completion.percent}% complete. Please complete the highlighted fields to reach 100%!
                </span>
              </div>
            )}

            <ProfileForm initialUpdatedAt={profile.updatedAt.toString()}>
              <Card className="flex w-full flex-col items-start justify-between gap-[16px] p-[29px] sm:flex-row sm:items-center">
                <h2 className="style-card-title tracking-[-0.4px] text-ink uppercase">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="rounded-full bg-pill-amber px-[20px] py-[6px]">
                  <span className="style-badge-text text-orange-text tracking-widest uppercase">
                    {profile.major || "No Major Set"} · {profile.year || "No Year Set"}
                  </span>
                </div>
              </Card>

              <div className="flex flex-col gap-[24px] xl:flex-row">
                {/* LEFT COLUMN */}
                <div className="flex w-full shrink-0 flex-col gap-[24px] xl:w-[400px]">
                  <Card className="flex flex-col gap-[20px] p-[29px]">
                    <SectionHeader title="Links" />
                    <div className="flex flex-col gap-[16px]">
                      <div className="flex items-center gap-[16px]">
                        <label htmlFor="linkedinUrl" className="style-label-text text-ink w-[80px]">
                          LinkedIn
                        </label>
                        <input
                          id="linkedinUrl"
                          name="linkedinUrl"
                          defaultValue={profile.linkedinUrl || ""}
                          placeholder="https://linkedin.com/in/..."
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-[40px] flex-1 rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.linkedinUrl ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-[16px]">
                        <label htmlFor="githubUrl" className="style-label-text text-ink w-[80px]">
                          Github
                        </label>
                        <input
                          id="githubUrl"
                          name="githubUrl"
                          defaultValue={profile.githubUrl || ""}
                          placeholder="https://github.com/..."
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-[40px] flex-1 rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.githubUrl ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-[16px]">
                        <label htmlFor="portfolioUrl" className="style-label-text text-ink w-[80px]">
                          Portfolio
                        </label>
                        <input
                          id="portfolioUrl"
                          name="portfolioUrl"
                          defaultValue={profile.portfolioUrl || ""}
                          placeholder="https://..."
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-[40px] flex-1 rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.portfolioUrl ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="flex flex-col gap-[20px] p-[29px]">
                    <SectionHeader title="Resume Upload" />
                    <ResumeUploadButton
                      initialFileName={profile.resumeFile?.fileName}
                      hasResume={!!profile.resumeFileId}
                    />
                  </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex w-full flex-1 flex-col gap-[24px]">
                  <Card className="flex flex-col gap-[20px] p-[29px]">
                    <SectionHeader title="Personal Info" />
                    <div className="grid grid-cols-1 gap-x-[32px] gap-y-[20px] md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="firstName" className="style-label-text text-ink-muted">First Name</label>
                        <input
                          id="firstName"
                          name="firstName"
                          defaultValue={profile.firstName}
                          className="style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border border-transparent bg-field px-[16px] focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="lastName" className="style-label-text text-ink-muted">Last Name</label>
                        <input
                          id="lastName"
                          name="lastName"
                          defaultValue={profile.lastName}
                          className="style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border border-transparent bg-field px-[16px] focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="prefName" className="style-label-text text-ink-muted">Preferred Name</label>
                        <input
                          id="prefName"
                          name="prefName"
                          defaultValue={profile.prefName ?? ""}
                          className="style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border border-transparent bg-field px-[16px] focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="phoneNumber" className="style-label-text text-ink-muted">Phone Number</label>
                        <input
                          id="phoneNumber"
                          name="phoneNumber"
                          defaultValue={profile.phoneNumber ?? ""}
                          placeholder="(123) 456-7890"
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.phoneNumber ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="personalEmail" className="style-label-text text-ink-muted">Personal Email</label>
                        <input
                          id="personalEmail"
                          name="personalEmail"
                          type="email"
                          defaultValue={profile.personalEmail ?? ""}
                          placeholder="john@gmail.com"
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.personalEmail ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="utdEmail" className="style-label-text text-ink-muted">UTD Email</label>
                        <input
                          id="utdEmail"
                          name="utdEmail"
                          defaultValue={profile.utdEmail || ""}
                          className="style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border border-transparent bg-field px-[16px] focus:outline-none"
                          disabled
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="utdNetId" className="style-label-text text-ink-muted">UTD NetID</label>
                        <input
                          id="utdNetId"
                          name="utdNetId"
                          defaultValue={profile.utdNetId || ""}
                          className="style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border border-transparent bg-field px-[16px] focus:outline-none"
                          disabled
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="major" className="style-label-text text-ink-muted">Major</label>
                        <select
                          id="major"
                          name="major"
                          defaultValue={profile.major ?? ""}
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.major ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        >
                          <option value="">Select your major</option>
                          {UTD_MAJORS.map((major) => (
                            <option key={major} value={major}>
                              {major}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="degree" className="style-label-text text-ink-muted">Degree</label>
                        <select
                          id="degree"
                          name="degree"
                          defaultValue={profile.degree ?? ""}
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.degree ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        >
                          <option value="">Select your degree</option>
                          {UTD_DEGREES.map((degree) => (
                            <option key={degree} value={degree}>
                              {degree}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="year" className="style-label-text text-ink-muted">Academic Year</label>
                        <select
                          id="year"
                          name="year"
                          defaultValue={profile.year ?? ""}
                          className={cn(
                            "style-input-text text-ink focus:border-brand h-11 w-full rounded-lg border bg-field px-[16px] focus:outline-none",
                            !profile.year ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-transparent"
                          )}
                        >
                          <option value="">Select your year</option>
                          {ACADEMIC_YEARS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>

                  <Card className="flex flex-col gap-[20px] p-[29px]">
                    <SectionHeader title="Security" />
                    <div className="flex items-center justify-between rounded-[12px] bg-[var(--color-pill-amber)] p-[20px]">
                      <div className="flex flex-col gap-[4px] pr-4">
                        <span className="style-card-title text-orange-text">Change Password</span>
                        <span className="style-body-text text-orange-text leading-tight">Update your account password safely.</span>
                      </div>
                      <PasswordResetButton />
                    </div>
                  </Card>
                </div>
              </div>
            </ProfileForm>
          </div>
        </div>
      </div>
    </>
  );
}