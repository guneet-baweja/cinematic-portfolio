import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { TechDiagram } from "./TechDiagram";
import "./SaasSection.css";

export function SaasSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      ".saas__copy > *",
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="saas">
      <div className="container saas__inner">
        <div className="saas__copy">
          <span className="eyebrow">03 — SaaS</span>
          <h2>
            I turn complex products
            <br />
            into clear visual stories.
          </h2>
          <p>
            Every product edit is a small piece of systems design — the UI choreography below is a
            simplified version of the same map I build before touching a single cut.
          </p>
        </div>
        <div className="saas__diagram">
          <TechDiagram />
        </div>
      </div>
    </section>
  );
}
