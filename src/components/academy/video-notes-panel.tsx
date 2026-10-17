"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";
import { resolveVideoEmbed } from "@/lib/video-embed";

type VideoNotesPanelProps = {
  title: string;
  videoUrl: string | null;
  /** Distinct key per video so notes don't bleed between lessons. */
  notesKey: string;
  workshopId?: string;
  userId?: string;
  initiallyCompleted?: boolean;
  quizUrl?: string; // Optional: Pass a link/path to the quiz if needed
  onOpenQuiz?: () => void; // Optional: Or handle via callback/modal trigger
};

type YouTubePlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackRate(): number;
  destroy(): void;
};
type YouTubeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
        onPlaybackRateChange: (event: { target: YouTubePlayer }) => void;
      };
    }
  ) => YouTubePlayer;
};
declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
    academyYouTubeApiPromise?: Promise<void>;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (window.academyYouTubeApiPromise) return window.academyYouTubeApiPromise;

  window.academyYouTubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return window.academyYouTubeApiPromise;
}

export function VideoNotesPanel({
  title,
  videoUrl,
  notesKey,
  workshopId,
  userId,
  initiallyCompleted = false,
  quizUrl,
  onOpenQuiz,
}: VideoNotesPanelProps) {
  const storageKey = `academy-notes:${notesKey}`;
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(initiallyCompleted);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embed = resolveVideoEmbed(videoUrl);
  const isYouTube = embed?.kind === "iframe" && embed.src.includes("youtube-nocookie.com/embed/");

  useEffect(() => {
    if (initiallyCompleted) {
      setCompleted(true);
    }
  }, [initiallyCompleted]);

  useEffect(() => {
    if (!isYouTube || !workshopId || !userId || !iframeRef.current) return;
    let player: YouTubePlayer | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let disposed = false;
    let lastSentAt = 0;

    const saveProgress = async (target: YouTubePlayer) => {
      const playbackRate = target.getPlaybackRate();
      const currentTime = target.getCurrentTime();
      const duration = target.getDuration();
      if (!Number.isFinite(playbackRate) || playbackRate <= 0 || duration <= 0) return;

      const watchedSeconds = Math.floor(currentTime);
      const durationSeconds = Math.floor(duration);
      if (watchedSeconds >= durationSeconds * 0.5) setCompleted(true);
      lastSentAt = Date.now();
      try {
        await fetch("/api/academy/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, workshopId, watchedSeconds, duration: durationSeconds }),
          keepalive: true,
        });
      } catch {
        // Playback and the local completion indicator continue if the network is unavailable.
      }
    };

    void loadYouTubeApi().then(() => {
      if (disposed || !iframeRef.current || !window.YT?.Player) return;
      player = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: ({ target }) => {
            player = target;
          },
          onStateChange: ({ data, target }) => {
            if (data === 1) {
              if (heartbeat) clearInterval(heartbeat);
              heartbeat = setInterval(() => void saveProgress(target), 10_000);
            } else {
              if (heartbeat) clearInterval(heartbeat);
              heartbeat = null;
              if (data === 2 || data === 0) void saveProgress(target);
            }
          },
          onPlaybackRateChange: ({ target }) => void saveProgress(target),
        },
      });
    });

    const flushOnExit = () => {
      if (player && Date.now() - lastSentAt > 1_000) void saveProgress(player);
    };
    window.addEventListener("pagehide", flushOnExit);
    return () => {
      disposed = true;
      if (heartbeat) clearInterval(heartbeat);
      window.removeEventListener("pagehide", flushOnExit);
      player?.destroy();
    };
  }, [isYouTube, userId, workshopId]);

  useEffect(() => {
    try {
      setNotes(localStorage.getItem(storageKey) ?? "");
    } catch {
      // Private browsing / blocked storage
    }
  }, [storageKey]);

  function handleChange(value: string) {
    setNotes(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // Ignore
    }
  }

  return (
    <div className="flex flex-col gap-[20px] lg:flex-row">
      <div className="flex flex-[1.6] flex-col gap-[12px]">
        <div className="overflow-hidden rounded-[20px] border-[5px] border-[#d4af37]">
          {embed?.kind === "file" && (
            <video
              src={embed.src}
              controls
              className="aspect-video w-full bg-black"
              preload="metadata"
            />
          )}

          {embed?.kind === "iframe" && (
            <iframe
              ref={isYouTube ? iframeRef : undefined}
              src={isYouTube ? `${embed.src}?enablejsapi=1` : embed.src}
              title={title}
              className="aspect-video w-full bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {embed?.kind === "link" && (
            <a
              href={embed.src}
              target="_blank"
              rel="noreferrer"
              className="flex aspect-video w-full flex-col items-center justify-center gap-[8px] bg-[#181c25] px-[24px] text-center transition-colors hover:bg-[#1f2431]"
            >
              <ExternalLink className="h-6 w-6 text-[#d4af37]" />
              <span className="style-body-text text-white">Open the recording</span>
              <span className="style-caption text-white/60">
                This recording is hosted somewhere that can&apos;t be embedded here.
              </span>
            </a>
          )}

          {!embed && (
            <div className="flex aspect-video w-full items-center justify-center bg-[#181c25] px-[24px] text-center style-body-text text-white/60">
              The recording for this workshop hasn&apos;t been posted yet.
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-wrap justify-between items-center gap-4 rounded-2xl bg-[#181c25] p-4 sm:flex-row">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold tracking-wider text-[#d4af37] uppercase">
              Workshop
            </span>
            <h3 className="style-card-title tracking-widest pt-1 uppercase text-white">{title}</h3>
          </div>

          <div className="flex items-center gap-3">
            {workshopId && (
              <div
                aria-live="polite"
                className={`inline-flex w-fit h-fit shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                  completed
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
                }`}
              >
                {completed ? (
                  <span>Watched</span>
                ) : (
                  <span>Watch 50% to unlock quiz</span>
                )}
              </div>
            )}

            {/* --- QUIZ BUTTON ADDED HERE --- */}
            <Button
              variant="accent" // Use your accent variant which handles the gold style cleanly
              disabled={!completed}
              href={quizUrl}
              title={completed ? "Take the quiz" : "Watch at least 50% of the video to unlock the quiz"}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Take Quiz</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-[8px] rounded-[20px] border-[5px] border-[#d4af37] bg-[#181c25] p-[16px] lg:w-[320px] lg:shrink-0">
        <div className="flex flex-col gap-[2px]">
          <span className="style-card-title text-white">My Notes</span>
          <span className="style-caption text-white/60">
            Write down key concepts while you watch.
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Start typing..."
          className="min-h-[220px] flex-1 resize-none rounded-[12px] border border-[#2a2f3a] bg-[#e7e2d4] p-[12px] style-body-text text-ink outline-none focus:border-[#d4af37]"
        />
      </div>
    </div>
  );
}