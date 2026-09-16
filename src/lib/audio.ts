/**
 * THE ARCHITECT OF TIME - CINEMATIC TEMPORAL AUDIO ENGINE
 * -------------------------------------------------------
 * Web Audio API synthesizer:
 * - Sub-bass ambient drone (55Hz A1 + 110Hz sub-octave)
 * - Velocity-driven lowpass filter modulation (simulating analog tape transport)
 * - Analog mechanical shutter click on cuts and boundary transitions
 * - Strategic blackout silence during hyperspace climax (Act 08 -> 09)
 */

class TemporalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isMuted: boolean = true;
  private lastAct: number = 0;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Lowpass resonant filter
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Oscillator 1: 55Hz (A1 fundamental drone)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.osc1.connect(this.filter);
      this.osc1.start();

      // Oscillator 2: 110Hz (Subtle harmonic overtone)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.osc2.connect(osc2Gain);
      osc2Gain.connect(this.filter);
      this.osc2.start();
    } catch {
      // Web Audio API unavailable or blocked
    }
  }

  toggle(): boolean {
    if (!this.ctx) this.init();
    if (this.ctx?.state === "suspended") {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;

    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0.0001 : 0.085;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
    }

    // Play tactile activation chirp
    if (!this.isMuted) {
      this.playShutterClick(0.6);
    }

    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Modulate drone cutoff and pitch based on scroll velocity (analog tape shuttle whoosh & reverse rewind)
   */
  updateVelocity(normVelocity: number) {
    if (this.isMuted || !this.filter || !this.ctx || !this.osc1) return;
    const absVel = Math.min(1.0, Math.abs(normVelocity));
    const isReverse = normVelocity < -0.05;

    // 1. Filter cutoff frequency modulation
    const targetFreq = 160 + absVel * 380; // sweeps from 160Hz up to 540Hz during fast scroll
    this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);

    // 2. Analog tape rewind pitch modulation: reverse scrubbing pitches fundamental up (55Hz -> 78Hz)
    const targetPitch = isReverse ? 55 + absVel * 24 : 55;
    this.osc1.frequency.setTargetAtTime(targetPitch, this.ctx.currentTime, 0.1);
  }

  /**
   * Monitor Act transitions for tactile cuts and strategic silence
   */
  updateAct(act: number) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    if (act !== this.lastAct) {
      this.lastAct = act;
      // Trigger tactile cut click
      this.playShutterClick(0.4);

      // Strategic silence before final cinema climax
      if (act === 3) {
        this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          if (!this.isMuted && this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(0.085, this.ctx.currentTime, 1.2);
          }
        }, 1400);
      }
    }
  }

  /**
   * Synthesize mechanical shutter cut click
   */
  playShutterClick(intensity = 0.5) {
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.025);

      clickGain.gain.setValueAtTime(0.09 * intensity, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio click fallback
    }
  }
}

export const audioEngine = new TemporalAudioEngine();
