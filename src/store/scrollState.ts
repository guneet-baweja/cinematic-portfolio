/**
 * THE ARCHITECT OF TIME - MASTER SCROLL & CANONICAL TIMELINE STORE
 * ----------------------------------------------------------------
 * Plain mutable object designed for zero-allocation 60fps/120fps reading.
 * Authoritative single source of truth for narrative progress, temporal direction,
 * camera choreography, scene transitions, and contextual editing cursor.
 *
 * All state derives deterministically from canonical masterProgress (0.0000 -> 1.0000).
 * Velocity strictly influences secondary physical response (momentum, turbulence, dispersion).
 */

import {
  ACT_RANGES,
  type ActDefinition,
  type CursorMode,
  type ResolvedCinematicState,
  type SecondaryPhysicsState,
  resolveCinematicState,
  resolveSecondaryPhysics,
} from "../lib/timeline/sceneResolver";
import { scrubActTimeline } from "../lib/timeline/gsapChoreography";
import { velocityEngine } from "../lib/physics/velocityEngine";
import { ambientEngine, type AmbientState } from "../lib/ambient/ambientEngine";

export {
  ACT_RANGES,
  type ActDefinition,
  type CursorMode,
  type ResolvedCinematicState,
  type SecondaryPhysicsState,
  type AmbientState,
  resolveCinematicState,
  resolveSecondaryPhysics,
  velocityEngine,
  ambientEngine,
};

export const scrollState = {
  // =========================================================================
  // CATEGORY A: SCROLL STATE (Changes ONLY when cinematic progress changes)
  // =========================================================================
  /** Canonical 0.0 -> 1.0 master narrative progress */
  progress: 0,
  /** Raw scroll position in pixels */
  scroll: 0,
  /** Active Act index (1 to 10) */
  act: 1,
  /** Active Act name */
  actName: "THE LOADING OF AN IDEA",
  /** Normalized progress within the active Act (0.0 -> 1.0) */
  actProgress: 0,
  /** Formatted SMPTE timecode string HH:MM:SS:FF */
  timecode: "00:00:00:00",
  /** Frame counter (e.g. 0 to 2160) */
  frameIndex: 0,
  /** Contextual editing cursor mode */
  cursorMode: "pulse" as CursorMode,
  /** Resolved canonical state from SceneResolver */
  resolved: resolveCinematicState(0),

  // =========================================================================
  // CATEGORY B: VELOCITY RESPONSE (Changes based on current scroll velocity)
  // =========================================================================
  /** Normalized, smoothed, bounded scroll velocity (-1..1), signed */
  velocity: 0,
  /** Raw normalized velocity without temporal EMA smoothing */
  rawVelocity: 0,
  /** Non-linear velocity intensity curve (-1..1) for secondary physics */
  velocityIntensity: 0,
  /** Signed temporal direction: 1 = forward, -1 = reverse, 0 = frozen */
  direction: 1 as 1 | -1 | 0,
  /** Resolved secondary physics from VelocityEngine */
  physics: resolveSecondaryPhysics(0, 0),

  // =========================================================================
  // CATEGORY C: AMBIENT LOOP (Continues 100% independently of scrolling)
  // =========================================================================
  /** Category C ambient continuous drift, lighting shimmer, and atmospheric waves */
  ambient: ambientEngine.getState(),

  /** Normalized pointer coordinates -1..1 */
  pointer: { x: 0, y: 0 },
  /** Legacy compatibility */
  hero: { progress: 0 },
  showcase: { progress: 0 },
};

/**
 * Pure calculation: Determine act and local progress from master progress [0.0..1.0]
 */
export function computeActFromProgress(progress: number): {
  act: number;
  actName: string;
  actProgress: number;
  cursorMode: CursorMode;
} {
  const resolved = resolveCinematicState(progress);
  return {
    act: resolved.act,
    actName: resolved.actName,
    actProgress: resolved.actProgress,
    cursorMode: resolved.cursorMode,
  };
}

