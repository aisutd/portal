import Link from "next/link";
import Tag from "./_components/Tag";

const PAST = [
  { label: "AI STARTUP PANEL", stat: false },
  { label: "ML MIXER", stat: false },
  { label: "500+", stat: true },
  { label: "HACKAI 2025", stat: false },
];

const MARQUEE = "BUILD THE FUTURE · AIS UTD · JOIN THE MOVEMENT · AIS UTD";

export default function EventsPage() {
  return (
    <main className="mx-auto w-full max-w-[1428px] px-6 pb-16 pt-10 sm:px-[46px] sm:pt-[45px]">
      {/* Hero */}
      <section className="flex flex-col gap-[10px]">
        <h1 className="font-display text-[34px] leading-tight tracking-[-0.5px] text-ais-blue sm:text-[48px] sm:leading-[53.76px]">
          What&apos;s Happening
        </h1>
        <p className="max-w-[560px] font-body text-[16px] leading-[24px] text-ink">
          Your portal to the most energetic tech community at UTD. Dive into
          workshops, socials, and hackathons designed for the bold.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="rounded-full bg-pill-amber px-[14px] py-[5px] font-body text-[13px] font-semibold text-orange-text">
            Upcoming (3)
          </span>
          <Link
            href="/events/browse"
            className="rounded-full border border-line bg-white px-[15px] py-[6px] font-body text-[13px] font-semibold text-slate transition-colors hover:border-ais-blue hover:text-ais-blue"
          >
            Past Adventures
          </Link>
        </div>
      </section>

      {/* Featured grid */}
      <section className="mt-7 flex flex-col gap-6 lg:flex-row">
        {/* Big featured */}
        <div className="flex min-h-[300px] flex-1 flex-col justify-between rounded-2xl border border-line bg-featured p-7">
          <div>
            <span className="inline-flex rounded-full bg-pill-amber px-[14px] py-[5px] font-body text-[13px] font-semibold text-orange-text">
              Featured · Monday
            </span>
            <h2 className="mt-5 font-heading text-[30px] font-bold leading-[32.4px] tracking-[-0.4px] text-ink">
              AIS Kickoff Social
            </h2>
            <p className="mt-3 font-body text-[14px] leading-[20.3px] text-slate">
              Join us for pizza, games, and the big reveal for the semester.
              Don&apos;t miss out.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              <Tag name="food" />
              <Tag name="social" />
            </div>
            <Link
              href="/events/fall-kickoff"
              className="inline-flex items-center justify-center rounded-full bg-ais-blue px-[21px] py-[13px] font-body text-[15px] font-semibold text-white shadow-[0px_5px_7px_rgba(47,95,232,0.3)] transition-transform hover:scale-[1.03]"
            >
              RSVP Now
            </Link>
          </div>
        </div>

        {/* Side stack */}
        <div className="flex w-full flex-col gap-6 lg:w-[420px]">
          {/* Flyer card */}
          <div className="rounded-2xl border border-line bg-white p-[22px]">
            <div className="flex h-24 items-center justify-center rounded-xl bg-placeholder">
              <span className="font-ibm text-[11px] tracking-[1.5px] text-placeholder-text">
                FLYER
              </span>
            </div>
            <p className="mt-[18px] font-ibm text-[12px] tracking-[0.2px] text-ais-blue">
              OCT 14 · 4:00 PM
            </p>
            <h3 className="mt-1 font-heading text-[17px] font-semibold text-ink">
              Python for ML Deep Dive
            </h3>
            <p className="mt-2 font-body text-[14px] leading-[20.3px] text-slate">
              A hands-on session exploring PyTorch and data visualization.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <Tag name="learn" />
              <button className="inline-flex items-center justify-center rounded-full bg-orange px-[15px] py-[9px] font-body text-[13px] font-semibold text-orange-text shadow-[0px_5px_7px_rgba(242,169,104,0.34)] transition-transform hover:scale-[1.03]">
                Claim Spot
              </button>
            </div>
          </div>

          {/* Coffee & Code */}
          <div className="flex items-center gap-[14px] rounded-2xl border border-line bg-coffee p-[21px]">
            <div className="flex size-[70px] shrink-0 items-center justify-center rounded-xl bg-[#cfcbe0] text-2xl">
              ☕
            </div>
            <div className="min-w-0">
              <p className="font-ibm text-[12px] tracking-[0.2px] text-[#4b4178]">
                EVERY WED · 10AM
              </p>
              <h3 className="mt-1 font-heading text-[17px] font-semibold text-ink">
                Coffee &amp; Code
              </h3>
              <p className="mt-1 font-body text-[14px] leading-[20.3px] text-slate">
                Casual networking at the Student Union.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Host promo */}
      <section className="mt-6 flex flex-col items-start justify-between gap-6 rounded-2xl bg-ais-blue p-8 sm:flex-row sm:items-center sm:p-[33px]">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-[28px] font-bold leading-[34.56px] tracking-[-0.4px] text-white sm:text-[32px]">
            Wanna host an event?
          </h2>
          <p className="max-w-xl font-body text-[14px] leading-[20.3px] text-[#dfe6ff]">
            The AIS platform belongs to the community. Propose your workshop or
            social idea today.
          </p>
        </div>
        <button className="shrink-0 rounded-full bg-orange px-[29px] py-[16px] font-body text-[17px] font-semibold text-orange-text shadow-[0px_5px_7px_rgba(242,169,104,0.34)] transition-transform hover:scale-[1.03]">
          Submit Proposal
        </button>
      </section>

      {/* Marquee */}
      <div className="mt-10 -rotate-[0.8deg]">
        <div className="overflow-hidden bg-ais-blue py-[18px]">
          <p className="whitespace-nowrap text-center font-display text-[18px] tracking-[1.5px] text-white sm:text-[21px]">
            {MARQUEE}
          </p>
        </div>
      </div>

      {/* Past adventures */}
      <section className="mt-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[22px] font-semibold text-ink">
            Past Adventures
          </h2>
          <span className="font-ibm text-[12px] tracking-[0.2px] text-ais-blue">
            View Full Gallery →
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PAST.map((item) =>
            item.stat ? (
              <div
                key={item.label}
                className="flex h-[150px] flex-col items-center justify-center rounded-2xl border border-line bg-pill-amber"
              >
                <span className="font-heading text-[32px] font-bold tracking-[-0.4px] text-orange-text">
                  {item.label}
                </span>
                <span className="font-ibm text-[12px] tracking-[0.2px] text-orange-text">
                  STUDENTS ATTENDED
                </span>
              </div>
            ) : (
              <div
                key={item.label}
                className="flex h-[150px] items-center justify-center rounded-xl bg-placeholder"
              >
                <span className="font-ibm text-[11px] tracking-[1.5px] text-placeholder-text">
                  {item.label}
                </span>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
