import { useMemo, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import "./Intro.css";

const MANIFESTO =
  "I don't just cut footage. I build the rhythm a viewer feels before they understand why — precision editing and motion design for brands that move fast and mean it.";

export function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsWrapRef = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => MANIFESTO.split(" "), []);

  useScopedGsap(sectionRef, () => {
    const spans = wordsWrapRef.current?.querySelectorAll("span");
    if (!spans?.length) return;

    gsap.set(spans, { opacity: 0.14 });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      end: "bottom 40%",
      scrub: 0.6,
      onUpdate: (self) => {
        const revealCount = Math.floor(self.progress * spans.length);
        spans.forEach((span, i) => {
          gsap.to(span, { opacity: i < revealCount ? 1 : 0.14, duration: 0.25, overwrite: "auto" });
        });
      },
    });
  }, []);

  return (
    <section ref={sectionRef} className="intro">
      <div className="container intro__inner">
        <span className="eyebrow">01 — Introduction</span>
        <p ref={wordsWrapRef} className="intro__text">
          {words.map((word, i) => (
            <span key={i}>{word} </span>
          ))}
        </p>
      </div>
    </section>
  );
}
