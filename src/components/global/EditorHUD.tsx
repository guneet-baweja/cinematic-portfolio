import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { getLenis, addFrameListener, removeFrameListener, getIsGenesisActive } from "../../lib/lenis";
import { scrollState } from "../../store/scrollState";
import "./EditorHUD.css";

const ACT_TOOLS: Record<number, string> = {
  1: "MAGNETIC VAULT",
  2: "RAZOR BLADE",
  3: "TOURBILLON CHRONOMETER",
  4: "MASTER CINEMA",
};

interface EditorHUDProps {
  onOpenWork?: () => void;
  onToggleSound?: () => void;
  isMuted?: boolean;
}

/**
 * EditorHUD
 * ---------
 * Strict typography system with zero-jitter tabular-nums for all telemetry.
 * Driven strictly by authoritative scrollState.
 */
export function EditorHUD({
  onOpenWork,
  onToggleSound,
  isMuted = true,
}: EditorHUDProps) {
  // Dynamic Value Containers (Tabular Monospace DOM Refs)
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const actRef = useRef<HTMLSpanElement>(null);
  const dirRef = useRef<HTMLSpanElement>(null);
  const toolRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pad = (n: number, width = 2) => String(n).padStart(width, "0");

    let lastProgress = -1;
    let lastAct = -1;
    let lastDir = 999;

    const renderTelemetry = () => {
      const p = scrollState.progress;
      const act = scrollState.act;
      const dir = scrollState.direction;
      const timecode = scrollState.timecode;
      const frameIndex = scrollState.frameIndex;

      // Always keep timecode and frame accurate
      if (timecodeRef.current && timecodeRef.current.textContent !== timecode) {
        timecodeRef.current.textContent = timecode;
      }
      if (frameRef.current) {
        frameRef.current.textContent = `[${pad(frameIndex, 4)}]`;
      }

      // Update Scrubber position
      if (scrubberRef.current && Math.abs(p - lastProgress) > 0.0001) {
        lastProgress = p;
        gsap.set(scrubberRef.current, {
          left: `${p * 100}%`,
          xPercent: -50,
        });
      }

      // Update Act & Tool name
      const isGenesis = getIsGenesisActive();
      if (isGenesis) {
        if (actRef.current && actRef.current.textContent !== "[GEN]") {
          actRef.current.textContent = "[GEN]";
        }
        if (toolRef.current && toolRef.current.textContent !== "PORTRAIT LOCK") {
          toolRef.current.textContent = "PORTRAIT LOCK";
        }
        if (frameRef.current && frameRef.current.textContent !== "[0000]") {
          frameRef.current.textContent = "[0000]";
        }
      } else if (act !== lastAct) {
        lastAct = act;
        if (actRef.current) {
          actRef.current.textContent = `[${pad(act, 2)}]`;
        }
        if (toolRef.current) {
          toolRef.current.textContent = ACT_TOOLS[act] || "MASTER TRIGGER";
        }
      }

      // Update Direction
      if (dir !== lastDir) {
        lastDir = dir;
        if (dirRef.current) {
          dirRef.current.textContent =
            dir === 0 ? "● STANDBY" : dir > 0 ? "► FWD" : "◄ REV";
          dirRef.current.style.color =
            dir === 0 ? "#22c55e" : dir > 0 ? "#FF5F1F" : "#38bdf8";
        }
      }
    };

    // Initial render
    renderTelemetry();

    // Single unified animation loop subscriber (GSAP Ticker)
    addFrameListener(renderTelemetry);

    return () => {
      removeFrameListener(renderTelemetry);
    };
  }, []);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetP = Math.max(0, Math.min(1, clickX / rect.width));
    const lenis = getLenis();
    if (lenis && lenis.limit) {
      lenis.scrollTo(targetP * lenis.limit, { immediate: false, duration: 0.6 });
    } else {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      window.scrollTo({ top: targetP * maxScroll, behavior: "smooth" });
    }
  };

  return (
    <aside className="editor-hud" aria-label="Editor Heads-Up Display">
      {/* Top Bar */}
      <div className="editor-hud__top-bar">
        {/* Top Left: Title Label with Live REC Tally | Value Timecode */}
        <div className="editor-hud__top-left">
          <div className="editor-hud__rec-wrap">
            <span className="editor-hud__rec-dot" aria-hidden />
            <span className="editor-hud__label editor-hud__title">THE ARCHITECT OF TIME</span>
          </div>
          <span className="editor-hud__divider editor-hud__desktop-only">|</span>
          <span
            ref={timecodeRef}
            className="editor-hud__val editor-hud__val--accent editor-hud__timecode editor-hud__desktop-only"
          >
            00:00:00:00
          </span>
        </div>

        {/* Top Right: Interactive Controls */}
        <div className="editor-hud__top-right">
          <button
            type="button"
            className="editor-hud__btn editor-hud__desktop-only"
            data-cursor-magnetic
            onClick={onToggleSound}
            aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            <span className="editor-hud__label">SOUND:</span>{" "}
            <span className="editor-hud__val">{isMuted ? "OFF" : "ON"}</span>
          </button>
          <button
            type="button"
            className="editor-hud__btn editor-hud__btn--accent"
            data-cursor-magnetic
            onClick={onOpenWork}
          >
            <span className="editor-hud__val editor-hud__val--accent">
              WORK VAULT [9]
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="editor-hud__bottom-bar">
        {/* Bottom Left: Frame | Direction | Act */}
        <div className="editor-hud__bottom-left">
          <div className="editor-hud__item editor-hud__desktop-only">
            <span className="editor-hud__label">FRAME:</span>{" "}
            <span ref={frameRef} className="editor-hud__val">
              [0000]
            </span>{" "}
            <span className="editor-hud__dim">/ 2160</span>
          </div>

          <span className="editor-hud__divider editor-hud__desktop-only">|</span>

          <div className="editor-hud__item editor-hud__desktop-only">
            <span className="editor-hud__label">STATUS:</span>{" "}
            <span ref={dirRef} className="editor-hud__val" style={{ color: "#22c55e" }}>
              ● STANDBY
            </span>
          </div>

          <span className="editor-hud__divider editor-hud__desktop-only">|</span>

          <div className="editor-hud__item editor-hud__act">
            <span className="editor-hud__label">ACT:</span>{" "}
            <span ref={actRef} className="editor-hud__val">
              [01]
            </span>{" "}
            <span className="editor-hud__dim">/ 03</span>
          </div>
        </div>

        {/* Bottom Center: Timeline Scrubber with Circular Accent Dot & Interactive Seeking */}
        <div
          className="editor-hud__timeline"
          onClick={handleTimelineClick}
          role="slider"
          aria-label="Master Timeline Scrubber"
          tabIndex={0}
        >
          <div className="editor-hud__timeline-line">
            <div ref={scrubberRef} className="editor-hud__scrubber-dot" />
          </div>
        </div>

        {/* Bottom Right: Tool Item */}
        <div className="editor-hud__bottom-right editor-hud__desktop-only">
          <span className="editor-hud__label">TOOL:</span>{" "}
          <span
            ref={toolRef}
            className="editor-hud__val editor-hud__val--accent"
          >
            GENESIS PULSE
          </span>
        </div>
      </div>
    </aside>
  );
}
