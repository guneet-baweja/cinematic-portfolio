/**
 * timeline.js — 250-Frame Master Timeline & Animation State Machine
 */

export class TimelineController {
  constructor(options = {}) {
    this.totalFrames = options.totalFrames || 250;
    this.fps = options.fps || 30;
    this.currentFrame = 1;
    this.isPlaying = true;
    this.speed = 1.0;
    this.loop = true;

    this.listeners = new Set();
  }

  onFrameChange(callback) {
    this.listeners.add(callback);
  }

  notify() {
    const frameInt = Math.round(this.currentFrame);
    const phase = this.getPhaseName(frameInt);
    const timecode = this.getTimecode(frameInt);

    for (const cb of this.listeners) {
      cb({
        frame: frameInt,
        rawFrame: this.currentFrame,
        phase,
        timecode,
        isPlaying: this.isPlaying,
        speed: this.speed,
      });
    }
  }

  play() {
    this.isPlaying = true;
    this.notify();
  }

  pause() {
    this.isPlaying = false;
    this.notify();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.notify();
    return this.isPlaying;
  }

  seek(frame) {
    this.currentFrame = Math.max(1, Math.min(this.totalFrames, frame));
    this.notify();
  }

  step(delta) {
    this.seek(this.currentFrame + delta);
  }

  setSpeed(speed) {
    this.speed = speed;
    this.notify();
  }

  update(deltaTimeSeconds) {
    if (!this.isPlaying) return;

    // Advance frame based on delta time and playback speed
    const frameAdvance = deltaTimeSeconds * this.fps * this.speed;
    this.currentFrame += frameAdvance;

    if (this.currentFrame > this.totalFrames) {
      if (this.loop) {
        this.currentFrame = 1 + (this.currentFrame - this.totalFrames);
      } else {
        this.currentFrame = this.totalFrames;
        this.isPlaying = false;
      }
    } else if (this.currentFrame < 1) {
      this.currentFrame = 1;
    }

    this.notify();
  }

  getPhaseName(frame) {
    if (frame <= 24) return "CIRCULAR AVATAR";
    if (frame <= 55) return "3D RING DETACHMENT";
    if (frame <= 115) return "FACE DOLLY-IN";
    if (frame <= 170) return "EYE TARGETING";
    return "MACRO IRIS & PUPIL DIVE";
  }

  getTimecode(frame) {
    const totalSeconds = Math.floor((frame - 1) / this.fps);
    const remainderFrames = (frame - 1) % this.fps;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, "0");
    return `00:${pad(minutes)}:${pad(seconds)}:${pad(remainderFrames)}`;
  }
}
