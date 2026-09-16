import { useEffect, useMemo, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { scrollState } from "../../lib/scrollState";
import { useMotionContext } from "../../lib/MotionContext";
import "./FloatingHudRects.css";

interface Rect {
  left: string;
  top: string;
  size: number;
  amplitude: number;
  frequency: number;
  phase: number;
  spin: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function FloatingHudRects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { lite } = useMotionContext();

  const rects = useMemo<Rect[]>(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 9 }, () => ({
      left: `${(rand() * 92 + 4).toFixed(1)}%`,
      top: `${(rand() * 92 + 4).toFixed(1)}%`,
      size: 14 + rand() * 30,
      amplitude: 40 + rand() * 90,
      frequency: 2 + rand() * 4,
      phase: rand() * Math.PI * 2,
      spin: rand() > 0.5 ? 1 : -1,
    }));
  }, []);

  useEffect(() => {
    if (lite) return;
    const nodes = containerRef.current?.querySelectorAll<HTMLDivElement>(".hud-rect");
    if (!nodes?.length) return;

    const tick = () => {
      const progress = scrollState.progress;
      const parallax = scrollState.physics.secondaryParallax;
      const t = scrollState.ambient.clockTime;
      nodes.forEach((node, i) => {
        const r = rects[i];
        const parallaxY = parallax * (r.amplitude * 0.45);
        // Category A (progress) + Category B (parallax) + Category C (ambient float)
        const ambientFloat = Math.sin(t * (r.frequency * 0.25) + r.phase) * 8;
        const y = Math.sin(progress * r.frequency * Math.PI + r.phase) * r.amplitude + parallaxY + ambientFloat;
        const rot = progress * 360 * 0.3 * r.spin + r.phase * 20 + Math.cos(t * 0.3 + r.phase) * 2.5;
        gsap.set(node, { y, rotate: rot });
      });
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [lite, rects]);

  if (lite) return null;

  return (
    <div ref={containerRef} className="hud-rects" aria-hidden>
      {rects.map((r, i) => (
        <div
          key={i}
          className="hud-rect"
          style={{ left: r.left, top: r.top, width: r.size, height: r.size * 0.62 }}
        />
      ))}
    </div>
  );
}
