/**
 * SCENE RESOLVER - CANONICAL MASTER TIMELINE ENGINE
 * --------------------------------------------------
 * Pure, deterministic mathematical engine translating canonical masterProgress (0..1)
 * into authoritative scene parameters, camera trajectories, boundary envelopes,
 * and secondary physical response values.
 *
 * Designed for 60fps/120fps zero-allocation reading.
 */

export type CursorMode =
  | "pulse"    // Act 00: Microscopic particle pulse
  | "vault"    // Act 01: Volumetric focal reticle
  | "blade"    // Act 02: Vertical laser slicing blade
  | "shuttle"  // Act 03: Bidirectional temporal shuttle (◄ || ►)
  | "aura"     // Act 04: Soft radial emotional memory aura
  | "prism"    // Act 05: Prismatic dispersion lens
  | "break"    // Act 06: Expanding borderless crosshair
  | "gravity"  // Act 07: Gravitational field disruptor
  | "strobe"   // Act 08: Rapid shutter strobe
  | "cinema"   // Act 09: Pullback focal frame
  | "pointer"; // Act 10: Final precision trigger

export interface ActDefinition {
  readonly act: number;
  readonly start: number;
  readonly end: number;
  readonly name: string;
  readonly cursorMode: CursorMode;
}

/**
 * 05. MASTER CINEMATIC PROGRESS MODEL
 * Exact deterministic scene ranges for all 10 Acts (0.000 -> 1.000).
 */
export const ACT_RANGES: readonly ActDefinition[] = [
  { act: 3, start: 0.000, end: 1.000, name: "THE WORK ARCHIVE", cursorMode: "pointer" },
] as const;

export interface ResolvedCinematicState {
  masterProgress: number;
  act: number;
  actName: string;
  actProgress: number;
  cursorMode: CursorMode;
  timecode: string;
  frameIndex: number;
  cameraBasePos: [number, number, number];
  cameraBaseLookAt: [number, number, number];
  transitionAlpha: number;
  isTransitioning: boolean;
  outgoingAct: number | null;
  incomingAct: number | null;
}

import { type SecondaryPhysicsState, velocityEngine } from "../physics/velocityEngine";
export type { SecondaryPhysicsState };

// Reusable static state containers to eliminate garbage collection at 60fps
const resolvedState: ResolvedCinematicState = {
  masterProgress: 0,
  act: 3,
  actName: "THE WORK ARCHIVE",
  actProgress: 0,
  cursorMode: "pointer",
  timecode: "00:00:00:00",
  frameIndex: 0,
  cameraBasePos: [0, 0, 5.0],
  cameraBaseLookAt: [0, 0, -25.0],
  transitionAlpha: 1.0,
  isTransitioning: false,
  outgoingAct: null,
  incomingAct: null,
};

import { quinticSmooth } from "../motion/appleCurves";

/**
 * Pure calculation: Determine deterministic camera trajectory for given act and local progress.
 * Unbroken, continuous, smooth flight down the film strip tunnel directly into the Work Showcase.
 */
