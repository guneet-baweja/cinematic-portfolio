/**
 * VELOCITY & SECONDARY PHYSICAL RESPONSE ENGINE (PHASE 6)
 * --------------------------------------------------------
 * High-performance, zero-allocation physics engine translating scroll dynamics
 * into secondary physical responses.
 *
 * CRITICAL FIRST PRINCIPLES (Strict Invariants):
 * 1. ZERO CUMULATIVE DRIFT:
 *    Every physical response is an ADDITIVE OFFSET or MULTIPLICATIVE FACTOR:
 *    finalCameraPosition = baseCameraPosition + pointerOffset + velocityCameraOffset
 *    NEVER cameraPosition += velocity every frame.
 *    When velocity -> 0, all additive offsets decay to 0, all multipliers return to 1.0.
 *
 * 2. NARRATIVE ISOLATION:
 *    Velocity CANNOT alter scene identity, scene progress, object base positions,
 *    timeline state, or narrative ordering.
 *
 * 3. BOUNDED & DAMPED:
 *    Raw velocity clamped to [-1.0, 1.0].
 *    Frame-rate-independent continuous exponential decay on every frame tick.
 *    Delta-time clamped to [0.001, 0.1] to prevent numerical instability.
 *    Sudden progress jumps (> 0.08) instantly reset velocity and physical offsets.
 */

export interface SecondaryPhysicsState {
  /**
   * 1. CAMERA MOMENTUM: Additive offset [x, y, z] in camera coordinate space.
   * Decays smoothly to [0, 0, 0] at rest.
   */
  cameraMomentum: [number, number, number];

  /**
   * 2. MICRO CAMERA MOVEMENT:
   * - rotationOffset: [pitch, yaw, roll] aerodynamic tilt and Dutch banking.
   * - fovOffset: focal length compression / expansion (degrees).
   * - cameraRumble: high-frequency optical micro-vibration during extreme velocity bursts.
   */
  cameraRotationOffset: [number, number, number];
  fovOffset: number;
  cameraRumble: number;

  /**
   * 3. PARTICLES:
   * - speedMultiplier: accelerates particle simulation (baseline 1.0).
   * - stretchZ: elongation factor along travel axis (baseline 1.0).
   * - turbulence: particle dispersion amplitude (baseline 0.0).
   */
  particleSpeedMultiplier: number;
  particleStretchZ: number;
  particleTurbulence: number;

  /**
   * 4. ATMOSPHERIC MOTION:
   * - driftSpeed: accelerated cosmic dust / ember drift.
   * - fogDensityOffset: subtle atmospheric fog thickening during high speed.
   */
  atmosphericDrift: number;
  fogDensityOffset: number;

  /**
   * 5. SHADER DISTORTION:
   * - chromaticAberration: screen-space optical dispersion (baseline 0.0008).
   * - distortion: lens barrel / radial distortion (baseline 0.0).
   * - waveDistortion: surface UV ripple amplitude (baseline 0.0).
   */
  chromaticAberration: number;
  distortion: number;
  waveDistortion: number;

  /**
   * 6. MOTION BLUR:
   * - tunnelStretch: Z-axis extrusion of instanced frames (baseline 1.0).
   * - motionBlurStrength: normalized motion blur intensity 0..1 (baseline 0.0).
   */
  tunnelStretch: number;
  motionBlurStrength: number;

  /**
   * 7. LIGHT STREAKS:
   * - lightStreakIntensity: wireframe emissive multiplier (baseline 1.0).
   * - bloomBoost: screen-space bloom pulse intensity (baseline 0.0).
   */
  lightStreakIntensity: number;
  bloomBoost: number;

  /**
   * 8. SECONDARY PARALLAX:
   * - secondaryParallax: lateral & vertical displacement offset for floating layers (baseline 0.0).
   */
  secondaryParallax: number;
}

// Reusable zero-allocation physical response state
const physicsState: SecondaryPhysicsState = {
  cameraMomentum: [0, 0, 0],
  cameraRotationOffset: [0, 0, 0],
  fovOffset: 0,
  cameraRumble: 0,
  particleSpeedMultiplier: 1.0,
  particleStretchZ: 1.0,
  particleTurbulence: 0.0,
  atmosphericDrift: 1.0,
  fogDensityOffset: 0.0,
  chromaticAberration: 0.0008,
  distortion: 0.0,
  waveDistortion: 0.0,
  tunnelStretch: 1.0,
  motionBlurStrength: 0.0,
  lightStreakIntensity: 1.0,
  bloomBoost: 0.0,
  secondaryParallax: 0.0,
};

