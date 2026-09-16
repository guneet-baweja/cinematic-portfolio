import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { process } from "../../data/content";
import "./Process.css";

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);

  useScopedGsap(sectionRef, () => {
    gsap.to(".process__fill", {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 70%",
        end: "bottom 60%",
        scrub: 0.5,
      },
    });

    gsap.utils.toArray<HTMLElement>(".process-step").forEach((step) => {
      gsap.fromTo(
        step,
        { autoAlpha: 0.3, x: -12 },
        {
          autoAlpha: 1,
          x: 0,
          scrollTrigger: { trigger: step, start: "top 75%", end: "top 45%", scrub: 0.5 },
        }
      );
    });
  }, []);

  return (
    <section ref={sectionRef} className="process">
      <div className="container process__inner">
        <span className="eyebrow">10 — Process</span>
        <div className="process__timeline">
          <div className="process__track">
            <div className="process__fill" />
          </div>
          <ol className="process__steps">
            {process.map((item) => (
              <li key={item.step} className="process-step">
                <span className="process-step__num">{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
