import { Suspense, lazy, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { useMotionContext } from "../../lib/MotionContext";
import "./RealEstateSection.css";

const ShaderImage = lazy(() => import("./ShaderImage").then((m) => ({ default: m.ShaderImage })));

export function RealEstateSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { lite } = useMotionContext();

  useScopedGsap(
    sectionRef,
    () => {
      gsap.fromTo(
        frameRef.current,
        { clipPath: "inset(18% 18% 18% 18% round 4px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 4px)",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
            end: "top 10%",
            scrub: 0.6,
          },
        }
      );

      if (!lite) {
        gsap.to(frameRef.current, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }
    },
    [lite]
  );

  return (
    <section ref={sectionRef} className="real-estate">
      <div className="container real-estate__inner">
        <div className="real-estate__copy">
          <span className="eyebrow">04 — Real Estate</span>
          <h2>Property films that sell a feeling first.</h2>
          <p>
            Slow glides, negative space, and light doing most of the talking — cut for the kind of
            buyer who scrolls fast and stops for exactly one thing.
          </p>
        </div>
        <div ref={frameRef} className="real-estate__frame">
          {lite ? (
            <img src="/images/real-estate-poster.jpg" alt="Real estate footage preview" className="real-estate__fallback" />
          ) : (
            <Suspense fallback={<img src="/images/real-estate-poster.jpg" alt="Real estate footage preview" className="real-estate__fallback" />}>
              <ShaderImage src="/images/real-estate-poster.jpg" className="real-estate__canvas" />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}