class VelocityEngineManager {
  /** Maximum allowable absolute normalized velocity */
  private readonly MAX_VELOCITY = 1.0;

  /** Decay rate constant lambda: settles smoothly to 0 within ~300ms */
  private readonly DECAY_RATE = 18.0;

  /** Raw un-smoothed normalized velocity from scroll events [-1..1] */
  public rawVelocity: number = 0;

  /** Smoothed, bounded instantaneous velocity [-1..1] */
  public velocity: number = 0;

  /** Non-linear curved velocity intensity [-1..1] */
  public intensity: number = 0;

  /** Direction: 1 = forward, -1 = reverse, 0 = rest */
  public direction: 1 | -1 | 0 = 0;

  /** Time accumulator for micro-rumble noise generation */
  private rumbleTime: number = 0;

  /** Low-pass filtered target velocity */
  private filteredTarget: number = 0;

  /**
   * Non-linear velocity response curve:
   * - Low velocity: silky, calm, almost zero distraction
   * - Medium velocity: crisp, responsive cinematic momentum
   * - High velocity: strong cinematic energy
   * - Extreme velocity: capped safely at 1.0 with zero overshoot
   */
  private computeCurvedIntensity(vel: number): number {
    const sign = Math.sign(vel);
    const abs = Math.abs(vel);
    // Quadratic ease-in: smooth thresholding at low speeds, energetic at high speeds
    const curved = Math.min(1.0, Math.pow(abs, 1.25));
    return sign * curved;
  }

