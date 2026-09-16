import { useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { scrollState } from "../../lib/scrollState";
import { useMotionContext } from "../../lib/MotionContext";
import "./Hero.css";

const ROLES = ["VIDEO EDITOR", "MOTION DESIGNER", "DIGITAL STORYTELLER"];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const { lite } = useMotionContext();

  useScopedGsap(
    sectionRef,
    () => {
      // entrance: title lines rise in, role label crossfades
      const lines = titleRef.current?.querySelectorAll(".hero__line span") ?? [];
      gsap.fromTo(
        lines,
        { yPercent: 130, rotate: 3 },
        { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.12, ease: "power4.out", delay: 0.15 }
      );
      gsap.fromTo(
        roleRef.current,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 1, delay: 0.9 }
      );
      gsap.fromTo(cueRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 1.4 });

      // scroll-pinned zoom: writes progress into scrollState for the 3D object,
      // and scales/dims the DOM title as the camera "dollies" past it
      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: lite ? "+=60%" : "+=140%",
        pin: !lite,
        scrub: 1,
        onUpdate: (self) => {
          scrollState.hero.progress = self.progress;
          gsap.set(titleRef.current, {
            scale: 1 - self.progress * 0.25,
            autoAlpha: 1 - self.progress * 1.3,
          });
          gsap.set(cueRef.current, { autoAlpha: 1 - self.progress * 4 });
        },
      });

      // cycle role label
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % ROLES.length;
        gsap.to(roleRef.current, {
          autoAlpha: 0,
          y: -8,
          duration: 0.35,
          onComplete: () => {
            if (roleRef.current) roleRef.current.textContent = ROLES[i];
            gsap.fromTo(roleRef.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 });
          },
        });
      }, 2600);

      return () => clearInterval(interval);
    },
    [lite]
  );

  return (
    <section ref={sectionRef} className="hero" id="top">
      <div id="hero-3d-zone" ref={pinRef} className="hero__pin">
        <div className="hero__content">
          <div ref={titleRef} className="hero__title">
            <div className="hero__line">
              <span>PRECISION</span>
            </div>
            <div className="hero__line">
              <span>IN MOTION.</span>
            </div>
          </div>
          <div ref={roleRef} className="hero__role eyebrow">
            {ROLES[0]}
          </div>
        </div>
        <div ref={cueRef} className="hero__cue">
          <span>Scroll</span>
          <div className="hero__cue-line" />
        </div>
      </div>
    </section>
  );
}
