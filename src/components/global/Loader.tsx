import { useEffect, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import "./Loader.css";

export function Loader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.body.classList.add("is-loading");
    const counter = { value: 0 };
    let doneCalled = false;

    const finish = () => {
      if (doneCalled) return;
      doneCalled = true;
      document.body.classList.remove("is-loading");

      if (rootRef.current) {
        gsap.to(rootRef.current, {
          opacity: 0,
          scale: 1.04,
          duration: 0.6,
          ease: "power3.inOut",
          onComplete: () => {
            setVisible(false);
            onDone();
          },
        });
      } else {
        setVisible(false);
        onDone();
      }
    };

    // Safety fallback: ensure loader never blocks screen if animation gets throttled
    const safetyTimer = setTimeout(() => {
      finish();
    }, 3200);

    const tl = gsap.timeline({
      onComplete: finish,
    });

    tl.to(counter, {
      value: 100,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => {
        const val = Math.round(counter.value);
        if (numberRef.current) numberRef.current.textContent = String(val);
        if (barRef.current) barRef.current.style.transform = `scaleX(${counter.value / 100})`;

        // Live Frame Scrubber Telemetry (0 to 2160 frames)
        if (frameRef.current) {
          const currentFrame = Math.floor((counter.value / 100) * 2160);
          frameRef.current.textContent = String(currentFrame).padStart(4, "0");
        }
      },
    })
      .call(() => {
        // Climax message at 100%
        if (statusRef.current) {
          statusRef.current.textContent = "100% // CUT TO BLACK.";
          statusRef.current.classList.add("is-cut-to-black");
        }
      })
      .to({}, { duration: 0.35 }); // deliberate pause on CUT TO BLACK

    return () => {
      clearTimeout(safetyTimer);
      document.body.classList.remove("is-loading");
      tl.kill();
    };
  }, [onDone]);

  if (!visible) return null;

  return (
    <div ref={rootRef} className="loader" role="status" aria-label="Loading Cinematic Timeline">
      <div className="loader__header">
        <span className="loader__badge">PROJECT: THE ARCHITECT OF TIME</span>
        <span className="loader__smpte">SMPTE: 00:00:00:00</span>
      </div>

      <div className="loader__center">
        <div ref={statusRef} className="loader__status">
          RENDERING TIMELINE // INITIALIZING TEMPORAL CAUSALITY
        </div>

        <div className="loader__telemetry">
          <span className="loader__label">FRAME:</span>
          <span ref={frameRef} className="loader__frame">[0000]</span>
          <span className="loader__dim">/ 2160</span>
        </div>

        <div className="loader__count-wrap">
          <span ref={numberRef} className="loader__count">0</span>
          <span className="loader__percent">%</span>
        </div>

        <div className="loader__track">
          <div ref={barRef} className="loader__bar" />
        </div>
      </div>

      <div className="loader__footer">
        <span>ESTABLISHING VOLUMETRIC CONTINUOUS FILM GRAPH</span>
        <span>24.000 FPS</span>
      </div>
    </div>
  );
}