  /**
   * Apply raw velocity impulse from scroll engine (e.g. Lenis)
   */
  public applyImpulse(rawInput: number): void {
    // 1. Strict Clamping: prevents runaway wheel or fling spikes
    const clampedRaw = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, rawInput));
    this.rawVelocity = clampedRaw;

    // 2. Spike Suppression: rate-of-change limiter against single-frame trackpad flings
    const maxDeltaPerEvent = 0.45;
    const delta = clampedRaw - this.filteredTarget;
    if (Math.abs(delta) > maxDeltaPerEvent) {
      this.filteredTarget += Math.sign(delta) * maxDeltaPerEvent;
    } else {
      this.filteredTarget = clampedRaw;
    }

    // 3. Exponential moving blend towards new filtered input
    this.velocity = this.velocity * 0.70 + this.filteredTarget * 0.30;
    this.finalizeVelocityState();
  }

  /**
   * Continuous frame-rate-independent physics tick.
   * MUST be called every frame in GSAP ticker / RAF loop to guarantee
   * smooth exponential decay to exact 0.0 even if scroll events cease.
   */
  public tick(deltaTimeSeconds: number, activeAct: number = 1): SecondaryPhysicsState {
    // Clamping deltaTime to [0.001, 0.1] guarantees numerical stability during tab switch or lag
    const dt = Math.max(0.001, Math.min(0.1, deltaTimeSeconds));
    this.rumbleTime += dt;

    // Frame-rate independent exponential decay: v(t + dt) = v(t) * exp(-lambda * dt)
    const decayFactor = Math.exp(-this.DECAY_RATE * dt);
    this.velocity *= decayFactor;
    this.filteredTarget *= decayFactor;
    this.rawVelocity *= decayFactor;

    // Hard threshold snap: eliminate microscopic floating point noise below 0.0008
    if (Math.abs(this.velocity) < 0.0008) {
      this.velocity = 0;
      this.rawVelocity = 0;
      this.filteredTarget = 0;
    }

    this.finalizeVelocityState();
    return this.resolvePhysics(activeAct);
  }

  /**
   * Update derived velocity properties
   */
  private finalizeVelocityState(): void {
    this.intensity = this.computeCurvedIntensity(this.velocity);

    if (Math.abs(this.velocity) < 0.0006) {
      this.direction = 0;
    } else {
      this.direction = this.velocity > 0 ? 1 : -1;
    }
  }

  /**
   * Instantly snap velocity and physical offsets to 0.
   * Call when user makes an arbitrary timeline jump or seek to prevent whiplash.
   */
  public reset(): void {
    this.rawVelocity = 0;
    this.velocity = 0;
    this.intensity = 0;
    this.filteredTarget = 0;
    this.direction = 0;
    this.resolvePhysics(1);
  }

  /**
   * Compute all 8 secondary physical response properties for the current frame.
   * PURE DERIVATION: No internal position accumulators!
   */
  public resolvePhysics(activeAct: number): SecondaryPhysicsState {
    const v = this.velocity;
    const intensity = this.intensity;
    const absIntensity = Math.abs(intensity);
    const absV = Math.abs(v);

    // =========================================================================
    // 1. CAMERA MOMENTUM (Additive Offset)
    // =========================================================================
    // Flight acts (Act 02 & Act 09): Z-compression along travel corridor
    // Static acts: Subtle vertical inertia
    if (activeAct === 2 || activeAct === 9) {
      physicsState.cameraMomentum[0] = 0;
      physicsState.cameraMomentum[1] = 0;
      physicsState.cameraMomentum[2] = -intensity * 1.8; // [-1.8, 1.8] max
    } else {
      physicsState.cameraMomentum[0] = 0;
      physicsState.cameraMomentum[1] = -intensity * 0.14; // [-0.14, 0.14] max
      physicsState.cameraMomentum[2] = 0;
    }

    // =========================================================================
    // 2. MICRO CAMERA MOVEMENT (Pitch, Roll, FOV, Rumble)
    // =========================================================================
    // Aerodynamic pitch: dive on forward scroll, lift on reverse
    physicsState.cameraRotationOffset[0] = -intensity * 0.024; // rad (~1.37 deg)
    physicsState.cameraRotationOffset[1] = 0;
    // Dutch tilt roll: subtle aerodynamic banking
    physicsState.cameraRotationOffset[2] = -intensity * 0.016; // rad (~0.91 deg)

    // Dynamic FOV breath: focal compression during high-speed travel (clamped <= 2 deg)
    physicsState.fovOffset = absIntensity * 1.5;

    // High-velocity optical micro-rumble: only triggers during extreme velocity bursts (> 0.55)
    if (absV > 0.55) {
      const rumbleStrength = (absV - 0.55) / 0.45;
      physicsState.cameraRumble =
        (Math.sin(this.rumbleTime * 45.0) * 0.5 + Math.cos(this.rumbleTime * 32.0) * 0.5) *
        rumbleStrength *
        0.008;
    } else {
      physicsState.cameraRumble = 0;
    }

    // =========================================================================
    // 3. PARTICLES (Speed, Stretch, Turbulence)
    // =========================================================================
    // Multipliers return strictly to 1.0 at rest; turbulence to 0.0
    physicsState.particleSpeedMultiplier = 1.0 + absIntensity * 2.5;
    physicsState.particleStretchZ = 1.0 + absIntensity * 4.0;
    physicsState.particleTurbulence = absIntensity * 0.85;

    // =========================================================================
    // 4. ATMOSPHERIC MOTION (Drift, Fog)
    // =========================================================================
    physicsState.atmosphericDrift = 1.0 + absIntensity * 2.2;
    physicsState.fogDensityOffset = absIntensity * 0.006;

    // =========================================================================
    // 5. SHADER DISTORTION (Chromatic Aberration, Lens Distortion, UV Wave)
    // =========================================================================
    // Decays smoothly to filmic baseline (0.0008) at rest
    physicsState.chromaticAberration = 0.0008 + absIntensity * 0.0034;
    // Radial barrel distortion: 0.0 at rest, max 0.22 at high velocity
    physicsState.distortion = absIntensity * 0.22;
    // Surface UV wave distortion: 0.0 at rest, max 0.035
    physicsState.waveDistortion = intensity * 0.035;

    // =========================================================================
    // 6. MOTION BLUR (Tunnel Hyperspeed Z-Stretch, Motion Blur Factor)
    // =========================================================================
    // Instanced geometry scale multiplier: returns to 1.0 at rest, max 15.0
    physicsState.tunnelStretch = 1.0 + Math.min(14.0, absIntensity * 15.0);
    physicsState.motionBlurStrength = absIntensity;

    // =========================================================================
    // 7. LIGHT STREAKS (Emissive Warp, Bloom Pulse)
    // =========================================================================
    // Wireframe emissive multiplier: baseline 1.0, peaks at 3.5
    physicsState.lightStreakIntensity = 1.0 + absIntensity * 2.5;
    // Screen-space bloom flare boost: baseline 0.0, peaks at 0.45 (total 0.7 -> 1.15)
    physicsState.bloomBoost = absIntensity * 0.45;

    // =========================================================================
    // 8. SECONDARY PARALLAX (HUD & Depth Displacements)
    // =========================================================================
    // Pure additive displacement: 0.0 at rest, max +/-0.18
    physicsState.secondaryParallax = intensity * 0.18;

    return physicsState;
  }
}

export const velocityEngine = new VelocityEngineManager();
