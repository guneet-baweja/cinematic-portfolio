import * as THREE from "three";
import { createScene } from "./scene.js";
import { createCamera, updateCamera } from "./camera.js";
import { createLighting, updateLighting } from "./lighting.js";
import { createParticles, updateParticles } from "./particles.js";
import { createRing, updateRing } from "./ring.js";
import { createAvatar, updateAvatar } from "./avatar.js";
import { createEye, updateEye } from "./eye.js";
import { TimelineController } from "./timeline.js";

/**
 * main.js — Orchestrator for 3D Video Sequence Reconstruction
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("canvas-container");
  if (!container) return;

  // 1. Initialize Scene & Renderer
  const { scene, renderer } = createScene(container);

  // 2. Initialize Camera
  const { camera, onResize: onCameraResize } = createCamera(container);

  // 3. Initialize Lighting Rig
  const lights = createLighting(scene);

  // 4. Initialize Particle Field & Diamond Sparkle
  const particles = createParticles(scene);

  // 5. Initialize 3D Orbital Blue Ring
  const ring = createRing(scene);

  // 6. Initialize Subject Avatar & Blue Backdrop
  const avatar = createAvatar(scene);

  // 7. Initialize Macro Eye & Pupil Dilation Layer
  const eye = createEye(scene);

  // 8. Initialize 250-Frame Master Timeline
  const timeline = new TimelineController({
    totalFrames: 250,
    fps: 30,
  });

  // Expose on window for automated verification suites
  window.__reconstructionTimeline = timeline;
  window.__reconstructionScene = { scene, camera, renderer };

  // ==========================================================================
  // DOM UI Bindings
  // ==========================================================================
  const phaseLabel = document.getElementById("phase-label");
  const timecodeLabel = document.getElementById("timecode-label");
  const frameCounter = document.getElementById("frame-counter");
  const scrubber = document.getElementById("timeline-scrubber");
  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnRestart = document.getElementById("btn-restart");
  const speedButtons = document.querySelectorAll(".speed-btn");

  let isUserScrubbing = false;

  // Sync UI when timeline updates
  timeline.onFrameChange((state) => {
    if (phaseLabel) phaseLabel.textContent = ` ${state.phase}`;
    if (timecodeLabel) timecodeLabel.textContent = state.timecode;
    if (frameCounter) frameCounter.textContent = String(state.frame).padStart(3, "0");

    if (scrubber && !isUserScrubbing) {
      scrubber.value = String(state.frame);
    }

    if (btnPlayPause) {
      btnPlayPause.textContent = state.isPlaying ? "⏸ PAUSE" : "▶ PLAY";
      btnPlayPause.classList.toggle("active", state.isPlaying);
    }
  });

  // Scrubber Events
  if (scrubber) {
    scrubber.addEventListener("input", (e) => {
      isUserScrubbing = true;
      const targetFrame = parseInt(e.target.value, 10);
      timeline.seek(targetFrame);
    });

    scrubber.addEventListener("change", () => {
      isUserScrubbing = false;
    });
  }

  // Play / Pause Button
  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", () => {
      timeline.togglePlay();
    });
  }

  // Step -1 Frame
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      timeline.pause();
      timeline.step(-1);
    });
  }

  // Step +1 Frame
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      timeline.pause();
      timeline.step(1);
    });
  }

  // Restart Button
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      timeline.seek(1);
      timeline.play();
    });
  }

  // Speed Selector Buttons
  speedButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      speedButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const speed = parseFloat(btn.getAttribute("data-speed") || "1.0");
      timeline.setSpeed(speed);
    });
  });

  // Keyboard Navigation
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      timeline.togglePlay();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      timeline.pause();
      timeline.step(-1);
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      timeline.pause();
      timeline.step(1);
    } else if (e.code === "Home") {
      e.preventDefault();
      timeline.seek(1);
    }
  });

  // Window Resize
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    onCameraResize();
  };
  window.addEventListener("resize", handleResize);

  // ==========================================================================
  // Master 60 FPS Render Loop
  // ==========================================================================
  let lastTime = performance.now();
  const startTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const elapsedTime = (now - startTime) / 1000;

    // 1. Advance timeline state
    timeline.update(delta);
    const currentFrame = timeline.currentFrame;

    // 2. Update 3D Camera flight along trajectory
    updateCamera(camera, currentFrame);

    // 3. Update lighting intensities
    updateLighting(lights, currentFrame);

    // 4. Update floating bokeh particles & diamond sparkle
    updateParticles(particles, currentFrame, elapsedTime);

    // 5. Update 3D orbital blue ring (rotation, tilt, dissolve)
    updateRing(ring, currentFrame);

    // 6. Update subject portrait & blue backdrop dissolve
    updateAvatar(avatar, currentFrame, elapsedTime);

    // 7. Update macro eye & pupil dilation
    updateEye(eye, currentFrame);

    // 8. Render Three.js frame
    renderer.render(scene, camera);
  }

  animate();
  console.log("3D Sequence Reconstruction initialized and running smoothly.");
});
