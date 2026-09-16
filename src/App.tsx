import { Suspense, lazy, useEffect, useState } from "react";
import { MotionProvider, useMotionContext } from "./lib/MotionContext";
import { initLenis } from "./lib/lenis";
import { ScrollTrigger } from "./lib/gsap";

// Global Chrome & Overlays
import { Loader, FilmGrain, CustomCursor, ErrorBoundary } from "./components/global";

// Narrative & HUD Instruments
import { NarrativeOverlay, WorkVaultModal } from "./components/narrative";
import { GenesisOverlay } from "./components/narrative/GenesisOverlay";
import { getGenesisHeight, getIsGenesisActive, skipGenesis, addFrameListener, removeFrameListener } from "./lib/lenis";
import { AnatomyIntroScene } from "./components/canvas/AnatomyIntroScene";

// WebGL Continuous Canvas Scene
const SceneCanvas = lazy(() =>
  import("./components/canvas/SceneCanvas").then((m) => ({ default: m.SceneCanvas }))
);


import {
  Portfolio,
  BeforeAfterSlider,
  TechDiagram,
  WhatIDo,
  Process,
  Services,
  CTA,
  Contact,
  Footer,
} from "./components/sections";

function AppContent() {
  const { reducedMotion, isMobile } = useMotionContext();
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

  const gHeight = getGenesisHeight();
  const tHeight = typeof window !== "undefined" && (window.innerWidth < 768 || isMobile) ? 3000 : 4800;

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

      {/* Act G: Genesis Prologue Narrative & HUD Overlay */}
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

      {/* Responsive Genesis Prologue Scroll Track (Matches AnatomyIntroScene & Lenis exactly) */}
      <div
        className="genesis-scroll-track"
        style={{
          position: "relative",
          width: "100%",
          height: `${gHeight}px`,
          pointerEvents: "none",
        }}
      />

      {/* Act 03 Temporal Track: Continuous Film Tunnel into Grand Cinema & Work Showcase */}
      <div
        className="temporal-scroll-track"
        style={{
          position: "relative",
          width: "100%",
          height: `${tHeight}px`,
          pointerEvents: "none",
        }}
      />

      {/* Main Interactive Portfolio Document Flow (Seamless continuous scroll on all devices) */}
      <main
        id="main-portfolio"
        style={{
          position: "relative",
          zIndex: 60,
          background: "linear-gradient(180deg, #050608 0%, #0b0b0b 300px)",
          color: "#ffffff",
          width: "100%",
          minHeight: "100vh",
          boxShadow: "0 -24px 80px rgba(0, 0, 0, 0.95)",
        }}
      >
        <Portfolio />
        <BeforeAfterSlider />
        <TechDiagram />
        <WhatIDo />
        <Process />
        <Services />
        <CTA />
        <Contact />
        <Footer />
      </main>
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
