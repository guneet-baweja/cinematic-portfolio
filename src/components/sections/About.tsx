import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import "./About.css";

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      ".about__reveal",
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="about" id="about">
      <div className="container about__inner">
        <span className="eyebrow about__reveal">11 — About</span>
        <p className="about__statement about__reveal">
          I'm a video editor and motion designer working across SaaS, real estate, and brand film —
          built on the belief that pacing is the real product.
        </p>
        <div className="about__specialties about__reveal">
          <span>Narrative Editing</span>
          <span>Motion Graphics</span>
          <span>Color</span>
          <span>Sound Design</span>
          <span>Product Storytelling</span>
        </div>
      </div>
    </section>
  );
}
