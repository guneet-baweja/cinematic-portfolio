import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import "./MotionDesignSection.css";

const WORDS = ["EDITING", "MOTION", "STORYTELLING"];

export function MotionDesignSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useScopedGsap(sectionRef, () => {
    gsap.utils.toArray<HTMLElement>(".motion-word").forEach((word, i) => {
      gsap.fromTo(
        word,
        { xPercent: i % 2 === 0 ? -12 : 12, skewX: i % 2 === 0 ? 6 : -6, opacity: 0.25 },
        {
          xPercent: 0,
          skewX: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: word,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.6,
          },
        }
      );
    });

    gsap.to(".motion-shape", {
      rotate: 180,
      ease: "none",
      scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  }, []);

  return (
    <section ref={sectionRef} className="motion-design">
      <div className="motion-shape" aria-hidden />
      <div className="container motion-design__inner">
        <span className="eyebrow">07 — Motion Design</span>
        <div className="motion-design__words">
          {WORDS.map((word) => (
            <h2 key={word} className="motion-word">
              {word}
            </h2>
          ))}
        </div>
        <p className="motion-design__note">
          I don't only cut — I build the graphics, transitions, and kinetic type that make the cut feel
          designed rather than assembled.
        </p>
      </div>
    </section>
  );
}
