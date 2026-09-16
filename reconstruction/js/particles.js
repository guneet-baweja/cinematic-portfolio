import * as THREE from "three";

/**
 * particles.js — 3D Floating Dust & Bokeh Particles with Parallax
 */

/**
 * Procedurally generates a smooth radial circular bokeh texture
 */
function createBokehTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.35, "rgba(255, 220, 180, 0.75)");
  gradient.addColorStop(0.7, "rgba(200, 220, 255, 0.25)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createParticles(scene) {
  const count = 220;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const basePositions = [];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 8.0;
    const y = (Math.random() - 0.5) * 7.0;
    const z = (Math.random() - 0.5) * 6.0 + 1.0;

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    basePositions.push({
      x,
      y,
      z,
      speedX: (Math.random() - 0.5) * 0.08,
      speedY: Math.random() * 0.06 + 0.02,
      phase: Math.random() * Math.PI * 2,
    });

    scales[i] = Math.random() * 0.07 + 0.03;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    map: createBokehTexture(),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Diamond Sparkle Icon at bottom right of avatar
  const sparkleShape = new THREE.Shape();
  sparkleShape.moveTo(0, 0.12);
  sparkleShape.lineTo(0.04, 0.04);
  sparkleShape.lineTo(0.12, 0);
  sparkleShape.lineTo(0.04, -0.04);
  sparkleShape.lineTo(0, -0.12);
  sparkleShape.lineTo(-0.04, -0.04);
  sparkleShape.lineTo(-0.12, 0);
  sparkleShape.lineTo(-0.04, 0.04);
  sparkleShape.closePath();

  const sparkleGeom = new THREE.ShapeGeometry(sparkleShape);
  const sparkleMat = new THREE.MeshBasicMaterial({
    color: "#8BB5FF",
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const sparkleMesh = new THREE.Mesh(sparkleGeom, sparkleMat);
  sparkleMesh.position.set(1.4, -0.6, 0.2);
  scene.add(sparkleMesh);

  return {
    points,
    basePositions,
    sparkle: sparkleMesh,
  };
}

export function updateParticles(particleSystem, frame, elapsedTime) {
  const { points, basePositions, sparkle } = particleSystem;
  const posAttr = points.geometry.attributes.position;
  const count = basePositions.length;

  for (let i = 0; i < count; i++) {
    const bp = basePositions[i];
    const driftY = Math.sin(elapsedTime * 0.8 + bp.phase) * 0.15;
    const driftX = Math.cos(elapsedTime * 0.6 + bp.phase) * 0.12;

    posAttr.setXYZ(i, bp.x + driftX, bp.y + driftY, bp.z);
  }
  posAttr.needsUpdate = true;

  // Diamond sparkle fades as ring detaches (f = 25 -> 50)
  if (sparkle) {
    if (frame < 25) {
      sparkle.material.opacity = 0.6 + Math.sin(elapsedTime * 4) * 0.2;
      sparkle.visible = true;
    } else if (frame < 50) {
      const t = 1 - (frame - 25) / 25;
      sparkle.material.opacity = t * 0.6;
      sparkle.visible = true;
    } else {
      sparkle.visible = false;
    }
  }
}
