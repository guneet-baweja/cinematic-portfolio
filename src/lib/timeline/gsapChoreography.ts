/**
 * GSAP CHOREOGRAPHY ENGINE (PHASE 4: MASTER GSAP ARCHITECTURE)
 * -------------------------------------------------------------
 * Adheres strictly to 02_GSAP_SKILLS (core, timeline, performance, utils, react):
 * - Reusable, pre-instantiated, paused timelines (paused: true).
 * - ZERO timeline instantiation during scroll or wheel events.
 * - Deterministic scrubbing: masterProgress → sceneProgress → timeline.progress(sceneProgress).
 * - GSAP owns the animation choreography & curve evaluation.
 * - Three.js/R3F owns the GPU canvas rendering.
 * - Lenis owns smooth scroll input interpolation.
 * - No systems fight.
 */

import { gsap } from "../gsap";
import { APPLE_CURVE_NAMES } from "../motion/appleCurves";
import { ACT_RANGES } from "./sceneResolver";

/**
 * Interface for Act 01 (The Loading of an Idea) choreographed properties
 */
export interface Act01Choreography {
  particleScale: number;
  particleOpacity: number;
  frameScale: number;
  frameOpacity: number;
  latticeScale: number;
  latticeOpacity: number;
  latticeRotY: number;
}

/**
 * Interface for Act 03 (The Editor Arrives) choreographed properties
 */
export interface Act03Choreography {
  bladeX: number;
  bladeOpacity: number;
  leftCutX: number;
  rightCutX: number;
  timelineProgress: number;
  timelineScale: number;
  sparkIntensity: number;
}

/**
 * Interface for Act 05 (The Heart of Story) choreographed properties
 */
export interface Act05Choreography {
  constellationSpread: number;
  heroDistance: number;
  colorBloom: number;
  silhouettePulse: number;
  warmthFactor: number;
}

/**
 * Interface for Act 07 (World Becomes Composition / Break the Frame) choreographed properties
 */
export interface Act07Choreography {
  entranceFade: number;
  frameSpread: number;
  frameBreak: number;
  gridOpacity: number;
  heroZ: number;
  flankZ: number;
  exitFold: number;
  groupZ: number;
  layerSeparation: number;
  sparkExpansion: number;
  typoZ: number;
  typoOpacity: number;
}

/**
 * Interface for Act 08 (The Impossible Edit) choreographed properties
 */
export interface Act08Choreography {
  tumblerY: number;
  tumblerRotZ: number;
  shardScatter: number;
  characterZ: number;
  jumpElevation: number;
  gravityInversion: number;
  wallFoldAngle: number;
  frameConsolidation: number;
}

/**
 * Interface for Act 10 (Final Cinema / Mastered) recursive multi-tier pullback
 */
export interface Act10Choreography {
  masterScale: number;
  rotationY: number;
  rotationX: number;
  screenEmissive: number;
  metaFrameOpacity: number;
  loopParticleScale: number;
  loopParticleVisible: boolean;
}

// -----------------------------------------------------------------------------
// PRE-ALLOCATED MUTABLE STATE OBJECTS (Zero allocations in 60fps/120fps loops)
// -----------------------------------------------------------------------------

export const act01State: Act01Choreography = {
  particleScale: 1.0,
  particleOpacity: 1.0,
  frameScale: 0.0,
  frameOpacity: 0.0,
  latticeScale: 0.0,
  latticeOpacity: 0.0,
  latticeRotY: 0.0,
};

export const act03State: Act03Choreography = {
  bladeX: -3.85,
  bladeOpacity: 1.0,
  leftCutX: 0.0,
  rightCutX: 0.0,
  timelineProgress: 0.0,
  timelineScale: 0.0,
  sparkIntensity: 0.0,
};

export const act05State: Act05Choreography = {
  constellationSpread: 0.0,
  heroDistance: 5.0,
  colorBloom: 0.0,
  silhouettePulse: 1.0,
  warmthFactor: 0.0,
};

export const act07State: Act07Choreography = {
  entranceFade: 0.0,
  frameSpread: 0.0,
  frameBreak: 0.0,
  gridOpacity: 0.0,
  heroZ: 0.0,
  flankZ: 0.0,
  exitFold: 0.0,
  groupZ: 0.0,
  layerSeparation: 0.0,
  sparkExpansion: 0.0,
  typoZ: 0.0,
  typoOpacity: 0.0,
};

export const act08State: Act08Choreography = {
  tumblerY: 0.8,
  tumblerRotZ: 0.0,
  shardScatter: 0.0,
  characterZ: -2.0,
  jumpElevation: 0.0,
  gravityInversion: 0.0,
  wallFoldAngle: 0.0,
  frameConsolidation: 0.0,
};

export const act10State: Act10Choreography = {
  masterScale: 1.0,
  rotationY: 0.0,
  rotationX: 0.0,
  screenEmissive: 0.2,
  metaFrameOpacity: 0.4,
  loopParticleScale: 0.0,
  loopParticleVisible: false,
};