export function resolveCameraTrajectory(
  _act: number,
  actProgress: number,
  outPos: [number, number, number],
  outLookAt: [number, number, number]
) {
  const p = Math.max(0, Math.min(1, actProgress));

  // Grand Act 03: The Continuous Film Shutter Tunnel into Work Showcase
  // Continuous, uninterrupted, smooth flight through the film strip tunnel spanning the entire act (Z: 5.0 -> -242.0)
  const smooth = quinticSmooth(p);
  outPos[0] = 0;
  outPos[1] = 0;
  outPos[2] = 5.0 - smooth * 247.0; // from Z: 5.0 to Z: -242.0
  outLookAt[0] = 0;
  outLookAt[1] = 0;
  outLookAt[2] = outPos[2] - 25.0; // always looking forward down the travel axis
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/**
 * 02. THE GOLDEN RULE & SCENE RESOLVER:
 * CURRENT STATE = FUNCTION(SCROLL PROGRESS)
 * Resolves the complete, deterministic cinematic state for any master progress in [0..1].
 */
export function resolveCinematicState(progress: number): ResolvedCinematicState {
  const p = Math.max(0, Math.min(1, progress));
  resolvedState.masterProgress = p;

  // 1. Resolve Active Act and Local Progress
  let found = false;
  for (let i = 0; i < ACT_RANGES.length; i++) {
    const actDef = ACT_RANGES[i];
    if (p >= actDef.start && p <= actDef.end) {
      resolvedState.act = actDef.act;
      resolvedState.actName = actDef.name;
      const span = actDef.end - actDef.start;
      resolvedState.actProgress = span > 0 ? (p - actDef.start) / span : 0;
      resolvedState.cursorMode = actDef.cursorMode;
      found = true;
      break;
    }
  }

  if (!found) {
    const last = ACT_RANGES[ACT_RANGES.length - 1];
    resolvedState.act = last.act;
    resolvedState.actName = last.name;
    resolvedState.actProgress = 1.0;
    resolvedState.cursorMode = last.cursorMode;
  }

  // 2. Compute SMPTE Timecode (24fps, 90 seconds = 2160 frames)
  const totalFrames = 2160;
  const currentFrames = Math.floor(p * totalFrames);
  resolvedState.frameIndex = currentFrames;

  const hours = 0;
  const minutes = Math.floor(currentFrames / (24 * 60));
  const seconds = Math.floor((currentFrames % (24 * 60)) / 24);
  const frames = currentFrames % 24;
  resolvedState.timecode = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}:${pad2(frames)}`;

  // 3. Compute Deterministic Camera Trajectory with C2 Spline
  resolveCameraTrajectory(
    resolvedState.act,
    resolvedState.actProgress,
    resolvedState.cameraBasePos,
    resolvedState.cameraBaseLookAt
  );

  // 4. Compute Boundary Transition Overlap Envelopes with C2 Quintic Smoothing (Only when multiple acts exist)
  const actP = resolvedState.actProgress;
  const act = resolvedState.act;
  const OVERLAP_ZONE = 0.16;

  if (ACT_RANGES.length > 1 && actP < OVERLAP_ZONE && act > 1) {
    resolvedState.isTransitioning = true;
    resolvedState.outgoingAct = act - 1;
    resolvedState.incomingAct = act;
    const alpha = quinticSmooth(actP / OVERLAP_ZONE);
    resolvedState.transitionAlpha = alpha;

    // Smooth boundary camera trajectory interpolation (Position + LookAt)
    resolveCameraTrajectory(act - 1, 1.0, transitionScratchPos, transitionScratchLookAt);
    resolvedState.cameraBasePos[0] = transitionScratchPos[0] * (1 - alpha) + resolvedState.cameraBasePos[0] * alpha;
    resolvedState.cameraBasePos[1] = transitionScratchPos[1] * (1 - alpha) + resolvedState.cameraBasePos[1] * alpha;
    resolvedState.cameraBasePos[2] = transitionScratchPos[2] * (1 - alpha) + resolvedState.cameraBasePos[2] * alpha;

    resolvedState.cameraBaseLookAt[0] = transitionScratchLookAt[0] * (1 - alpha) + resolvedState.cameraBaseLookAt[0] * alpha;
    resolvedState.cameraBaseLookAt[1] = transitionScratchLookAt[1] * (1 - alpha) + resolvedState.cameraBaseLookAt[1] * alpha;
    resolvedState.cameraBaseLookAt[2] = transitionScratchLookAt[2] * (1 - alpha) + resolvedState.cameraBaseLookAt[2] * alpha;
  } else if (ACT_RANGES.length > 1 && actP > 1.0 - OVERLAP_ZONE && act < ACT_RANGES.length) {
    resolvedState.isTransitioning = true;
    resolvedState.outgoingAct = act;
    resolvedState.incomingAct = act + 1;
    const alpha = quinticSmooth((1.0 - actP) / OVERLAP_ZONE);
    resolvedState.transitionAlpha = alpha;

    // Smooth boundary camera trajectory interpolation (Position + LookAt)
    resolveCameraTrajectory(act + 1, 0.0, transitionScratchPos, transitionScratchLookAt);
    resolvedState.cameraBasePos[0] = resolvedState.cameraBasePos[0] * alpha + transitionScratchPos[0] * (1 - alpha);
    resolvedState.cameraBasePos[1] = resolvedState.cameraBasePos[1] * alpha + transitionScratchPos[1] * (1 - alpha);
    resolvedState.cameraBasePos[2] = resolvedState.cameraBasePos[2] * alpha + transitionScratchPos[2] * (1 - alpha);

    resolvedState.cameraBaseLookAt[0] = resolvedState.cameraBaseLookAt[0] * alpha + transitionScratchLookAt[0] * (1 - alpha);
    resolvedState.cameraBaseLookAt[1] = resolvedState.cameraBaseLookAt[1] * alpha + transitionScratchLookAt[1] * (1 - alpha);
    resolvedState.cameraBaseLookAt[2] = resolvedState.cameraBaseLookAt[2] * alpha + transitionScratchLookAt[2] * (1 - alpha);
  } else {
    resolvedState.isTransitioning = false;
    resolvedState.outgoingAct = null;
    resolvedState.incomingAct = null;
    resolvedState.transitionAlpha = 1.0;
  }

  return resolvedState;
}

const transitionScratchPos: [number, number, number] = [0, 0, 0];
const transitionScratchLookAt: [number, number, number] = [0, 0, 0];

/**
 * 01. FIRST PRINCIPLE & SECONDARY PHYSICAL BRANCH:
 * Velocity influences secondary physical behavior only.
 * It NEVER modifies narrative state, scene progress, or base transforms.
 * All properties are bounded, damped, and decay smoothly to rest when velocity -> 0.
 */
export function resolveSecondaryPhysics(
  _velocity: number,
  activeAct: number
): SecondaryPhysicsState {
  return velocityEngine.resolvePhysics(activeAct);
}
