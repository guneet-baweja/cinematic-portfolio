/**
 * AMBIENT LOOP ENGINE (CATEGORY C - PHASE 7)
 * -------------------------------------------
 * High-performance, zero-allocation ambient engine.
 * Runs 100% INDEPENDENTLY of user scroll.
 *
 * CRITICAL ARCHITECTURAL ROLE:
 * When scroll stops:
 * - Category A (Scroll State): narrative pauses
 * - Category B (Velocity Response): momentum decays to 0.0
 * - Category C (Ambient Loop): CONTINUES RUNNING AT 60FPS/120FPS
 *
 * Ensures the website never appears frozen or crashed.
 */

export interface AmbientState {
  /** High-resolution accumulated ambient clock (seconds) */
  clockTime: number;

  /**
   * Microscopic organic camera drift [x, y, z] in world space.
   * Simulates a living steadicam/crane breathing effect (never rigid).
   */
  cameraDrift: [number, number, number];

  /**
   * Microscopic camera cranial tilt drift [pitch, roll] in radians.
   */
  cameraTiltDrift: [number, number];

  /**
   * Ambient and key light intensity breathing multiplier (1.0 +/- 0.04).
   * Simulates subtle celluloid projector bulb shimmer.
   */
  lightBreathing: number;

  /**
   * Continuous atmospheric fog density breathing multiplier (1.0 +/- 0.08).
   */
  atmosphericPulse: number;

  /**
   * Persistent ambient dust mote velocity accumulator.
   */
  particleWave: number;

  /**
   * Slow celestial/monolithic environmental rotation accumulator (radians).
   */
  environmentalRotation: number;

  /**
   * Stepped 24fps film noise phase (0..23).
   */
  noisePhase: number;
}

// Reusable zero-allocation ambient state container
const ambientState: AmbientState = {
  clockTime: 0,
  cameraDrift: [0, 0, 0],
  cameraTiltDrift: [0, 0],
  lightBreathing: 1.0,
  atmosphericPulse: 1.0,
  particleWave: 0,
  environmentalRotation: 0,
  noisePhase: 0,
};

class AmbientEngineManager {
  private time: number = 0;
  private noiseTimer: number = 0;

  /**
   * Continuous frame tick.
   * Called unconditionally on every RAF/GSAP ticker frame.
   */
  public tick(deltaTimeSeconds: number): AmbientState {
    // Clamped delta prevents time skips on tab switch
    const dt = Math.max(0.001, Math.min(0.1, deltaTimeSeconds));
    this.time += dt;
    this.noiseTimer += dt;

    const t = this.time;

    ambientState.clockTime = t;

    // 1. Organic Steadicam Camera Breathing Float (amplitude ~ 0.018 units)
    // Non-repeating multi-frequency harmonic sines
    ambientState.cameraDrift[0] = Math.sin(t * 0.7) * 0.014 + Math.cos(t * 1.3) * 0.006;
    ambientState.cameraDrift[1] = Math.cos(t * 0.5) * 0.016 + Math.sin(t * 1.1) * 0.007;
    ambientState.cameraDrift[2] = Math.sin(t * 0.4) * 0.012;

    // 2. Subtle Cranial Tilt & Banking Drift (~ 0.003 rad / ~ 0.17 deg)
    ambientState.cameraTiltDrift[0] = Math.sin(t * 0.6) * 0.0025;
    ambientState.cameraTiltDrift[1] = Math.cos(t * 0.45) * 0.0018;

    // 3. Living Light Breathing & Projector Bulb Shimmer (1.0 +/- 0.04)
    // 8Hz subtle filament vibration + 0.3Hz slow breathing
    ambientState.lightBreathing =
      1.0 + Math.sin(t * 1.8) * 0.035 + (Math.sin(t * 18.0) * 0.012);

    // 4. Atmospheric Fog Harmonic Pulse
    ambientState.atmosphericPulse = 1.0 + Math.sin(t * 0.8) * 0.06;

    // 5. Ambient Particle Wave Current
    ambientState.particleWave = t * 0.15;

    // 6. Slow Environmental Celestial Rotation (0.025 rad/s)
    ambientState.environmentalRotation = (t * 0.025) % (Math.PI * 2);

    // 7. Stepped 24fps Film Grain Phase
    if (this.noiseTimer >= 1 / 24) {
      ambientState.noisePhase = (ambientState.noisePhase + 1) % 24;
      this.noiseTimer = 0;
    }

    return ambientState;
  }

  public getState(): AmbientState {
    return ambientState;
  }
}

export const ambientEngine = new AmbientEngineManager();