// -----------------------------------------------------------------------------
// REUSABLE PAUSED MASTER CHOREOGRAPHY TIMELINES
// Pre-built ONCE at initialization. Never re-instantiated on scroll.
// Enhanced with Apple-grade material-specific physical curves.
// -----------------------------------------------------------------------------

/**
 * Timeline for Act 01: The Loading of an Idea
 * Material: Particle (Fast Decay) -> Structural Monolith (Heavy / Settling)
 */
export const act01Timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
act01Timeline
  // 0.0 -> 0.35: Microscopic particle pulse & silky exponential fade
  .to(act01State, { particleScale: 0.01, particleOpacity: 0.0, duration: 0.35, ease: APPLE_CURVE_NAMES.FAST_DECAY }, 0)
  // 0.1 -> 0.5: Primary 16:9 film frame expansion (heavy monolithic weight)
  .to(act01State, { frameScale: 1.8, frameOpacity: 1.0, duration: 0.4, ease: APPLE_CURVE_NAMES.HEAVY }, 0.1)
  // 0.35 -> 1.0: Frame lattice proliferation (authoritative deceleration & continuous rhythm)
  .to(act01State, { latticeScale: 1.0, latticeOpacity: 0.85, duration: 0.65, ease: APPLE_CURVE_NAMES.HEAVY }, 0.35)
  .to(act01State, { latticeRotY: Math.PI * 0.5, duration: 0.65, ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM }, 0.35);

/**
 * Timeline for Act 03: The Editor Arrives
 * Material: Energy Laser (Anticipation + Razor Cut) -> Frame Halves & Timeline (Heavy Settling)
 */
export const act03Timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
act03Timeline
  // 0.0 -> 0.65: Laser blade sweeps with subtle anticipation into razor stroke
  .to(act03State, { bladeX: 3.85, duration: 0.65, ease: APPLE_CURVE_NAMES.ANTICIPATION }, 0)
  // Sparks burst with immediate response and soft decay
  .to(act03State, { sparkIntensity: 1.0, duration: 0.25, ease: APPLE_CURVE_NAMES.ENERGY }, 0.1)
  .to(act03State, { sparkIntensity: 0.0, duration: 0.35, ease: APPLE_CURVE_NAMES.FAST_DECAY }, 0.35)
  // 0.25 -> 0.8: Sliced halves separate with physical mass and damped micro-settle
  .to(act03State, { leftCutX: -1.2, rightCutX: 1.2, duration: 0.55, ease: APPLE_CURVE_NAMES.HEAVY_SETTLING }, 0.25)
  // 0.55 -> 1.0: 3D timeline ribbon converges into place with controlled physical lock (no cartoon bounce)
  .to(act03State, { timelineProgress: 1.0, timelineScale: 1.0, duration: 0.45, ease: APPLE_CURVE_NAMES.HEAVY_SETTLING }, 0.55)
  .to(act03State, { bladeOpacity: 0.0, duration: 0.15, ease: APPLE_CURVE_NAMES.ENERGY }, 0.85);

/**
 * Timeline for Act 05: The Heart of Story
 * Material: Glass / Optical Refraction (Viscous caustics, soft bloom)
 */
export const act05Timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
act05Timeline
  // 0.0 -> 0.5: Memories orbit with optical dispersion ease
  .to(act05State, { constellationSpread: 1.0, duration: 0.5, ease: APPLE_CURVE_NAMES.GLASS }, 0)
  // 0.35 -> 0.85: Hero memory approaches with continuous camera rhythm & chromatic bloom
  .to(act05State, { heroDistance: 0.0, duration: 0.5, ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM }, 0.35)
  .to(act05State, { colorBloom: 1.0, warmthFactor: 1.0, duration: 0.5, ease: APPLE_CURVE_NAMES.GLASS }, 0.35)
  // 0.6 -> 1.0: Silhouette pulses with dignified emotional breath
  .to(act05State, { silhouettePulse: 1.35, duration: 0.4, ease: APPLE_CURVE_NAMES.TYPOGRAPHY }, 0.6);

/**
 * Timeline for Act 07: World Becomes Composition (Break the Frame)
 * Material: Dimensional Rupture -> Architectural Multi-Frame Gallery
 */
