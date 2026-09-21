"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

interface UserQrPassProps {
  ticketToken: string;
  userName: string;
  email?: string;
  membershipType?: string; // e.g. "AI_ACADEMY", "AIM_MENTEE", "INNOVATION_LABS"
  isActiveMember?: boolean;
  logoSrc?: string; // Defaults to "/ais_logo_setup.png"
}

export function UserQrPass({
  ticketToken,
  userName,
  email,
  membershipType,
  isActiveMember = true,
  logoSrc = "/ais_logo_setup.png",
}: UserQrPassProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keepScreenAwake, setKeepScreenAwake] = useState(false);

  // Screen Wake Lock API to prevent mobile screens from dimming during event check-in
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      if ("wakeLock" in navigator && keepScreenAwake) {
        try {
          wakeLock = await navigator.wakeLock.request("screen");
        } catch (err) {
          console.error("Wake Lock request failed:", err);
        }
      }
    }

    if (keepScreenAwake) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [keepScreenAwake]);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(ticketToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMembershipLabel = (type?: string) => {
    if (!type) return "MEMBER";
    return type.replace(/_/g, " ").toUpperCase();
  };

  return (
    <>
      {/* Main Pass Container */}
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-border-soft bg-white shadow-xl transition-all">
        {/* Pass Header Banner */}
        <div className="relative bg-brand p-6 text-center text-white">
          {/* Active Status Badge */}
          <div className="absolute top-4 right-4">
            {isActiveMember ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 style-caption font-semibold text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 style-caption font-semibold text-white/70">
                Inactive
              </span>
            )}
          </div>

          {/* Centered Apparent Logo Container */}
          <div className="flex justify-center pt-2">
            <div className="relative flex h-14 items-center justify-center rounded-2xl bg-ink/95 p-3 shadow-md  transition-transform hover:scale-105">
              <Image
                src={logoSrc}
                alt="AIS Logo"
                width={64}
                height={64}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>

          {/* Organization Title */}
          <span className="mt-4 block style-caption font-bold tracking-widest text-white/80 uppercase">
            AI Society Pass
          </span>

          {/* User Details */}
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight">
            {userName}
          </h3>
          {email && (
            <p className="style-caption text-white/80 truncate mt-1">{email}</p>
          )}
        </div>

        {/* High-Contrast QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-white p-6 pt-7">
          <div
            onClick={() => setIsFullscreen(true)}
            className="group relative cursor-pointer rounded-2xl border-2 border-border-soft/80 bg-white p-4 shadow-sm transition-all hover:border-brand/40 hover:shadow-md active:scale-95"
            title="Tap to enlarge QR code"
          >
            <QRCodeSVG
              value={ticketToken}
              size={190}
              level="H"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand/10 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
              <span className="rounded-lg bg-brand px-3 py-1.5 style-caption font-semibold text-white shadow-lg">
                🔍 Tap to Enlarge
              </span>
            </div>
          </div>

          {/* Token Copy Action */}
          <div className="mt-4 text-center">
            <button
              onClick={handleCopyToken}
              className="inline-flex items-center gap-2 rounded-lg border border-border-soft/80 bg-cream/80 px-3 py-1.5 style-caption font-mono font-medium text-ink transition-colors hover:bg-border-soft/50"
            >
              <span>{ticketToken.slice(0, 16)}...</span>
              <span className="text-xs font-bold text-brand">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
        </div>

        {/* Ticket Perforated Divider */}
        <div className="relative flex items-center justify-between border-t border-dashed border-border-soft/80 px-3">
          <div className="-ml-6 h-5 w-5 rounded-full bg-cream border-r border-border-soft" />
          <div className="-mr-6 h-5 w-5 rounded-full bg-cream border-l border-border-soft" />
        </div>

        {/* Membership Details & Controls */}
        <div className="bg-cream/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="style-caption text-ink-faint">Membership Tier</p>
              <p className="font-semibold text-ink tracking-wide mt-0.5">
                {formatMembershipLabel(membershipType)}
              </p>
            </div>
            <button
              onClick={() => setIsFullscreen(true)}
              className="style-caption font-semibold text-brand hover:underline"
            >
              Fullscreen
            </button>
          </div>

          {/* User Instructions */}
          <div className="mt-4 rounded-xl border border-border-soft/60 bg-white/80 p-3 text-center shadow-xs">
            <p className="style-caption text-ink-faint leading-snug">
              <strong className="text-ink">Tip:</strong> Screenshot this!
                Show this pass at <br/> {formatMembershipLabel(membershipType)} for attendance if asked.
            </p>
          </div>

          {/* Wake-lock Toggle */}
          <div className="mt-4 flex items-center justify-center border-t border-border-soft/60 pt-3">
            <label className="flex items-center gap-2 style-caption font-medium text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepScreenAwake}
                onChange={(e) => setKeepScreenAwake(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border-soft text-brand focus:ring-brand"
              />
              Keep screen awake at door
            </label>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal View for Door Scanners */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-purple-soft/95 p-6 text-ink backdrop-blur-md">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-xl bg-ink p-1.5 shadow-sm border border-border-soft">
                <Image
                  src={logoSrc}
                  alt="AIS Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="style-caption font-semibold tracking-wider text-ink-faint uppercase">
                {formatMembershipLabel(membershipType)} PASS
              </span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="rounded-full bg-white px-4 py-2 style-caption font-bold text-ink border border-border-soft hover:bg-border-soft/30 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="rounded-3xl border-2 border-border-soft bg-white p-6 shadow-2xl">
              <QRCodeSVG value={ticketToken} size={280} level="H" />
            </div>
            <p className="mt-6 font-display text-2xl font-bold text-ink">{userName}</p>
            <p className="font-mono text-xs text-ink-faint mt-1 tracking-wide">{ticketToken}</p>
          </div>

          <p className="style-caption text-center text-ink-faint pb-2">
            Present this QR code to an officer to check in.
          </p>
        </div>
      )}
    </>
  );
}