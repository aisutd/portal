import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { ApplicantListItem } from "@/components/admin/applicant-list-item";
import { ScoreScale } from "@/components/admin/score-scale";
import { ReviewerCard } from "@/components/admin/reviewer-card";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import {
  reviewStats,
  reviewFilters,
  adminApplicants,
  applicantDetail,
} from "@/lib/data";

export function MobileAdminApplicantReview() {
  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Applications" />

      <div className="flex flex-col gap-[4px]">
        <h2 className="font-mobile-display text-[17px] font-bold text-ink">
          AIM Mentor Application · Fall 2026
        </h2>
        <p className="font-mono text-[11px] text-ink-faint">
          Reviewing applicant 4 of 37 · two reviewers per applicant
        </p>
      </div>

      <div className="-mx-[20px] flex gap-[8px] overflow-x-auto px-[20px]">
        {reviewStats.map((s) =>
          s.outline ? (
            <span key={s.label} className="shrink-0">
              <Badge label={s.label} variant="outline" />
            </span>
          ) : (
            <span key={s.label} className="shrink-0">
              <Badge label={s.label} bg={s.bg} color={s.color} />
            </span>
          )
        )}
      </div>

      <div className="flex flex-col gap-[10px]">
        <input
          type="text"
          placeholder="search name / netid…"
          className="h-[40px] w-full rounded-[8px] bg-search-field px-[12px] font-mono text-[12px] text-search-ink placeholder:text-search-ink focus:outline-none"
        />
        <div className="-mx-[20px] flex items-center gap-[8px] overflow-x-auto px-[20px]">
          {reviewFilters.map((f) =>
            f.active ? (
              <span key={f.label} className="shrink-0">
                <Tag label={f.label} bg="#e1e8ff" color="#1f3aa3" />
              </span>
            ) : (
              <span key={f.label} className="shrink-0">
                <Tag label={f.label} bg="#efece3" color="#6a685f" border="#e2ded2" />
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        {adminApplicants.map((a) => (
          <ApplicantListItem key={a.name} {...a} />
        ))}
      </div>

      {/* Detail for the active applicant */}
      <div className="flex flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[18px]">
        <div className="flex items-center gap-[12px]">
          <span className="size-[44px] shrink-0 rounded-full border border-border-soft bg-photo" />
          <div className="min-w-0 flex-1">
            <h3 className="font-mobile-display text-[16px] font-bold text-ink">
              {applicantDetail.name}
            </h3>
            <p className="font-mono text-[10.5px] leading-[15px] text-ink-faint">
              {applicantDetail.netid} · {applicantDetail.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-[8px]">
          <Badge label={applicantDetail.roleBadge} bg="#fbe3cb" color="#7a4416" />
          <Badge label={applicantDetail.statusBadge} bg="#e1e8ff" color="#1f3aa3" />
        </div>

        <div className="flex flex-wrap gap-[8px]">
          <Button variant="soft" size="sm">Resume ↗</Button>
          <Button variant="soft" size="sm">LinkedIn ↗</Button>
          <Button variant="ghost" size="sm">GitHub ↗</Button>
        </div>
        <p className="font-mono text-[11px] text-ink-faint">{applicantDetail.appliedAt}</p>

        <div className="h-px w-full bg-border-soft" />

        <div className="flex flex-col gap-[10px]">
          {applicantDetail.questions.map((q) => (
            <div key={q.prompt} className="flex flex-col gap-[6px]">
              <h4 className="font-mobile-display text-[13px] font-bold text-ink">
                {q.prompt}
              </h4>
              {q.lines.map((w, i) => (
                <span key={i} className="h-[9px] rounded-[6px] bg-skeleton" style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[12px] rounded-[14px] bg-row-soft p-[16px]">
          <div className="flex items-center justify-between">
            <h4 className="font-mobile-display text-[13px] font-bold text-ink">
              Scoring rubric
            </h4>
            <span className="font-mono text-[10.5px] text-ink-faint">your scores</span>
          </div>
          {applicantDetail.rubric.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-[8px]">
              <span className="font-mobile-body text-[12px] text-ink-muted">{c.label}</span>
              <ScoreScale selected={c.selected} />
            </div>
          ))}
          <div className="h-px w-full bg-border-soft" />
          <div className="flex items-center justify-between">
            <span className="font-mobile-body text-[13px] font-bold text-ink">Your overall</span>
            <span className="font-mobile-body text-[13px] font-bold text-ink">
              {applicantDetail.overall}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
          {applicantDetail.reviewers.map((r) => (
            <ReviewerCard key={r.name} {...r} />
          ))}
          <div className="flex items-center justify-between rounded-[16px] border border-brand bg-brand-soft px-[16px] py-[14px]">
            <span className="font-mobile-body text-[13px] font-bold text-brand-dark">
              Combined avg
            </span>
            <span className="font-mobile-display text-[17px] font-bold text-brand-dark">
              {applicantDetail.combinedAvg}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-[8px]">
          <Button variant="danger" size="sm">✕ Reject</Button>
          <Button variant="accent" size="sm" pill={false}>★ Shortlist</Button>
          <Button variant="primary" size="sm" className="flex-1">✓ Accept</Button>
          <Button variant="outline" size="sm">Next →</Button>
        </div>
      </div>
    </MobileScreen>
  );
}
