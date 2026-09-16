import * as THREE from "three";

/**
 * scene.js — Three.js Scene & Renderer Initialization
 */
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000000");

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  return { scene, renderer };
}
