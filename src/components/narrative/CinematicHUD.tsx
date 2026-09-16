import { useEffect, useRef, useState } from "react";
import { scrollState } from "../../store/scrollState";
import { addFrameListener, removeFrameListener } from "../../lib/lenis";
import "./CinematicHUD.css";

const TOOL_NAMES: Record<string, string> = {
  pulse: "GENESIS PULSE",
  vault: "MAGNETIC VAULT",
  blade: "RAZOR BLADE [C]",
  shuttle: "TEMPORAL SHUTTLE [J-K-L]",
  aura: "EMOTION AURA",
  prism: "SPECTRAL PRISM",
  break: "FRAME UNBIND",
  gravity: "GRAVITY INVERSION",
  strobe: "HYPERSPEED SHUTTER",
  cinema: "RECURSIVE PULLBACK",
  pointer: "MASTER TRIGGER",
};

export function CinematicHUD({
  onOpenWork,
  onToggleSound,
  isMuted,
}: {
  onOpenWork: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
}) {
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const scrubberMarkerRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef<HTMLSpanElement>(null);
  const toolRef = useRef<HTMLSpanElement>(null);

  const [currentAct, setCurrentAct] = useState(1);

  useEffect(() => {
    let lastAct = -1;

    const loop = () => {
      // 1. Direct DOM mutations for 60fps performance without React re-rendering
      if (timecodeRef.current) {
        timecodeRef.current.textContent = scrollState.timecode;
      }
      if (frameRef.current) {
        frameRef.current.textContent = String(scrollState.frameIndex).padStart(4, "0");
      }
      if (scrubberMarkerRef.current) {
        scrubberMarkerRef.current.style.left = `${scrollState.progress * 100}%`;
      }
      if (directionRef.current) {
        const dir = scrollState.direction;
        directionRef.current.textContent = dir === 1 ? "FWD ▶" : dir === -1 ? "◀ REV" : "❚❚ FREEZE";
        directionRef.current.style.color = dir === -1 ? "#38bdf8" : dir === 1 ? "#FF5F1F" : "#ffffff";
      }
      if (toolRef.current) {
        toolRef.current.textContent = TOOL_NAMES[scrollState.cursorMode] || "INSTRUMENT";
      }

      if (scrollState.act !== lastAct) {
        lastAct = scrollState.act;
        setCurrentAct(scrollState.act);
      }
    };

    loop();
    addFrameListener(loop);
    return () => {
      removeFrameListener(loop);
    };
  }, []);

  return (
    <header className="cinematic-hud" aria-label="Cinematic Timecode HUD">
      {/* Top Telemetry Bar */}
      <div className="cinematic-hud__top">
        <div className="cinematic-hud__brand">
          <span className="cinematic-hud__title">THE ARCHITECT OF TIME</span>
          <span className="cinematic-hud__sep">/</span>
          <span ref={timecodeRef} className="cinematic-hud__timecode">
            00:00:00:00
          </span>
        </div>

        <div className="cinematic-hud__controls">
          <button
            type="button"
            className="cinematic-hud__action-btn"
            onClick={onToggleSound}
            aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? "SOUND: OFF" : "SOUND: ON"}
          </button>
          <button
            type="button"
            className="cinematic-hud__action-btn cinematic-hud__action-btn--accent"
            onClick={onOpenWork}
          >
            WORK VAULT [9]
          </button>
        </div>
      </div>

      {/* Bottom Instrument Deck */}
      <div className="cinematic-hud__bottom">
        <div className="cinematic-hud__stats">
          <span>FRAME: <strong ref={frameRef}>0000</strong> / 2160</span>
          <span>DIR: <strong ref={directionRef}>FWD ▶</strong></span>
          <span>ACT: <strong>{String(currentAct).padStart(2, "0")} / 10</strong></span>
        </div>

        {/* Center Timeline Scrubber */}
        <div className="cinematic-hud__scrubber-track">
          <span className="cinematic-hud__scrubber-label">TIMELINE</span>
          <div className="cinematic-hud__scrubber-line">
            <div ref={scrubberMarkerRef} className="cinematic-hud__scrubber-marker" />
          </div>
        </div>

        {/* Right Tool Instrument Badge */}
        <div className="cinematic-hud__tool">
          <span className="cinematic-hud__tool-label">TOOL:</span>
          <span ref={toolRef} className="cinematic-hud__tool-val">
            GENESIS PULSE
          </span>
        </div>
      </div>
    </header>
  );
}
