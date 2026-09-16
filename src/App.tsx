import { Suspense, lazy, useEffect, useState } from "react";
import { MotionProvider, useMotionContext } from "./lib/MotionContext";
import { initLenis } from "./lib/lenis";
import { ScrollTrigger } from "./lib/gsap";

// Global Chrome & Overlays
import { Loader, FilmGrain, CustomCursor, ErrorBoundary } from "./components/global";

// Narrative & HUD Instruments
import { NarrativeOverlay, WorkVaultModal } from "./components/narrative";
import { GenesisOverlay } from "./components/narrative/GenesisOverlay";
import { getIsGenesisActive, skipGenesis, addFrameListener, removeFrameListener } from "./lib/lenis";
import { AnatomyIntroScene } from "./components/canvas/AnatomyIntroScene";

// WebGL Continuous Canvas Scene
const SceneCanvas = lazy(() =>
  import("./components/canvas/SceneCanvas").then((m) => ({ default: m.SceneCanvas }))
);


function AppContent() {
  const { reducedMotion } = useMotionContext();
  const [loaded, setLoaded] = useState(false);
  const [isWorkOpen, setIsWorkOpen] = useState(false);
  const [isGenesis, setIsGenesis] = useState(true);

  useEffect(() => {
    initLenis(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    let last = true;
    const checkGenesis = () => {
      const active = getIsGenesisActive();
      if (active !== last) {
        last = active;
        setIsGenesis(active);
      }
    };
    addFrameListener(checkGenesis);
    return () => removeFrameListener(checkGenesis);
  }, []);

  const handleLoaderDone = () => {
    setLoaded(true);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  return (
    <>
      {/* Intro loader during initial asset initialization */}
      {!loaded && <Loader onDone={handleLoaderDone} />}

      {/* Global Overlays */}
      <FilmGrain />
      <CustomCursor />



      {/* 3D WebGL Anatomy Intro Scene: True 3D Head & Physical Eye Dive */}
      <AnatomyIntroScene />


      {/* Continuous 3D WebGL Canvas Layer */}
      <ErrorBoundary name="SceneCanvasRoot">
        <Suspense fallback={null}>
          <SceneCanvas />
        </Suspense>
      </ErrorBoundary>


      {/* Act G: Genesis Prologue Narrative & HUD Overlay (Disabled conflicting copy in favor of AnatomyIntroScene typography) */}
      <GenesisOverlay active={false} onSkip={skipGenesis} />

      {/* Narrative Typography & Act Voice Line Overlay: ONLY visible when Genesis is complete */}
      <div
        style={{
          position: "relative",
          zIndex: 50,
          opacity: isGenesis ? 0 : 1,
          transition: "opacity 0.4s ease",
          pointerEvents: isGenesis ? "none" : "auto",
        }}
      >
        <NarrativeOverlay onOpenWork={() => setIsWorkOpen(true)} />
      </div>

      {/* Work Vault Modal: All 9 Projects, Comparison Slider & Cinema Player */}
      <WorkVaultModal isOpen={isWorkOpen} onClose={() => setIsWorkOpen(false)} />

      {/* Unified 7500px Genesis Prologue Scroll Track (Matches AnatomyIntroScene & Lenis exactly) */}
      <div
        className="genesis-scroll-track"
        style={{
          position: "relative",
          width: "100%",
          height: "7500px",
          pointerEvents: "none",
        }}
      />

      {/* Pinned 5200px Act 03 Temporal Track: Continuous Film Tunnel into Grand Cinema & Work Showcase (Zero Dead Space) */}
      <div
        className="temporal-scroll-track"
        style={{
          position: "relative",
          width: "100%",
          height: "5200px",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <MotionProvider>
      <AppContent />
    </MotionProvider>
  );
}
