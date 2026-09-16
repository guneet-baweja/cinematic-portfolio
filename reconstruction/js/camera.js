import * as THREE from "three";

/**
 * camera.js — Cinematic Camera Rig & Spline Path Interpolation
 * Reproduces the exact multi-phase camera flight across Frames 001 to 250.
 */

export function createCamera(container) {
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);
  camera.position.set(0, 0, 5.2);
  camera.lookAt(0, 0, 0);

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  };

  return { camera, onResize };
}

// Smooth cubic easing helper
function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

// Smooth quintic easing for ultra-cinematic acceleration/deceleration
function smootherstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function updateCamera(camera, frame) {
  const targetPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();

  // Eye World Target Coordinates: [0.38, 0.34, 0.0]
  const eyeX = 0.38;
  const eyeY = 0.34;

  if (frame <= 24) {
    // Phase 1: Framed Avatar View
    targetPos.set(0, 0, 5.20);
    targetLook.set(0, 0, 0);
  } else if (frame <= 55) {
    // Phase 2: Ring Detachment (Subtle Pullback for 3D Perspective Depth)
    const t = smoothstep(24, 55, frame);
    targetPos.set(0, 0, 5.20 + Math.sin(t * Math.PI) * 0.25);
    targetLook.set(0, 0, 0);
  } else if (frame <= 115) {
    // Phase 3: Face Dolly-In (Forward Travel & Lateral Eye Steering)
    const t = smootherstep(55, 115, frame);
    targetPos.x = THREE.MathUtils.lerp(0.0, eyeX * 0.45, t);
    targetPos.y = THREE.MathUtils.lerp(0.0, eyeY * 0.55, t);
    targetPos.z = THREE.MathUtils.lerp(5.20, 3.40, t);

    targetLook.x = THREE.MathUtils.lerp(0.0, eyeX * 0.5, t);
    targetLook.y = THREE.MathUtils.lerp(0.0, eyeY * 0.5, t);
    targetLook.z = 0;
  } else if (frame <= 170) {
    // Phase 4: Eye Targeting (Closing in on Pupil Target)
    const t = smootherstep(115, 170, frame);
    targetPos.x = THREE.MathUtils.lerp(eyeX * 0.45, eyeX, t);
    targetPos.y = THREE.MathUtils.lerp(eyeY * 0.55, eyeY, t);
    targetPos.z = THREE.MathUtils.lerp(3.40, 1.55, t);

    targetLook.x = eyeX;
    targetLook.y = eyeY;
    targetLook.z = 0;
  } else {
    // Phase 5: Macro Iris & Pupil Penetration Dive
    const t = smootherstep(170, 250, frame);
    targetPos.x = eyeX;
    targetPos.y = eyeY;
    targetPos.z = THREE.MathUtils.lerp(1.55, 0.52, t);

    targetLook.x = eyeX;
    targetLook.y = eyeY;
    targetLook.z = 0;
  }

  // Apply positions with immediate tracking
  camera.position.copy(targetPos);
  camera.lookAt(targetLook);
}
