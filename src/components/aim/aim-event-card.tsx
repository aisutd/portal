import React from "react";

interface AimEventCardProps {
  event: any;
}

export function AimEventCard({ event }: AimEventCardProps) {
  const isCheckedIn = event.attendances && event.attendances.length > 0;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-[#2a2f3a] bg-[#181c25] p-5 transition-all duration-200 hover:-translate-y-[2px] hover:border-[#2563eb]/60">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#2563eb]/20 px-3 py-1 text-xs font-semibold text-[#9db8ff]">
            AIM Night
          </span>
          {isCheckedIn && (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
              Attended
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white">{event.title}</h3>
        <p className="line-clamp-2 text-sm text-white/70">{event.description}</p>
      </div>

      <div className="border-t border-white/10 pt-3 text-xs text-white/60">
        <p>📍 {event.location}</p>
        <p>
          📅{" "}
          {new Date(event.startTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}