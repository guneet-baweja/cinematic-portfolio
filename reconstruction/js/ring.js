import * as THREE from "three";

/**
 * ring.js — 3D Detached Orbital Blue Ring
 * Matches Frames 001 to 055 where circular avatar border rotates in 3D perspective.
 */
export function createRing(scene) {
  // Torus geometry: radius 1.95, tube 0.038
  const geometry = new THREE.TorusGeometry(1.95, 0.038, 24, 96);

  const material = new THREE.MeshStandardMaterial({
    color: "#2563EB",
    emissive: "#3B82F6",
    emissiveIntensity: 2.5,
    roughness: 0.15,
    metalness: 0.8,
    transparent: true,
    opacity: 1.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0.05);
  scene.add(mesh);

  return { mesh, material };
}

export function updateRing(ring, frame) {
  const { mesh, material } = ring;

  if (frame < 25) {
    // Phase 1: Static circular avatar border
    mesh.visible = true;
    mesh.position.set(0, 0, 0.05);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    material.opacity = 1.0;
  } else if (frame <= 55) {
    // Phase 2: 3D Ring Detachment & Orbital Tilt
    const t = (frame - 25) / 30; // 0.0 to 1.0
    mesh.visible = true;

    // Smooth cubic easing for rotation
    const ease = t * t * (3 - 2 * t);

    // Detach forward in Z and shift slightly right
    mesh.position.z = 0.05 + ease * 0.45;
    mesh.position.x = ease * 0.38;

    // 3D Rotation: Yaw (Y-axis) up to 68 deg, Pitch (X-axis) up to 18 deg
    mesh.rotation.y = ease * 1.18; // ~68 degrees
    mesh.rotation.x = ease * 0.32; // ~18 degrees

    // Fade out as it spins into the void (frames 42 to 55)
    if (frame > 42) {
      const fadeT = 1.0 - (frame - 42) / 13;
      material.opacity = Math.max(0, fadeT);
    } else {
      material.opacity = 1.0;
    }
  } else {
    // Phase 3+: Completely dissolved
    mesh.visible = false;
  }
}