export const act07Timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
act07Timeline
  // 0.0 -> 0.20: Seamless entrance bloom emerging from Act 6 spectral light rays
  .to(act07State, { entranceFade: 1.0, duration: 0.20, ease: "power2.out" }, 0)
  // 0.05 -> 0.65: Aspect ratio frames spread and unfold in 3D perspective gallery
  .to(act07State, { frameSpread: 1.0, duration: 0.60, ease: APPLE_CURVE_NAMES.HEAVY_SETTLING }, 0.05)
  // 0.10 -> 0.70: Golden ratio & rule-of-thirds grid unmasks with optical precision
  .to(act07State, { gridOpacity: 0.9, duration: 0.60, ease: APPLE_CURVE_NAMES.TYPOGRAPHY }, 0.10)
  // 0.20 -> 0.80: Frame boundaries break into luminous spark particles
  .to(act07State, { frameBreak: 1.0, sparkExpansion: 2.0, duration: 0.60, ease: APPLE_CURVE_NAMES.ANTICIPATION }, 0.20)
  // 0.15 -> 0.85: Hero frame and flanking frames drift with controlled spatial presence
  .to(act07State, { heroZ: 0.6, flankZ: -0.4, duration: 0.70, ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM }, 0.15)
  // 0.75 -> 1.00: Frames fold architecturally inward to seamlessly construct Act 08 Impossible Room
  .to(act07State, { exitFold: 1.0, duration: 0.25, ease: "power2.inOut" }, 0.75)
  // Maintain continuous spatial dignity without pushing past camera
  .to(act07State, { groupZ: 0.0, layerSeparation: 1.0, typoZ: 0.8, typoOpacity: 0.95, duration: 1.0 }, 0);

/**
 * Timeline for Act 08: The Impossible Edit
 * Material: Gravity Acceleration -> Gravitational Inversion -> Monolithic Spatial Fold
 */
export const act08Timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
act08Timeline
  // 0.0 -> 0.4: Tumbler drops under physical gravity
  .to(act08State, { tumblerY: -1.2, tumblerRotZ: Math.PI * 0.5, duration: 0.4, ease: "power2.in" }, 0)
  .to(act08State, { shardScatter: 1.0, duration: 0.35, ease: APPLE_CURVE_NAMES.FAST_DECAY }, 0.1)
  // 0.15 -> 0.65: Character suspension with continuous steadicam rhythm
  .to(act08State, { characterZ: 0.5, jumpElevation: 1.2, duration: 0.5, ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM }, 0.15)
  // 0.35 -> 0.8: Gravitational inversion with viscous optical lift
  .to(act08State, { gravityInversion: 1.0, duration: 0.45, ease: APPLE_CURVE_NAMES.GLASS }, 0.35)
  // 0.55 -> 0.95: Heavy studio walls fold inward (spatial origami)
  .to(act08State, { wallFoldAngle: Math.PI * 0.5, duration: 0.4, ease: APPLE_CURVE_NAMES.HEAVY }, 0.55)
  // 0.85 -> 1.0: Flat 2D film frame consolidation with authoritative lock
  .to(act08State, { frameConsolidation: 1.0, duration: 0.15, ease: APPLE_CURVE_NAMES.HEAVY_SETTLING }, 0.85);

/**
 * Timeline for Act 10: Final Cinema / Mastered Work Showcase
 * Material: Stately Cinematic Settle & Screen Glow Focus
 */
export const act10Timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
act10Timeline
  // Multi-tier cinema arrival: stately cinematic arrival at full majestic scale
  .fromTo(act10State, { masterScale: 0.75 }, { masterScale: 1.0, duration: 1.0, ease: APPLE_CURVE_NAMES.HEAVY }, 0)
  .fromTo(act10State, { rotationY: -0.15 }, { rotationY: 0.0, duration: 0.85, ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM }, 0)
  .fromTo(act10State, { screenEmissive: 0.2 }, { screenEmissive: 1.0, duration: 0.7, ease: APPLE_CURVE_NAMES.ENERGY }, 0.1)
  .to(act10State, { metaFrameOpacity: 0.9, duration: 0.4, ease: APPLE_CURVE_NAMES.HEAVY }, 0.4);

// -----------------------------------------------------------------------------
// DETERMINISTIC SCRUBBING ENGINE
// Evaluates timeline progress without allocating any objects.
// -----------------------------------------------------------------------------

/**
 * Updates choreographed state for all acts deterministically.
 * Guarantees that the exact same masterProgress produces the exact same properties
 * across all acts, completely eliminating timeline state leakage when seeking, reversing, or jumping.
 */
export function scrubActTimeline(_act: number, actProgress: number, masterProgress?: number) {
  let mP = masterProgress;
  if (mP === undefined) {
    const range = ACT_RANGES[0];
    if (range) {
      mP = range.start + actProgress * (range.end - range.start);
    } else {
      mP = actProgress;
    }
  }

  const p = Math.max(0, Math.min(1, mP));

  // Act 03 Cinema Climax: [0.60 -> 1.00]
  act10Timeline.progress(Math.max(0, Math.min(1, (p - 0.60) / 0.40)));
}

/**
 * Reusable GSAP utility helpers for zero-cost math operations
 */
export const gsapUtils = {
  clamp: gsap.utils.clamp,
  mapRange: gsap.utils.mapRange,
  interpolate: gsap.utils.interpolate,
  snap: gsap.utils.snap,
};
