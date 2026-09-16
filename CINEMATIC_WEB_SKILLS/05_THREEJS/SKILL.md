---
name: threejs
description: Core Three.js architecture and WebGL rendering mastery. Use when configuring 3D scenes, cameras, lighting, materials, textures, geometry optimization, GLTF/GLB loading, animation mixers, raycasting, and rendering performance budgets.
---

# Three.js 3D WebGL Architecture

Three.js is the foundational 3D library powering immersive web experiences.

## Core Scene Structure

```typescript
import * as THREE from 'three';

// 1. Scene
const scene = new THREE.Scene();

// 2. Camera with cinematic FOV
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// 3. Renderer with optimal performance settings
const renderer = new THREE.WebGLRenderer({
  antialias: window.devicePixelRatio < 2, // Only antialias on low-DPI displays to save fill-rate
  powerPreference: 'high-performance',
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio to 2
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

## GLTF/GLB Loading with DRACO Compression

```typescript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/models/hero.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);
});
```

## Performance Budgets & Optimization
1. **Draw Calls**: Keep total draw calls below 50 per frame for smooth 60fps on mobile. Use `InstancedMesh` for repeated objects.
2. **Polycount**: Target < 100k polygons total for web scenes.
3. **Texture Compression**: Use KTX2 / Basis or compressed WebP textures. Keep textures ≤ 2048x2048.
4. **Disposal / Memory Cleanup**: When unmounting or switching scenes, traverse and dispose geometries, materials, and textures:
   ```typescript
   scene.traverse((obj) => {
     if ((obj as THREE.Mesh).isMesh) {
       const mesh = obj as THREE.Mesh;
       mesh.geometry.dispose();
       if (Array.isArray(mesh.material)) {
         mesh.material.forEach((m) => m.dispose());
       } else if (mesh.material) {
         mesh.material.dispose();
       }
     }
   });
   renderer.dispose();
   ```
