import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { scrollState } from "../../store/scrollState";
import { addFrameListener, removeFrameListener } from "../../lib/lenis";
import { APPLE_CURVE_NAMES } from "../../lib/motion/appleCurves";
import "./NarrativeOverlay.css";

interface ActPhase {
  threshold: number;
  tagline: string;
  subtext?: string;
}

interface ActNarrative {
  title: string;
  phases: ActPhase[];
}

const NARRATIVES: Record<number, ActNarrative> = {
  3: {
    title: "THE WORK ARCHIVE",
    phases: [
      {
        threshold: 0,
        tagline: "The timeline becomes film.",
        subtext: "Continuous flight through the hyperspeed film strip tunnel.",
      },
      {
        threshold: 0.45,
        tagline: "Every cut is intentional. Every frame is earned.",
        subtext: "Mastered timelines crafted to the millisecond.",
      },
      {
        threshold: 0.80,
        tagline: "MASTERED TIMELINES & SELECTED WORKS.",
        subtext: "Commercial edits, creator reels, and high-retention motion identity.",
      },
    ],
  },
};

export function NarrativeOverlay({ onOpenWork }: { onOpenWork: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaWrapRef = useRef<HTMLDivElement>(null);

  const lastActRef = useRef(-1);
  const lastPhaseRef = useRef(-1);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const setContainerOpacity = gsap.quickSetter(containerRef.current, "opacity");

      const loop = () => {
        const act = scrollState.act;
        const actP = scrollState.actProgress;

        const currentNarrative = NARRATIVES[3];
        const phases = currentNarrative.phases;

        let phaseIdx = 0;
        for (let i = phases.length - 1; i >= 0; i--) {
          if (actP >= phases[i].threshold) {
            phaseIdx = i;
            break;
          }
        }

        const actChanged = act !== lastActRef.current;
        const phaseChanged = phaseIdx !== lastPhaseRef.current;

        if (actChanged || phaseChanged) {
          lastActRef.current = act;
          lastPhaseRef.current = phaseIdx;

          const activePhase = phases[phaseIdx];

          if (badgeRef.current) {
            badgeRef.current.textContent = `ACT 03 / 03 — THE WORK ARCHIVE`;
          }
          if (titleRef.current) {
            titleRef.current.textContent = currentNarrative.title;
          }
          if (taglineRef.current) {
            taglineRef.current.textContent = activePhase.tagline;
          }
          if (subtextRef.current) {
            subtextRef.current.textContent = activePhase.subtext || "";
          }

          // Climax CTA visibility
          if (ctaWrapRef.current) {
            if (actP >= 0.75) {
              ctaWrapRef.current.style.display = "block";
              const ctaProgress = Math.min(1, (actP - 0.75) / 0.15);
              ctaWrapRef.current.style.opacity = String(ctaProgress);
            } else {
              ctaWrapRef.current.style.display = "none";
            }
          }

          // GSAP Typographic Staggered Micro-Reveal (Apple-Level Motion Quality)
          // 1. Act badge: crisp monospace tracking & fade
          if (badgeRef.current) {
            gsap.fromTo(
              badgeRef.current,
              { opacity: 0.3, letterSpacing: "0.36em", y: 4 },
              { opacity: 1, letterSpacing: "0.28em", y: 0, duration: 0.38, ease: APPLE_CURVE_NAMES.TYPOGRAPHY, overwrite: "auto" }
            );
          }

          // 2. Title: leads with dignified optical ease, subtle Y lift, and tracking contraction
          if (titleRef.current) {
            gsap.fromTo(
              titleRef.current,
              { opacity: 0.1, y: 12, letterSpacing: "0.04em" },
              { opacity: 1, y: 0, letterSpacing: "-0.02em", duration: 0.48, ease: APPLE_CURVE_NAMES.TYPOGRAPHY, overwrite: "auto" }
            );
          }

          // 3. Tagline: follows with hierarchical +45ms stagger and smooth settling
          if (taglineRef.current) {
            gsap.fromTo(
              taglineRef.current,
              { opacity: 0.05, y: 9 },
              { opacity: 0.92, y: 0, duration: 0.42, delay: 0.045, ease: APPLE_CURVE_NAMES.TYPOGRAPHY, overwrite: "auto" }
            );
          }

          // 4. Subtext: follows with +85ms stagger
          if (subtextRef.current) {
            gsap.fromTo(
              subtextRef.current,
              { opacity: 0.0, y: 7 },
              { opacity: 0.55, y: 0, duration: 0.36, delay: 0.085, ease: APPLE_CURVE_NAMES.TYPOGRAPHY, overwrite: "auto" }
            );
          }
        }

        // Smooth C2 envelope fade upon handoff from Genesis
        let alpha = 1.0;
        if (actP < 0.04) {
          alpha = Math.min(1.0, actP / 0.04);
        } else if (actP > 0.94) {
          alpha = Math.max(0.2, 1.0 - (actP - 0.94) / 0.06);
        }

        setContainerOpacity(Math.max(0.02, alpha));
      };

      // Unified loop subscriber: executes in sync with GSAP ticker
      loop();
      addFrameListener(loop);
      return () => {
        removeFrameListener(loop);
      };
    },
    { scope: containerRef }
  );

  const initial = NARRATIVES[3];

  return (
    <div
      ref={containerRef}
      className="narrative-overlay"
      style={{ opacity: 1 }}
    >
      <div className="narrative-overlay__container">
        <div ref={badgeRef} className="narrative-overlay__act-badge">
          ACT 03 / THE FINAL CINEMA
        </div>

        <h2 ref={titleRef} className="narrative-overlay__title">
          {initial.title}
        </h2>

        <p ref={taglineRef} className="narrative-overlay__tagline">
          {initial.phases[0].tagline}
        </p>

        <p ref={subtextRef} className="narrative-overlay__subtext">
          {initial.phases[0].subtext}
        </p>

        {/* Act 10 Climax CTA */}
        <div
          ref={ctaWrapRef}
          className="narrative-overlay__cta-wrap"
          style={{ display: "none" }}
        >
          <button
            id="enter-the-work-btn"
            type="button"
            className="narrative-overlay__cta"
            data-cursor-magnetic
            onClick={onOpenWork}
          >
            <span>ENTER THE WORK ARCHIVE</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
