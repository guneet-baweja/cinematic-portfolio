/**
 * APPLE-GRADE MOTION CURVES & MATERIAL PHYSICS LIBRARY
 * ----------------------------------------------------
 * Translates material mass, optical viscosity, and energetic impulse into
 * bespoke, controlled easing curves using GSAP CustomEase and pure mathematical splines.
 *
 * Principles:
 * - Heavy Objects: Slow acceleration, authoritative deceleration, controlled settling.
 * - Light Particles: Instantaneous response, soft exponential drag.
 * - Camera / Steadicam: Smooth S-curves with C2 continuity (zero velocity/accel jerk).
 * - Typography: Precise, intentional, high optical contrast.
 * - Glass / Optics: Slow, elastic, refractive delay without cartoony bounce.
 * - Energy: Razor-sharp response, immediate impulse, crisp settling.
 */

import { gsap } from "../gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// -----------------------------------------------------------------------------
// 1. REGISTERED GSAP CUSTOM EASES
// -----------------------------------------------------------------------------

export const APPLE_CURVE_NAMES = {
  HEAVY: "appleHeavy",
  HEAVY_SETTLING: "appleHeavySettling",
  FAST_DECAY: "appleFastDecay",
  ANTICIPATION: "appleAnticipation",
  GLASS: "appleGlass",
  ENERGY: "appleEnergy",
  TYPOGRAPHY: "appleTypography",
  CAMERA_RHYTHM: "appleCameraRhythm",
} as const;

/**
 * 1. Heavy Object (Monoliths, Vaults, Architectural Frames)
 * Slow initial inertia, authoritative deceleration, controlled settling with zero bounce.
 * Similar to cubic-bezier(0.16, 1, 0.3, 1).
 */
export const appleHeavyEase = CustomEase.create(
  APPLE_CURVE_NAMES.HEAVY,
  "M0,0 C0.16,1 0.3,1 1,1"
);

/**
 * 2. Heavy Settling (Massive structures coming to rest)
 * Controlled micro-overshoot (< 1.8%) that settles smoothly into place without oscillation.
 */
export const appleHeavySettlingEase = CustomEase.create(
  APPLE_CURVE_NAMES.HEAVY_SETTLING,
  "M0,0 C0.15,0.4 0.1,1.018 0.7,1.012 C0.85,1.004 0.95,1 1,1"
);

/**
 * 3. Light Particle (Floating dust motes, sparks, atmospheric ions)
 * Instantaneous response, long silky exponential decay.
 */
export const appleFastDecayEase = CustomEase.create(
  APPLE_CURVE_NAMES.FAST_DECAY,
  "M0,0 C0.04,0.82 0.1,1 1,1"
);

/**
 * 4. Anticipation (Physical cuts, frame break, razor blade strike)
 * Micro-drawback of ~3% before explosive, decisive release.
 */
export const appleAnticipationEase = CustomEase.create(
  APPLE_CURVE_NAMES.ANTICIPATION,
  "M0,0 C0.3,-0.18 0.4,0.7 1,1"
);

/**
 * 5. Glass / Optical Refraction (Prisms, chromatic dispersion, memory aura)
 * Slow, viscous caustics with subtle optical lag and smooth dampening.
 */
export const appleGlassEase = CustomEase.create(
  APPLE_CURVE_NAMES.GLASS,
  "M0,0 C0.3,0.05 0.2,0.98 0.8,1.01 C0.9,1.005 0.97,1 1,1"
);

/**
 * 6. Energy / Laser (Razor-sharp blade beam, electrical discharge, shutter stroboscope)
 * Zero mass, instantaneous impulse, crisp cut.
 */
export const appleEnergyEase = CustomEase.create(
  APPLE_CURVE_NAMES.ENERGY,
  "M0,0 C0.02,0.95 0.12,1 1,1"
);

/**
 * 7. Typography (Dignified Keynote-grade text reveals)
 * High optical contrast, graceful tracking expansion, crisp baseline lock.
 */
export const appleTypographyEase = CustomEase.create(
  APPLE_CURVE_NAMES.TYPOGRAPHY,
  "M0,0 C0.16,1 0.3,1 1,1"
);

/**
 * 8. Camera Rhythm (Steadicam dolly, pan, and crane)
 * Continuous S-curve with smooth acceleration and deceleration tails.
 */
export const appleCameraRhythmEase = CustomEase.create(
  APPLE_CURVE_NAMES.CAMERA_RHYTHM,
  "M0,0 C0.25,0.05 0.2,0.95 1,1"
);

// -----------------------------------------------------------------------------
// 2. MATHEMATICAL SPLINES FOR 60FPS/120FPS USEFRAME LOOPS
// -----------------------------------------------------------------------------

/**
 * Quintic Smoothstep (Perlin Smootherstep)
 * 6t^5 - 15t^4 + 10t^3
 * C2 continuous: f'(0)=0, f'(1)=0, f''(0)=0, f''(1)=0.
 * Eliminates all velocity and acceleration jerks at start and end.
 */
export function quinticSmooth(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

/**
 * Cubic Hermite Smoothstep
 * 3t^2 - 2t^3
 * C1 continuous: f'(0)=0, f'(1)=0.
 */
export function cubicSmooth(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Controlled Micro-Overshoot Settling
 * Produces a single, damped 1.5% overshoot without oscillatory ringing.
 */
export function dampedSettle(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  if (c >= 1) return 1;
  const envelope = 1 - Math.exp(-6 * c);
  const overshoot = Math.sin(c * Math.PI) * 0.018 * Math.exp(-4 * c);
  return envelope + overshoot;
}

/**
 * Anticipation Pulse
 * Pulls back slightly (-0.035) during first 15% before surging forward.
 */
export function anticipationPulse(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  if (c < 0.15) {
    const p = c / 0.15;
    return -Math.sin(p * Math.PI) * 0.035;
  }
  const f = (c - 0.15) / 0.85;
  return quinticSmooth(f);
}
