import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { useMotionContext } from "../../lib/MotionContext";
import { scrollState } from "../../lib/scrollState";
import { categories } from "../../data/content";
import "./WhatIDo.css";

const WORD = "RENAISSANCE";

// Kinetic Typography Configuration:
// 4 stacked absolute layers. At rest (velocity = 0), all offsets are 0
// so they snap into a single razor-sharp, crisp white word.
// During scroll, Lenis velocity pulls them apart horizontally with skew & blur.
const LAYERS = [
  { id: 0, sensitivity: 28, skewFactor: -16, blurFactor: 10 },
  { id: 1, sensitivity: -20, skewFactor: 12, blurFactor: 7 },
  { id: 2, sensitivity: 12, skewFactor: -8, blurFactor: 4 },
  { id: 3, sensitivity: 0, skewFactor: 0, blurFactor: 0 }, // Crisp anchor layer
];

export function WhatIDo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { lite } = useMotionContext();
  const smoothedVelocity = useRef(0);

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      stageRef.current,
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, duration: 1, scrollTrigger: { trigger: sectionRef.current, start: "top 70%" } }
    );

    gsap.fromTo(
      ".what-i-do__tag",
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: "top 55%" },
      }
    );
  }, []);

  // Kinetic Typography: Driven by Lenis scroll velocity via GSAP ticker
  useEffect(() => {
    if (lite) return;
    const layers = stageRef.current?.querySelectorAll<HTMLElement>(".renaissance-layer");
    if (!layers?.length) return;

    const tick = () => {
      // scrollState.velocity is directly updated by Lenis
      const rawVelocity = scrollState.velocity; 
      // Dampen velocity smoothly so it snaps back crisp when scrolling stops
      smoothedVelocity.current = gsap.utils.interpolate(smoothedVelocity.current, rawVelocity, 0.15);
      const v = Math.abs(smoothedVelocity.current) < 0.001 ? 0 : smoothedVelocity.current;

      layers.forEach((layer, i) => {
        const cfg = LAYERS[i];
        if (cfg.sensitivity === 0) {
          // Anchor layer stays crisp and pinned at center
          gsap.set(layer, { x: 0, skewX: 0, filter: "none" });
        } else {
          const offsetX = v * cfg.sensitivity;
          const skewVal = v * cfg.skewFactor;
          const blurVal = Math.min(12, Math.abs(v) * cfg.blurFactor);

          gsap.set(layer, {
            x: `${offsetX}%`,
            skewX: skewVal,
            filter: blurVal > 0.1 ? `blur(${blurVal.toFixed(1)}px)` : "none",
          });
        }
      });
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [lite]);

  return (
    <section ref={sectionRef} className="what-i-do" id="services-preview">
      <div className="what-i-do__inner">
        <span className="eyebrow what-i-do__eyebrow">02 — What I Do</span>

        <div ref={stageRef} className="what-i-do__stage">
          {LAYERS.map((layer) => (
            <h2 key={layer.id} className={`renaissance-layer renaissance-layer--${layer.id}`}>
              {WORD}
            </h2>
          ))}
        </div>

        <div className="what-i-do__tags">
          {categories.map((cat) => (
            <span key={cat.label} className="what-i-do__tag">
              {cat.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
