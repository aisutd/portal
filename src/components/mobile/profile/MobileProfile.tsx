import type { Profile } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileField } from "@/components/mobile/ui/MobileField";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { MobileEyebrow as Eyebrow } from "@/components/mobile/ui/MobileEyebrow";
import { SignOutButton } from "@clerk/nextjs";
import { PasswordResetButton } from "@/components/profile/PasswordResetButton";
import { UTD_MAJORS, UTD_DEGREES, ACADEMIC_YEARS } from "@/lib/utd-data";
import { ResumeUploadButton } from "@/components/profile/ResumeUploadButton";

type MobileProfileProps = {
  profile: Profile & { resumeFile?: { fileName: string } | null };
  completion: { percent: number; missingFields: string[] };
  updateProfile: (formData: FormData) => Promise<void>;
};

function MobileSelect({
  label,
  name,
  defaultValue,
  options,
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  className: string;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="style-label-text text-[13px] text-ink">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className={cn( "w-full rounded-[10px] border border-transparent bg-field px-[13px] py-[11px] font-mobile-body text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40", 
          className
        )}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MobileProfile({ profile, completion, updateProfile }: MobileProfileProps) {
  return (
    <MobileScreen>
      {completion.percent < 100 && (
        <div className="rounded-[8px] bg-[#f9d5d3] px-[16px] py-[12px]">
          <span className="font-mobile-body text-[13px] font-bold text-[#9a3b36]">
            Your profile is {completion.percent}% complete. Fill in the highlighted fields to reach 100%.
          </span>
        </div>
      )}

      <form key={profile.updatedAt.toString()} action={updateProfile} className="flex flex-col gap-[16px]">
        {/* Avatar + Links */}
        <div className="flex gap-[12px]">
          <Card className="flex flex-[3] flex-col items-center gap-[10px] p-[18px]">
            <div className="size-[64px] rounded-full bg-photo" />
            <p className="style-card-title text-[15px] uppercase tracking-[0.5px] text-ink">
              {profile.firstName} {profile.lastName}
            </p>
            <Badge label={`${profile.major} · ${profile.year}`} bg="#fbe3cb" color="#7a4416" />
          </Card>

          <Card className="flex flex-[2] flex-col gap-[12px] p-[16px]">
            <Eyebrow>Links</Eyebrow>
            <MobileField
              label="LinkedIn"
              name="linkedinUrl"
              defaultValue={profile.linkedinUrl || ""}
              placeholder="linkedin.com/in/…"
              className={cn( 
                !profile.linkedinUrl ? "border-red-500 ring-2 ring-red-500 bg-red-50" : "border-transparent"
              )}
            />
            <MobileField
              label="Github"
              name="githubUrl"
              defaultValue={profile.githubUrl || ""}
              placeholder="github.com/…"
              className={cn( 
                !profile.githubUrl ? "border-red-500 ring-2 ring-red-500 bg-red-50" : "border-transparent"
              )}
            />
            <MobileField
              label="Portfolio"
              name="portfolioUrl"
              defaultValue={profile.portfolioUrl || ""}
              placeholder="https://..."
              className={cn( 
                /*!profile.portfolioUrl ? "border-red-500 ring-2 ring-red-500 bg-red-50" :*/ 
                "border-transparent"
              )}
            />
          </Card>
        </div>

        {/* Personal Info */}
        <Card className="flex flex-col gap-[14px] p-[18px]">
          <Eyebrow>Personal Info</Eyebrow>
          <MobileField label="First Name" name="firstName" defaultValue={profile.firstName} />
          <MobileField label="Last Name" name="lastName" defaultValue={profile.lastName} />
          <MobileField label="Preferred Name" name="prefName" defaultValue={profile.prefName || ""} />
          <MobileField
            label="UTD Email"
            name="utdEmail"
            type="email"
            defaultValue={profile.utdEmail || ""}
          />
          <MobileField label="UTD ID" name="utdNetId" defaultValue={profile.utdNetId || ""} 
          className={cn( 
                !profile.utdNetId ? "border-red-500 ring-2 ring-red-500 bg-red-50" : "border-transparent"
              )}/>
          <MobileSelect label="Major" name="major" defaultValue={profile.major ?? ""} options={UTD_MAJORS} 
          className={cn( 
                !profile.major ? "border-red-500 ring-2 ring-red-500 bg-red-50" : "border-transparent"
              )}/>
          <MobileSelect label="Degree" name="degree" defaultValue={profile.degree ?? ""} options={UTD_DEGREES} 
          className={cn( 
                !profile.degree ? "border-red-500 ring-2 ring-red-500 bg-red-50" : "border-transparent"
              )}/>
          <MobileSelect
            label="Academic Year"
            name="year"
            defaultValue={profile.year ?? ""}
            options={ACADEMIC_YEARS}
            className={cn( 
                !profile.year ? "border-red-500 ring-2 ring-red-500 bg-red-50" : "border-transparent"
              )}
          />
        </Card>

        {/* Resume Upload */}
        <Card className="flex flex-col gap-[12px] p-[18px]">
          <Eyebrow>Resume Upload</Eyebrow>
          <div
            className={cn(
              "flex items-center gap-[14px] rounded-[12px] border p-[14px]",
              !profile.resumeFileId
                ? "border-2 border-red-500 bg-red-50"
                : "border-dashed border-card-border"
            )}
          >
            <div className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-purple-soft">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-[18px] text-purple-ink"
              >
                <path
                  d="M12 4v11m0-11 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="style-card-title text-[13px] text-ink">
                Upload New Resume
              </p>
              <p className="style-meta-text text-[11px] text-ink-faint">
                PDF, DOCX, UP TO 5MB.
              </p>
            </div>
            <ResumeUploadButton
              initialFileName={profile.resumeFile?.fileName}
              hasResume={!!profile.resumeFileId}
              size="sm"
              variant="mobile"
            />
          </div>
        </Card>

        {/* Security */}
        <Card className="flex flex-col gap-[16px] p-[18px]">
          <Eyebrow>Security & Notifications</Eyebrow>

          <div className="flex items-center justify-between gap-[12px] rounded-[12px] bg-row-soft p-[14px]">
            <div>
              <p className="style-card-title text-[13px] text-ink">
                Change Password
              </p>
              <p className="style-body-text text-[12px] text-ink-muted">
                Update your account password
              </p>
            </div>
            <PasswordResetButton />
          </div>

          <div className="flex items-center justify-between gap-[12px] rounded-[12px] bg-row-soft p-[14px]">
            <div>
              <p className="style-card-title text-[13px] text-ink">
                Email Notifications
              </p>
              <p className="style-body-text text-[12px] text-ink-muted">
                Receive updates from AIS about events and announcements
              </p>
            </div>
            <div className="relative h-[26px] w-[46px] shrink-0 rounded-full bg-brand p-[2px]">
              <div className="absolute right-[2px] top-[2px] size-[22px] rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </Card>

        {/* Footer actions */}
        <div className="flex gap-[12px]">
          <Button type="reset" variant="soft" className="flex-1" block>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" block>
            Apply Changes
          </Button>
        </div>
      </form>

      <div className="flex items-center w-full mt-2">
        {/* SIGN OUT BUTTON */}
        <SignOutButton redirectUrl="/">
          <Button 
            type="button" 
            variant="ghost" 
            size="lg" 
            className="mr-auto font-black text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </SignOutButton>
      </div>

      <BottomNav />
    </MobileScreen>
  );
}