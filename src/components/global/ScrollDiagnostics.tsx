import { useState, useEffect, useRef } from "react";
import { scrollState, ACT_RANGES } from "../../store/scrollState";
import { getLenis, addFrameListener, removeFrameListener } from "../../lib/lenis";

/**
 * MASTER DEBUG MODE (Phase 10 Cinematic QA Diagnostic Tool)
 * ----------------------------------------------------------
 * Exposes real-time runtime telemetry for visual and technical QA:
 * - MASTER PROGRESS
 * - CURRENT SCENE
 * - LOCAL SCENE PROGRESS
 * - SCROLL VELOCITY
 * - LENIS POSITION
 * - CAMERA BASE POSITION
 * - CAMERA VELOCITY OFFSET
 * - FPS & FRAME TIME
 * - SCENE BOUNDARIES TIMELINE TRACK
 *
 * Easy to toggle/disable via:
 * - URL param (?debug=true)
 * - Keyboard shortcut (Ctrl+Shift+D or 'D')
 * - On-screen [DEBUG] trigger button
 */
export function ScrollDiagnostics() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("debug") === "true" || params.get("debug") === "1";
    }
    return false;
  });

  // Top Banner HUD refs
  const bannerActRef = useRef<HTMLSpanElement>(null);
  const bannerMasterRef = useRef<HTMLSpanElement>(null);
  const bannerLocalRef = useRef<HTMLDivElement>(null);
  const bannerVelRef = useRef<HTMLDivElement>(null);
  const bannerFpsRef = useRef<HTMLSpanElement>(null);
  const bannerFrameTimeRef = useRef<HTMLDivElement>(null);

  // Detailed Telemetry refs
  const lenisPosRef = useRef<HTMLSpanElement>(null);
  const camBaseRef = useRef<HTMLSpanElement>(null);
  const camVelOffsetRef = useRef<HTMLSpanElement>(null);
  const camRotRef = useRef<HTMLSpanElement>(null);
  const aberrationRef = useRef<HTMLSpanElement>(null);
  const driftStatusRef = useRef<HTMLSpanElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener: Ctrl+Shift+D or 'd' (when not in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") ||
        (e.key.toLowerCase() === "d" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey)
      ) {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Frame tick loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let currentFps = 60;
    let frameDelta = 16.6;

    const tick = (now: number) => {
      frameCount++;
      frameDelta = now - lastTime;
      if (frameDelta >= 400) {
        currentFps = Math.round((frameCount * 1000) / frameDelta);
        frameCount = 0;
        lastTime = now;
      }

      if (isOpen) {
        const p = scrollState.progress;
        const act = scrollState.act;
        const actP = scrollState.actProgress;
        const v = scrollState.velocity;
        const rawScroll = scrollState.scroll;
        const resolved = scrollState.resolved;
        const phys = scrollState.physics;

        // 1. Top Banner Readout: ACT XX | MASTER: 0.XXX | LOCAL: 0.XX | VELOCITY: X.XX | FPS: XX
        if (bannerActRef.current) {
          bannerActRef.current.textContent = `ACT ${String(act).padStart(2, "0")}`;
        }
        if (bannerMasterRef.current) {
          bannerMasterRef.current.textContent = p.toFixed(3);
        }
        if (bannerLocalRef.current) {
          bannerLocalRef.current.textContent = actP.toFixed(2);
        }
        if (bannerVelRef.current) {
          bannerVelRef.current.textContent = v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
          bannerVelRef.current.style.color = v === 0 ? "#888888" : v > 0 ? "#FF5F1F" : "#38bdf8";
        }
        if (bannerFpsRef.current) {
          bannerFpsRef.current.textContent = `${currentFps}`;
          bannerFpsRef.current.style.color = currentFps >= 55 ? "#22c55e" : currentFps >= 30 ? "#eab308" : "#ef4444";
        }
        if (bannerFrameTimeRef.current) {
          bannerFrameTimeRef.current.textContent = `${(1000 / Math.max(1, currentFps)).toFixed(1)}ms`;
        }

        // 2. Scene Boundary Timeline Track Playhead Needle
        if (needleRef.current) {
          needleRef.current.style.left = `${Math.min(100, Math.max(0, p * 100))}%`;
        }

        // 3. Detailed Telemetry Grid
        if (lenisPosRef.current) {
          lenisPosRef.current.textContent = `${Math.round(rawScroll)} px`;
        }
        if (camBaseRef.current) {
          const [bx, by, bz] = resolved.cameraBasePos;
          camBaseRef.current.textContent = `[${bx.toFixed(2)}, ${by.toFixed(2)}, ${bz.toFixed(2)}]`;
        }
        if (camVelOffsetRef.current) {
          const [mx, my, mz] = phys.cameraMomentum;
          camVelOffsetRef.current.textContent = `[${mx.toFixed(2)}, ${my.toFixed(2)}, ${mz.toFixed(2)}]`;
          camVelOffsetRef.current.style.color = Math.abs(mx) + Math.abs(my) + Math.abs(mz) < 0.01 ? "#888888" : "#38bdf8";
        }
        if (camRotRef.current) {
          const [rx, , rz] = phys.cameraRotationOffset;
          camRotRef.current.textContent = `P:${(rx * 57.3).toFixed(1)}° R:${(rz * 57.3).toFixed(1)}°`;
        }
        if (aberrationRef.current) {
          aberrationRef.current.textContent = `${(phys.chromaticAberration * 10000).toFixed(1)} µm`;
        }
        if (driftStatusRef.current) {
          const isAtRest = Math.abs(v) === 0 && phys.cameraMomentum[0] === 0 && phys.cameraMomentum[1] === 0 && phys.cameraMomentum[2] === 0;
          if (isAtRest) {
            driftStatusRef.current.textContent = "● REST (ZERO DRIFT)";
            driftStatusRef.current.style.color = "#22c55e";
          } else {
            driftStatusRef.current.textContent = "▲ ACTIVE MOMENTUM";
            driftStatusRef.current.style.color = "#FF5F1F";
          }
        }
      }
    };

    if (isOpen) {
      addFrameListener(tick);
    }

    return () => {
      removeFrameListener(tick);
    };
  }, [isOpen]);

  const handleJump = (targetProgress: number) => {
    const lenis = getLenis();
    if (lenis) {
      const targetScroll = targetProgress * lenis.limit;
      lenis.scrollTo(targetScroll, { immediate: true });
    }
  };

  return (
    <>
      {/* Discreet Trigger Button in bottom-right corner */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: isOpen ? "#FF5F1F" : "rgba(10, 12, 16, 0.88)",
          border: "1px solid rgba(255, 95, 31, 0.5)",
          color: isOpen ? "#000000" : "#FF5F1F",
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 800,
          padding: "5px 11px",
          borderRadius: 4,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          letterSpacing: 1,
          boxShadow: isOpen ? "0 0 20px rgba(255,95,31,0.5)" : "none",
          transition: "all 0.2s ease",
        }}
        title="Toggle Master Debug Mode (Key: 'D' or Ctrl+Shift+D)"
      >
        {isOpen ? "[DEBUG ACTIVE]" : "[DEBUG]"}
      </button>

      {/* MASTER DEBUG MODE HUD PANEL */}
      {isOpen && (
        <aside
          aria-label="Master Debug Mode Telemetry"
          style={{
            position: "fixed",
            bottom: 62,
            right: 24,
            width: 330,
            background: "rgba(6, 8, 12, 0.96)",
            border: "1px solid rgba(255, 95, 31, 0.35)",
            borderRadius: 6,
            padding: 14,
            zIndex: 9999,
            color: "#e2e8f0",
            fontFamily: "monospace",
            fontSize: 11,
            boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 1px rgba(255,95,31,0.4)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Header Readout Banner */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                ref={bannerActRef}
                style={{
                  background: "#FF5F1F",
                  color: "#000000",
                  fontWeight: 900,
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 3,
                  letterSpacing: 0.5,
                }}
              >
                ACT 01
              </span>
              <span style={{ fontSize: 10, color: "#888" }}>MASTER:</span>
              <span ref={bannerMasterRef} style={{ color: "#fff", fontWeight: 700 }}>0.000</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "#888" }}>FPS:</span>
              <span ref={bannerFpsRef} style={{ fontWeight: 800, color: "#22c55e" }}>60</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "0 2px",
                }}
                title="Close Debug HUD (D)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              background: "rgba(255,255,255,0.03)",
              padding: 6,
              borderRadius: 4,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: "#64748b" }}>LOCAL</div>
              <div ref={bannerLocalRef} style={{ color: "#ffffff", fontWeight: 700 }}>0.00</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#64748b" }}>VELOCITY</div>
              <div ref={bannerVelRef} style={{ color: "#FF5F1F", fontWeight: 700 }}>0.00</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#64748b" }}>FRAME TIME</div>
              <div ref={bannerFrameTimeRef} style={{ color: "#ffffff", fontWeight: 700 }}>16.6ms</div>
            </div>
          </div>

          {/* Scene Boundaries Timeline Track */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#64748b", marginBottom: 4 }}>
              <span>00 SCENE BOUNDARIES</span>
              <span>10 FINAL</span>
            </div>
            <div
              style={{
                position: "relative",
                height: 12,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Act boundary divider markers */}
              {ACT_RANGES.map((act) => (
                <div
                  key={act.act}
                  style={{
                    position: "absolute",
                    left: `${act.start * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "rgba(255,255,255,0.25)",
                  }}
                  title={`Act ${act.act}: ${act.name} (${act.start} -> ${act.end})`}
                />
              ))}
              {/* Active needle */}
              <div
                ref={needleRef}
                style={{
                  position: "absolute",
                  left: "0%",
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: "#FF5F1F",
                  boxShadow: "0 0 6px #FF5F1F",
                  transform: "translateX(-1px)",
                }}
              />
            </div>
          </div>

          {/* Detailed Architectural Telemetry */}
          <div style={{ display: "grid", gridTemplateColumns: "115px 1fr", gap: "3px 6px", fontSize: 10, marginBottom: 10 }}>
            <span style={{ color: "#888" }}>LENIS POSITION:</span>
            <span ref={lenisPosRef} style={{ color: "#fff" }}>0 px</span>

            <span style={{ color: "#888" }}>CAMERA BASE:</span>
            <span ref={camBaseRef} style={{ color: "#e2e8f0" }}>[0.00, 0.00, 5.20]</span>

            <span style={{ color: "#888" }}>CAMERA VEL OFFSET:</span>
            <span ref={camVelOffsetRef} style={{ color: "#888888" }}>[0.00, 0.00, 0.00]</span>

            <span style={{ color: "#888" }}>PITCH / ROLL:</span>
            <span ref={camRotRef} style={{ color: "#fff" }}>P:0.0° R:0.0°</span>

            <span style={{ color: "#888" }}>OPTICAL DISPERSION:</span>
            <span ref={aberrationRef} style={{ color: "#e2e8f0" }}>8.0 µm</span>

            <span style={{ color: "#888" }}>ZERO DRIFT:</span>
            <span ref={driftStatusRef} style={{ color: "#22c55e", fontWeight: 700 }}>● REST (ZERO DRIFT)</span>
          </div>

          {/* Quick Scene Seek Controls */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8 }}>
            <div style={{ color: "#888", fontSize: 9, marginBottom: 5, letterSpacing: 0.5 }}>QUICK SCENE SEEK (ACT 01 - 10):</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
              {ACT_RANGES.map((actDef) => (
                <button
                  key={actDef.act}
                  type="button"
                  onClick={() => handleJump(actDef.start + 0.005)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    padding: "3px 0",
                    fontSize: 9,
                    borderRadius: 2,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#FF5F1F";
                    e.currentTarget.style.color = "#FF5F1F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  {String(actDef.act).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
