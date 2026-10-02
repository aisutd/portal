"use client";

import { useEffect, useRef } from "react";

// Same wave-blob technique as the site-wide/Academy gradient backgrounds,
// recolored to AIM's blue/green palette on a near-black backdrop, plus a
// twinkling starfield layer — the "space" feel the hub's reference design
// asked for, distinct from Academy's charcoal/gold treatment.

const COLORS = ["59,130,246", "34,197,94", "16,185,129", "99,102,241"]; // blue, green, emerald, indigo
const WAVE_COUNT = 8;
const THICKNESS_FRAC = 0.3;
const BACKDROP = "rgb(6, 8, 18)"; // near-black navy
const SCRIM_OPACITY = 0.55;
const STAR_COUNT = 90;

type Wave = {
  color: string;
  centerFrac: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  opacity: number;
};

type Star = {
  xFrac: number;
  yFrac: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
};

function buildWaves(): Wave[] {
  return Array.from({ length: WAVE_COUNT }, (_, i) => ({
    color: COLORS[i % COLORS.length],
    centerFrac: (i + 0.5) / WAVE_COUNT,
    amp: 36 + Math.random() * 34,
    freq: 0.0013 + Math.random() * 0.0011,
    speed: (0.00018 + Math.random() * 0.00024) * (i % 2 === 0 ? 1 : -1),
    phase: Math.random() * 1000,
    opacity: 0.28 + Math.random() * 0.1,
  }));
}

function buildStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    xFrac: Math.random(),
    yFrac: Math.random(),
    radius: 0.6 + Math.random() * 1.4,
    baseOpacity: 0.3 + Math.random() * 0.5,
    twinkleSpeed: 0.0008 + Math.random() * 0.0012,
    phase: Math.random() * 1000,
  }));
}

export function AimGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const waves = buildWaves();
    const stars = buildStars();

    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = BACKDROP;
      ctx!.fillRect(0, 0, width, height);
    }
    resize();
    window.addEventListener("resize", resize);

    function drawWave(w: Wave, t: number, parallax: number) {
      const thickness = height * THICKNESS_FRAC;
      const y0 = height * w.centerFrac - thickness / 2 - parallax;
      const step = Math.max(16, Math.round(width / 90));

      ctx!.beginPath();
      for (let x = 0; x <= width; x += step) {
        const y = y0 + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp;
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      for (let x = width; x >= 0; x -= step) {
        const y =
          y0 +
          thickness +
          Math.sin(x * w.freq * 1.15 + t * w.speed * 1.1 + w.phase + 1.7) * w.amp * 0.7;
        ctx!.lineTo(x, y);
      }
      ctx!.closePath();

      const grad = ctx!.createLinearGradient(0, y0 - w.amp, 0, y0 + thickness + w.amp);
      grad.addColorStop(0, `rgba(${w.color}, 0)`);
      grad.addColorStop(0.2, `rgba(${w.color}, ${w.opacity})`);
      grad.addColorStop(0.8, `rgba(${w.color}, ${w.opacity})`);
      grad.addColorStop(1, `rgba(${w.color}, 0)`);
      ctx!.fillStyle = grad;
      ctx!.fill();
    }

    function drawStars(t: number) {
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.phase);
        ctx!.beginPath();
        ctx!.arc(s.xFrac * width, s.yFrac * height, s.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${s.baseOpacity * twinkle})`;
        ctx!.fill();
      }
    }

    function draw(t: number) {
      const parallax = window.scrollY * 0.06;
      ctx!.fillStyle = BACKDROP;
      ctx!.fillRect(0, 0, width, height);
      for (const w of waves) drawWave(w, t, parallax);
      drawStars(t);
    }

    let raf = 0;
    let last = 0;
    let running = !reduceMotion && !document.hidden;

    function frame(t: number) {
      if (!running) return;
      if (t - last >= 32) {
        last = t;
        draw(t);
      }
      raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    function onVisibility() {
      const shouldRun = !reduceMotion && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[-5]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[-5]"
        style={{ backgroundColor: BACKDROP, opacity: SCRIM_OPACITY }}
      />
    </>
  );
}
