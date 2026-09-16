import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { scrollState, updateTemporalProgress, updateTemporalPhysicsTick } from "./scrollState";
import { audioEngine } from "./audio";
import { scrubGenesisTimeline } from "./timeline/genesisChoreography";

let lenis: Lenis | null = null;
let tickerFn: ((time: number, deltaTime: number) => void) | null = null;

export type FrameListener = (time: number, deltaTime: number) => void;
const frameListeners = new Set<FrameListener>();

export const GENESIS_HEIGHT = 7500;
export const GENESIS_HEIGHT_MOBILE = 3800;

export function getGenesisHeight(): number {
  if (typeof window !== "undefined" && (window.innerWidth < 768 || "ontouchstart" in window)) {
    return GENESIS_HEIGHT_MOBILE;
  }
  return GENESIS_HEIGHT;
}

let isGenesisActive = true;
export function getIsGenesisActive(): boolean {
  return isGenesisActive;
}

export function skipGenesis() {
  const gHeight = getGenesisHeight();
  if (lenis) {
    lenis.scrollTo(gHeight, { immediate: false, duration: 0.8 });
  } else if (typeof window !== "undefined") {
    window.scrollTo({ top: gHeight, behavior: "smooth" });
  }
}

/**
 * Register a frame update callback to execute synchronously in the single GSAP ticker loop.
 * Eliminates ad-hoc requestAnimationFrame loops across components.
 */
export function addFrameListener(fn: FrameListener) {
  frameListeners.add(fn);
}

/**
 * Unregister a frame update callback.
 */
export function removeFrameListener(fn: FrameListener) {
  frameListeners.delete(fn);
}

function notifyFrameListeners(time: number, deltaTime: number) {
  for (const fn of frameListeners) {
    fn(time, deltaTime);
  }
}

export function initLenis(reducedMotion: boolean) {
  if (lenis) return lenis;

  // Respect prefers-reduced-motion: fall back to native scroll behavior.
  if (reducedMotion) {
    if (typeof window !== "undefined") {
      const handleNativeScroll = () => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY;
        const gHeight = getGenesisHeight();

        // Robust hysteresis deadband around GENESIS_HEIGHT prevents flapping
        if (isGenesisActive) {
          if (currentScroll >= gHeight) {
            isGenesisActive = false;
          }
        } else {
          if (currentScroll < gHeight - 60) {
            isGenesisActive = true;
          }
        }

        if (isGenesisActive) {
          const gProgress = Math.max(0, Math.min(1, currentScroll / gHeight));
          scrubGenesisTimeline(gProgress);
          updateTemporalProgress(0, 0);
        } else {
          scrubGenesisTimeline(1.0);
          const mainScroll = currentScroll - gHeight;
          const mainLimit = Math.max(1, total - gHeight);
          const progress = mainLimit > 0 ? mainScroll / mainLimit : 0;
          updateTemporalProgress(progress, 0);
        }
      };
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
    }
    return null;
  }

  // UNIFORM 120 FPS CONSISTENT SCROLL ENGINE FOR MOBILE & DESKTOP
  const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || "ontouchstart" in window);

  lenis = new Lenis({
    duration: isMobile ? 0.85 : 1.0,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: isMobile ? 1.15 : 1.5,
    syncTouch: false,
  });

  if (typeof window !== "undefined") {
    (window as any).__lenis = lenis;
  }

  // Authoritative scroll listener: orchestrates Genesis prologue -> Act 00 handoff
  lenis.on("scroll", (e: { scroll: number; limit: number; velocity: number; progress: number }) => {
    scrollState.scroll = e.scroll;
    const rawVelocity = e.velocity / 28;
    const gHeight = getGenesisHeight();
    const currentScroll = e.scroll;

    // Robust hysteresis deadband prevents trackpad micro-settle flapping at 6000px
    if (isGenesisActive) {
      if (currentScroll >= gHeight) {
        isGenesisActive = false;
      }
    } else {
      if (currentScroll < gHeight - 60) {
        isGenesisActive = true;
      }
    }

    if (isGenesisActive) {
      const gProgress = Math.max(0, Math.min(1, currentScroll / gHeight));
      scrubGenesisTimeline(gProgress);
      updateTemporalProgress(0, rawVelocity);
    } else {
      scrubGenesisTimeline(1.0);
      const mainScroll = currentScroll - gHeight;
      const mainLimit = Math.max(1, e.limit - gHeight);
      const mainProgress = Math.max(0, Math.min(1, mainScroll / mainLimit));
      updateTemporalProgress(mainProgress, rawVelocity);
    }

    audioEngine.updateVelocity(scrollState.velocity);
    audioEngine.updateAct(scrollState.act);
  });


  // SINGLE COHERENT ANIMATION LOOP:
  // GSAP's ticker is the sole master heartbeat owner.
  tickerFn = (time: number, deltaTime: number) => {
    if (lenis) {
      // 1. Advance Lenis physics (ms)
      lenis.raf(time * 1000);

      // 2. Drive ScrollTrigger from authoritative Lenis position
      ScrollTrigger.update();
    }

    // 3. Continuous frame-rate independent physics decay
    const dtSeconds = deltaTime > 0.5 ? deltaTime / 1000 : (deltaTime || 0.016);
    updateTemporalPhysicsTick(dtSeconds);
    audioEngine.updateVelocity(scrollState.velocity);

    // 4. Synchronously notify registered DOM / HUD / Diagnostics frame listeners
    notifyFrameListeners(time, deltaTime);
  };

  gsap.ticker.add(tickerFn);
  // Disable lag smoothing to prevent visual jumps during high-performance scrubbing (Rule: AGENTS.md)
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.defaults({ scrub: true });

  // Delegated anchor link interception for seamless Lenis scrollTo navigation
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]');
      if (target) {
        const href = target.getAttribute("href");
        if (href && href !== "#") {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(href, { offset: 0, duration: 1.2 });
          } else {
            const el = document.querySelector(href);
            el?.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    });
  }

  return lenis;
}

export function getLenis() {
  return lenis;
}

export function destroyLenis() {
  if (tickerFn) {
    gsap.ticker.remove(tickerFn);
    tickerFn = null;
  }
  frameListeners.clear();
  lenis?.destroy();
  lenis = null;
}