/**
 * Returns continuous relative progress for any specified Act [0..10].
 * - If before act start: < 0
 * - If inside act: 0.0 -> 1.0
 * - If after act end: > 1
 * Useful for smooth overlap blending without hard clipping.
 */
export function getActProgress(
  actIndex: number,
  masterProgress: number = scrollState.progress
): number {
  const range = ACT_RANGES[actIndex];
  if (!range) return 0;
  const span = range.end - range.start;
  if (span <= 0) return 0;
  return (masterProgress - range.start) / span;
}

let lastProgressRecord = 0;

/**
 * Authoritative tick for continuous frame-rate-independent physical decay and ambient loop.
 * Executed every tick in the master ticker loop.
 */
export function updateTemporalPhysicsTick(deltaTimeSeconds: number) {
  // Category B: Velocity decay & Secondary Physics
  const physics = velocityEngine.tick(deltaTimeSeconds, scrollState.act);
  scrollState.velocity = velocityEngine.velocity;
  scrollState.rawVelocity = velocityEngine.rawVelocity;
  scrollState.velocityIntensity = velocityEngine.intensity;
  scrollState.direction = velocityEngine.direction;
  scrollState.physics = physics;

  // Category C: Ambient Loop (Continues 100% independently of scrolling)
  const ambient = ambientEngine.tick(deltaTimeSeconds);
  scrollState.ambient = ambient;
}

/**
 * Authoritative single update function for all scroll telemetry
 */
export function updateTemporalProgress(progress: number, rawVelocityInput: number) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  scrollState.progress = clampedProgress;

  // Jump Detection: If progress leaps by > 0.08 (e.g. anchor jump / seek), instantly reset velocity
  if (Math.abs(clampedProgress - lastProgressRecord) > 0.08) {
    velocityEngine.reset();
  } else {
    // 1. Velocity Processing: Feed impulse to VelocityEngine
    velocityEngine.applyImpulse(rawVelocityInput);
  }
  lastProgressRecord = clampedProgress;

  scrollState.velocity = velocityEngine.velocity;
  scrollState.rawVelocity = velocityEngine.rawVelocity;
  scrollState.velocityIntensity = velocityEngine.intensity;
  scrollState.direction = velocityEngine.direction;

  // 2. Resolve Authoritative Deterministic Cinematic State (Point #02 & #05)
  const resolved = resolveCinematicState(clampedProgress);
  scrollState.resolved = resolved;
  scrollState.act = resolved.act;
  scrollState.actName = resolved.actName;
  scrollState.actProgress = resolved.actProgress;
  scrollState.cursorMode = resolved.cursorMode;
  scrollState.frameIndex = resolved.frameIndex;
  scrollState.timecode = resolved.timecode;

  // 3. Resolve Secondary Physical Response Branch (Point #01 & #13)
  // Strictly isolates velocity physics from narrative progress
  scrollState.physics = velocityEngine.resolvePhysics(resolved.act);

  // 4. Scrub Reusable GSAP Master Choreography Timelines (Phase 4 Architecture)
  scrubActTimeline(resolved.act, resolved.actProgress, clampedProgress);
}

/**
 * Master Timeline Facade - Canonical Global Timeline Interface
 */
export const masterTimeline = {
  get progress() {
    return scrollState.progress;
  },
  get velocity() {
    return scrollState.velocity;
  },
  get direction() {
    return scrollState.direction;
  },
  get act() {
    return scrollState.act;
  },
  get actName() {
    return scrollState.actName;
  },
  get actProgress() {
    return scrollState.actProgress;
  },
  get timecode() {
    return scrollState.timecode;
  },
  get frameIndex() {
    return scrollState.frameIndex;
  },
  get state() {
    return scrollState.resolved;
  },
  get physics() {
    return scrollState.physics;
  },
  get ambient() {
    return scrollState.ambient;
  },
};

if (typeof window !== "undefined") {
  (window as any).__scrollState = scrollState;
  window.addEventListener(
    "pointermove",
    (e) => {
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true }
  );
}
