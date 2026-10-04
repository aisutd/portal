"use client";

import { useEffect, useRef } from "react";

// Same wave-blob technique as the site-wide GradientWavesBackground, recolored
// to a restrained blue/gray palette (no gold — that's reserved for buttons and
// badges, not the ambient backdrop) and darkened to match the academy's
// charcoal backdrop instead of the site's cream. Mounted per-page (not in the
// root layout) since it's specific to this section's theme.

const COLORS = ["47,95,232", "122,162,255", "97,101,116", "42,47,58"]; // brand blue, light blue, mid slate, dark slate
const WAVE_COUNT = 9;
const THICKNESS_FRAC = 0.32;
const BACKDROP = "rgb(67, 70, 85)"; // matches the academy page's #434655 background
const SCRIM_OPACITY = 0.5;

type Wave = {
  color: string;
  centerFrac: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  opacity: number;
};

function buildWaves(): Wave[] {
  return Array.from({ length: WAVE_COUNT }, (_, i) => ({
    color: COLORS[i % COLORS.length],
    centerFrac: (i + 0.5) / WAVE_COUNT,
    amp: 42 + Math.random() * 38,
    freq: 0.0013 + Math.random() * 0.0011,
    speed: (0.00018 + Math.random() * 0.00024) * (i % 2 === 0 ? 1 : -1),
    phase: Math.random() * 1000,
    opacity: 0.32 + Math.random() * 0.12,
  }));
}

export function AcademyGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const waves = buildWaves();

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

      
      const padding = 100;
      const startX = -padding;
      const endX = width + padding;

      ctx!.beginPath();
      for (let x = startX; x <= endX; x += step) {
        const y = y0 + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp;
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      for (let x = endX; x >= startX; x -= step) {
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

    function draw(t: number) {
      const parallax = window.scrollY * 0.06;
      ctx!.fillStyle = BACKDROP;
      ctx!.fillRect(0, 0, width, height);
      for (const w of waves) {
        drawWave(w, t, parallax);
      }
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
      {/* Less negative than the site-wide GradientWavesBackground's -z-10 (mounted
          in the root layout) so this page's own dark canvas wins the stacking
          order instead of the light cream one showing through underneath it. */}
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
