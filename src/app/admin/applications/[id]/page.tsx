import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ApplicantListItem } from "@/components/admin/applicant-list-item";
import { ApplicantDetail } from "@/components/admin/applicant-detail";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { MobileAdminApplicantReview } from "@/components/mobile/admin/MobileAdminApplicantReview";
import {
  reviewStats,
  reviewFilters,
  adminApplicants,
  applicantDetail,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "AIS Admin — Applications",
  description: "Review and score AIS program applications.",
};

export default function AdminApplyPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileAdminApplicantReview />
      </div>

      <div className="hidden md:block">
      <div className="flex min-h-screen w-full bg-cream">
        <AdminSidebar active="Applications" />

        <div className="flex h-full flex-1 flex-col gap-[16px] p-[46px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[5px]">
              <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                AIM Mentor Application · Fall 2026
              </h2>
              <p className="style-caption leading-[16.8px] tracking-[0.2px] text-ink-faint">
                Reviewing applicant 4 of 37 · two reviewers per applicant
              </p>
            </div>
            <div className="flex gap-[8px]">
              {reviewStats.map((s) =>
                s.outline ? (
                  <Badge key={s.label} label={s.label} variant="outline" />
                ) : (
                  <Badge
                    key={s.label}
                    label={s.label}
                    bg={s.bg}
                    color={s.color}
                  />
                )
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex w-full items-center gap-[12px]">
            <input
              type="text"
              placeholder="search name / netid…"
              className="h-[42px] flex-1 rounded-[8px] bg-search-field px-[14px] style-caption text-search-ink placeholder:text-search-ink focus:outline-none"
            />
            {reviewFilters.map((f) =>
              f.active ? (
                <Tag key={f.label} label={f.label} bg="#e1e8ff" color="#1f3aa3" />
              ) : (
                <Tag
                  key={f.label}
                  label={f.label}
                  bg="#efece3"
                  color="#6a685f"
                  border="#e2ded2"
                />
              )
            )}
            <Badge label="sort: score ↓" variant="outline" />
          </div>

          {/* Queue + detail */}
          <div className="flex min-h-px flex-1 gap-[16px]">
            <div className="flex w-[280px] shrink-0 flex-col gap-[8px]">
              {adminApplicants.map((a) => (
                <ApplicantListItem key={a.name} {...a} />
              ))}
            </div>
            <ApplicantDetail {...applicantDetail} />
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
