import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getProfileCompletion } from "@/lib/dashboard-utils";
import { revalidatePath } from "next/cache";
import { MobileProfile } from "@/components/mobile/profile/MobileProfile";
import { PasswordResetButton } from "@/components/profile/PasswordResetButton";
import { UTD_MAJORS, UTD_DEGREES, ACADEMIC_YEARS } from "@/lib/utd-data";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { profile: true }
  });

  if (!user || !user.profile) {
    redirect("/dashboard");
  }

  const profile = user.profile;
  const completion = await getProfileCompletion(user.id);

  async function updateProfile(formData: FormData) {
    "use server";
    const clerkUser = await currentUser();
    if (!clerkUser) return;

    await prisma.profile.update({
      where: { userId: user!.id },
      data: {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        prefName: formData.get("prefName") as string,
        utdEmail: formData.get("utdEmail") as string,
        utdNetId: formData.get("utdNetId") as string,
        major: formData.get("major") as string,
        degree: formData.get("degree") as string,
        year: formData.get("year") as string,
        linkedinUrl: formData.get("linkedinUrl") as string,
        githubUrl: formData.get("githubUrl") as string,
        portfolioUrl: formData.get("portfolioUrl") as string,
      }
    });

    revalidatePath("/profile");
  }

  return (
    <>
      <div className="md:hidden">
        <MobileProfile profile={profile} completion={completion} updateProfile={updateProfile} />
      </div>

      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream font-[Inter]">
          <Navbar active="Profile" />

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[28px] px-[46px] pb-[46px] pt-[45px]">
            <h1 className="font-[Inter] text-[40px] font-bold leading-[43.2px] tracking-[-0.4px] text-brand">
              Profile
            </h1>

            {completion.percent < 100 && (
              <div className="flex w-full items-center justify-between rounded-[8px] bg-[#f9d5d3] px-[21px] py-[16px] mt-[16px]">
                <span className="font-[Inter] text-[15px] font-bold text-[#9a3b36]">
                  Your profile is {completion.percent}% complete. Please complete the highlighted fields to reach 100%!
                </span>
              </div>
            )}

            <form key={profile.updatedAt.toString()} action={updateProfile} className="flex flex-col xl:flex-row gap-[24px] mt-[28px]">
              {/* LEFT COLUMN */}
              <div className="flex w-full xl:w-[400px] shrink-0 flex-col gap-[24px]">
                
                {/* USER INFO CARD */}
                <Card className="flex flex-col items-center justify-center p-[40px] gap-[20px]">
                  <div className="flex size-[140px] shrink-0 items-center justify-center rounded-full bg-photo">
                    <span className="font-[Inter] text-[12px] tracking-[1.5px] text-photo-text">PHOTO</span>
                  </div>
                  <h2 className="font-[Inter] text-[24px] font-bold tracking-[-0.4px] text-ink uppercase">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <div className="rounded-full bg-pill-amber px-[20px] py-[6px]">
                    <span className="font-[Inter] text-orange-text font-bold text-[13px] tracking-widest uppercase">
                      {profile.major} · {profile.year}
                    </span>
                  </div>
                </Card>

                {/* LINKS CARD */}
                <Card className="flex flex-col p-[29px] gap-[20px]">
                  <SectionHeader title="Links" />
                  
                  <div className="flex flex-col gap-[16px]">
                    <div className="flex items-center gap-[16px]">
                      <span className="font-[Inter] font-bold text-[15px] text-ink w-[80px]">LinkedIn</span>
                      <input 
                        name="linkedinUrl"
                        defaultValue={profile.linkedinUrl || ""}
                        placeholder="https://linkedin.com/in/..."
                        className={cn(
                          "h-[40px] flex-1 rounded-[8px] bg-field border px-[16px] text-[14px] text-ink focus:outline-none focus:border-brand",
                          !profile.linkedinUrl ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-transparent"
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-[16px]">
                      <span className="font-[Inter] font-bold text-[15px] text-ink w-[80px]">Github</span>
                      <input 
                        name="githubUrl"
                        defaultValue={profile.githubUrl || ""}
                        placeholder="https://github.com/..."
                        className={cn(
                          "h-[40px] flex-1 rounded-[8px] bg-field border px-[16px] text-[14px] text-ink focus:outline-none focus:border-brand",
                          !profile.githubUrl ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-transparent"
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-[16px]">
                      <span className="font-[Inter] font-bold text-[15px] text-ink w-[80px]">Portfolio</span>
                      <input 
                        name="portfolioUrl"
                        defaultValue={profile.portfolioUrl || ""}
                        placeholder="https://..."
                        className={cn(
                          "h-[40px] flex-1 rounded-[8px] bg-field border px-[16px] text-[14px] text-ink focus:outline-none focus:border-brand",
                          !profile.portfolioUrl ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-transparent"
                        )}
                      />
                    </div>
                </Card>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex w-full flex-1 flex-col gap-[24px]">
                
                {/* PERSONAL INFO CARD */}
                <Card className="flex flex-col p-[29px] gap-[20px]">
                  <SectionHeader title="Personal Info" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[32px] gap-y-[20px]">
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">First Name</span>
                      <input 
                        name="firstName"
                        defaultValue={profile.firstName}
                        className="h-[44px] w-full rounded-[8px] bg-field border border-transparent px-[16px] text-[15px] text-ink focus:outline-none focus:border-brand"
                        readOnly
                      />
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">Last Name</span>
                      <input 
                        name="lastName"
                        defaultValue={profile.lastName}
                        className="h-[44px] w-full rounded-[8px] bg-field border border-transparent px-[16px] text-[15px] text-ink focus:outline-none focus:border-brand"
                        readOnly
                      />
                    </div><div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">Preferred Name</span>
                      <input 
                        name="prefName"
                        defaultValue={profile.prefName ?? ""}
                        className="h-[44px] w-full rounded-[8px] bg-field border border-transparent px-[16px] text-[15px] text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">Email</span>
                      <input 
                        name="utdEmail"
                        defaultValue={profile.utdEmail || ""}
                        className="h-[44px] w-full rounded-[8px] bg-field border border-transparent px-[16px] text-[15px] text-ink focus:outline-none focus:border-brand"
                        readOnly
                      />
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">UTD ID</span>
                      <input 
                        name="utdNetId"
                        defaultValue={profile.utdNetId || ""}
                        className="h-[44px] w-full rounded-[8px] bg-field border border-transparent px-[16px] text-[15px] text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">Major</span>
                      <select 
                        name="major"
                        defaultValue={profile.major ?? ""}
                        className={cn(
                          "h-[44px] rounded-[8px] bg-field border px-[16px] text-[14px] text-ink focus:outline-none focus:border-brand",
                          !profile.major ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-transparent"
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
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">Degree</span>
                      <select 
                        name="degree"
                        defaultValue={profile.degree ?? ""}
                        className={cn(
                          "h-[44px] rounded-[8px] bg-field border px-[16px] text-[14px] text-ink focus:outline-none focus:border-brand",
                          !profile.degree ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-transparent"
                        )}                      >
                        <option value="">Select your degree</option>
                        {UTD_DEGREES.map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <span className="font-[Inter] font-bold text-[14px] text-ink-muted">Academic Year</span>
                      <select 
                        name="year"
                        defaultValue={profile.year ?? ""}
                        className={cn(
                          "h-[44px] rounded-[8px] bg-field border px-[16px] text-[14px] text-ink focus:outline-none focus:border-brand",
                          !profile.year ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-transparent"
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

                {/* SECURITY CARD */}
                <Card className="flex flex-col p-[29px] gap-[20px]">
                  <SectionHeader title="Security & Notifications" />

                  <div className="flex items-center justify-between rounded-[12px] bg-[var(--color-pill-amber)] p-[20px]">
                    <div className="flex flex-col gap-[4px] pr-4">
                      <span className="font-[Inter] font-bold text-[15px] text-orange-text">Change Password</span>
                      <span className="font-[Inter] text-[14px] text-orange-text leading-tight">Update your account password safely.</span>
                    </div>
                    
                    {/* Render the Client Component Button here */}
                    <PasswordResetButton />
                  </div>

                  <div className="flex items-center justify-between rounded-[12px] bg-coffee p-[20px]">
                    <div className="flex flex-col gap-[4px] pr-4">
                      <span className="font-[Inter] font-bold text-[15px] text-[#4b4178]">Email Notifications</span>
                      <span className="font-[Inter] text-[14px] text-[#4b4178] leading-tight">Receive updates from AIS about events and announcements.</span>
                    </div>
                    <div className="relative h-[28px] w-[52px] shrink-0 rounded-full bg-brand p-[2px]">
                      <div className="absolute right-[2px] top-[2px] size-[24px] rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </Card>

                {/* RESUME UPLOAD CARD */}
                <Card className="flex flex-col p-[29px] gap-[20px]">
                  <SectionHeader title="Resume Upload" />
                  
                  <div className={cn(
                    "flex flex-col md:flex-row items-start md:items-center justify-between rounded-[12px] border-[2px] p-[24px] gap-[20px]",
                    !profile.resumeFileId ? "border-red-500 border-solid bg-red-50" : "border-dashed border-frame bg-[#f9f8f6]"
                  )}>
                    <div className="flex items-center gap-[20px]">
                      <div className="flex size-[64px] shrink-0 items-center justify-center rounded-full bg-featured">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2f5fe8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <path d="M14 2v6h6"></path>
                          <path d="M12 18v-6"></path>
                          <path d="M9 15l3-3 3 3"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-[4px]">
                        <span className="font-[Inter] font-bold text-[16px] text-ink">Upload New Resume</span>
                        <span className="font-[Inter] font-bold text-[12px] text-ink-muted uppercase tracking-wide">PDF, DOCX, UP TO 5MB.</span>
                        <div className="mt-[4px] flex items-center gap-[6px] rounded-full bg-coffee px-[12px] py-[4px] w-fit border border-[#ddd5f0]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b4178" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span className="font-[Inter] text-[11px] text-[#4b4178] font-bold">Uploaded Resume Name</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="primary" size="md" pill className="font-black px-[24px]">
                      Select File
                    </Button>
                  </div>
                </Card>

                {/* ACTIONS */}
                <div className="mt-auto flex items-center justify-end gap-[16px] pt-[16px]">
                  {/* SIGN OUT BUTTON */}
                  <SignOutButton redirectUrl="/">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="lg" 
                      className="mr-auto font-black px-[32px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Sign Out
                    </Button>
                  </SignOutButton>
                  
                  <Button type="reset" variant="ghost" size="lg" className="font-black px-[32px]">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="lg" className="font-black px-[32px]">
                    Apply Changes
                  </Button>
                </div>
                
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}