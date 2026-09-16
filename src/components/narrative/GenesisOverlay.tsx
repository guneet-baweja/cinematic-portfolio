import { useEffect, useState } from "react";

import { genesisState } from "../../lib/timeline/genesisChoreography";
import { addFrameListener, removeFrameListener } from "../../lib/lenis";
import "./GenesisOverlay.css";

interface GenesisOverlayProps {
  active: boolean;
  onSkip: () => void;
}

export function GenesisOverlay({ active, onSkip }: GenesisOverlayProps) {
  const [beat, setBeat] = useState(1);

  useEffect(() => {

    let lastBeat = -1;

    const tick = () => {
      const curBeat = genesisState.activeBeat;

      if (curBeat !== lastBeat) {
        lastBeat = curBeat;
        setBeat(curBeat);
      }
    };

    addFrameListener(tick);
    return () => removeFrameListener(tick);
  }, []);

  if (!active) return null;

  return (
    <div className={`genesis-overlay ${genesisState.handoffAlpha > 0.9 ? "hidden" : ""}`}>
      {/* Top Bar Navigation */}
      <div className="genesis-top-bar">
        <div className="genesis-pill">ACT G • PROLOGUE</div>
        <button
          type="button"
          className="genesis-skip-btn"
          onClick={onSkip}
          title="Skip prologue directly to Act 00"
        >
          <span>[ ⌐</span>
          <span>SKIP PROLOGUE</span>
          <span>⌐ ]</span>
        </button>
      </div>

      {/* Dynamic Center Narrative Copy */}
      <div className="genesis-narrative-container">


        {beat === 2 && (
          <>
            <h1 className="genesis-headline">INTO THE LENS</h1>
            <p className="genesis-subtext">THE OBSERVER BECOMES THE VISION</p>
          </>
        )}

        {beat === 3 && (
          <>
            <div className="genesis-hemisphere-left">[ INTELLIGENCE ]</div>
            <div className="genesis-hemisphere-right">[ CREATIVITY ]</div>
            <h1 className="genesis-headline">NEURAL ARCHITECTURE</h1>
            <p className="genesis-subtext">WHERE TECHNICAL RIGOR MEETS INSTINCT</p>
          </>
        )}

        {beat === 4 && (
          <>
            <h1 className="genesis-headline">THE CONDUIT</h1>
            <p className="genesis-subtext">SIGNAL FLOW FROM MIND TO CHEST</p>
          </>
        )}

        {beat === 5 && (
          <>
            <h1 className="genesis-headline">EVERY CUT IS MADE WITH HEART.</h1>
            <p className="genesis-subtext">"YOU DON'T EDIT WITH YOUR HANDS."</p>
          </>
        )}

        {beat === 6 && (
          <>
            <h1 className="genesis-headline">IN THE BLOODSTREAM</h1>
            <p className="genesis-subtext">
              AFTER EFFECTS • PREMIERE • DAVINCI • BLENDER • HOUDINI
            </p>
          </>
        )}

        {beat === 7 && (
          <>
            <h1 className="genesis-headline">ALWAYS DELIVER ON TIME.</h1>
            <p className="genesis-subtext">2.5+ YEARS IN THE CRAFT — ZERO COMPROMISE</p>
          </>
        )}
      </div>
    </div>
  );
}

