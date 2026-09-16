import { useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { scrollState } from "../../lib/scrollState";
import { useMotionContext } from "../../lib/MotionContext";
import "./ThreeDShowcase.css";

const LABELS = ["FRAME 01", "FRAME 02", "FRAME 03"];

export function ThreeDShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const { lite } = useMotionContext();

  useScopedGsap(
    sectionRef,
    () => {
      const tags = gsap.utils.toArray<HTMLElement>(".showcase__tag");
      gsap.set(tags, { autoAlpha: 0, y: 20 });

      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: lite ? "+=80%" : "+=220%",
        pin: !lite,
        scrub: 1,
        onUpdate: (self) => {
          scrollState.showcase.progress = self.progress;
          const activeIndex = Math.min(tags.length - 1, Math.floor(self.progress * tags.length));
          tags.forEach((tag, i) => {
            gsap.to(tag, { autoAlpha: i === activeIndex ? 1 : 0, y: i === activeIndex ? 0 : 20, duration: 0.3, overwrite: "auto" });
          });
        },
      });
    },
    [lite]
  );

  return (
    <section ref={sectionRef} className="showcase">
      <div id="showcase-3d-zone" ref={pinRef} className="showcase__pin">
        <span className="eyebrow showcase__eyebrow">08 — Inside the Edit</span>
        <div className="showcase__tags">
          {LABELS.map((label) => (
            <span key={label} className="showcase__tag">
              {label}
            </span>
          ))}
        </div>
        <h2 className="showcase__title">A studio built from footage, not furniture.</h2>
      </div>
    </section>
  );
}
