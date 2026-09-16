import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { VideoProject } from "./VideoProject";
import { beforeAfterExample } from "../../data/projects";
import "./BeforeAfterSlider.css";

const MAGNET_RADIUS = 90;
const MAGNET_STRENGTH = 22;

export function BeforeAfterSlider() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const splitRef = useRef(0);

  const setSplit = useCallback((percent: number) => {
    const clamped = gsap.utils.clamp(0, 100, percent);
    splitRef.current = clamped;
    if (frameRef.current) frameRef.current.style.setProperty("--split", `${clamped}%`);
  }, []);

  useScopedGsap(sectionRef, () => {
    const counter = { value: 0 };
    gsap.to(counter, {
      value: 50,
      ease: "power2.out",
      onUpdate: () => setSplit(counter.value),
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 65%",
        toggleActions: "play none none none",
      },
    });

    gsap.fromTo(
      ".before-after__label",
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSplit(((clientX - rect.left) / rect.width) * 100);
    },
    [setSplit]
  );

  // Magnetic pull: the handle nudges toward the pointer whenever the
  // cursor comes near it, independent of whether the user is actively
  // dragging — a subtle "it wants to be grabbed" cue.
  useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    if (!isFine || !knobRef.current) return;

    const knob = knobRef.current;
    gsap.set(knob, { xPercent: -50, yPercent: -50 });
    const moveX = gsap.quickTo(knob, "x", { duration: 0.35, ease: "power3" });
    const moveY = gsap.quickTo(knob, "y", { duration: 0.35, ease: "power3" });

    const handlePointer = (e: PointerEvent) => {
      if (dragging) return;
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;

      const knobX = rect.left + (splitRef.current / 100) * rect.width;
      const knobY = rect.top + rect.height / 2;
      const dx = e.clientX - knobX;
      const dy = e.clientY - knobY;
      const dist = Math.hypot(dx, dy);

      if (dist < MAGNET_RADIUS) {
        const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_STRENGTH;
        moveX((dx / (dist || 1)) * pull);
        moveY((dy / (dist || 1)) * pull);
      } else {
        moveX(0);
        moveY(0);
      }
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, [dragging]);

  return (
    <section ref={sectionRef} className="before-after">
      <div className="container">
        <span className="eyebrow">06 — Before / After</span>
        <h2 className="before-after__heading">Same footage. Two decisions.</h2>
        <p className="before-after__note">{beforeAfterExample.description}</p>

        <div
          ref={frameRef}
          className="before-after__frame"
          style={{ ["--split" as string]: "0%" }}
          data-cursor="drag"
          onPointerDown={(e) => {
            setDragging(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updateFromPointer(e.clientX);
          }}
          onPointerMove={(e) => dragging && updateFromPointer(e.clientX)}
          onPointerUp={() => setDragging(false)}
        >
          <div className="before-after__layer before-after__layer--raw">
            <VideoProject src={beforeAfterExample.rawVideo} poster={beforeAfterExample.rawPoster} />
            <span className="before-after__label before-after__label--raw">RAW LOG</span>
          </div>
          <div className="before-after__layer before-after__layer--final">
            <VideoProject src={beforeAfterExample.finalVideo} poster={beforeAfterExample.finalPoster} />
            <span className="before-after__label before-after__label--final">COLOR GRADED</span>
          </div>
          <div ref={dividerRef} className="before-after__divider">
            <span ref={knobRef} className="before-after__knob" />
          </div>
        </div>
      </div>
    </section>
  );
}
