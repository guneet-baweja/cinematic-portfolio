import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { useMotionContext } from "../../lib/MotionContext";
import "./CTA.css";

export function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const { lite } = useMotionContext();

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      ".cta__line span",
      { yPercent: 110 },
      {
        yPercent: 0,
        stagger: 0.1,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
      }
    );
  }, []);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn || lite) return;
    const moveX = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
    const moveY = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });

    const handleMove = (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      moveX(relX * 0.3);
      moveY(relY * 0.3);
    };
    const reset = () => {
      moveX(0);
      moveY(0);
    };

    btn.addEventListener("pointermove", handleMove);
    btn.addEventListener("pointerleave", reset);
    return () => {
      btn.removeEventListener("pointermove", handleMove);
      btn.removeEventListener("pointerleave", reset);
    };
  }, [lite]);

  return (
    <section ref={sectionRef} className="cta">
      <div className="container cta__inner">
        <h2 className="cta__heading">
          <div className="cta__line">
            <span>HAVE A STORY</span>
          </div>
          <div className="cta__line">
            <span>WORTH SHOWING?</span>
          </div>
        </h2>
        <a ref={buttonRef} href="#contact" className="cta__button">
          Start a project <span>→</span>
        </a>
      </div>
    </section>
  );
}
