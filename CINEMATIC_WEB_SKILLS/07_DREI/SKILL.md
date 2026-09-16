---
name: drei
description: Comprehensive `@react-three/drei` helpers, controls, materials, and staging utilities. Use when integrating OrbitControls, Float, Environment, Html, ScrollControls, MeshTransmissionMaterial, shaderMaterial, or useGLTF in React Three Fiber.
---

# Drei Component & Helper Suite

`@react-three/drei` provides battle-tested abstractions and visual helpers for React Three Fiber.

## Essential Components

### 1. Model Loading (`useGLTF`)
```tsx
import { useGLTF } from '@react-three/drei';

export function Model() {
  const { scene } = useGLTF('/models/portfolio-piece.glb');
  return <primitive object={scene} scale={1.5} />;
}

useGLTF.preload('/models/portfolio-piece.glb');
```

### 2. Environment & Lighting
```tsx
import { Environment, Lightformer } from '@react-three/drei';

export function StudioLighting() {
  return (
    <Environment preset="city">
      <Lightformer form="rect" intensity={2} position={[2, 5, -2]} scale={5} color="#ffffff" />
    </Environment>
  );
}
```

### 3. Ambient Motion (`Float` & `PresentationControls`)
```tsx
import { Float, PresentationControls } from '@react-three/drei';

export function FloatingHeroPiece() {
  return (
    <PresentationControls global polar={[-0.2, 0.2]} azimuth={[-0.4, 0.4]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Model />
      </Float>
    </PresentationControls>
  );
}
```

### 4. Custom Shader Material Helper (`shaderMaterial`)
```tsx
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

export const WaveShaderMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(0.2, 0.4, 0.8) },
  // Vertex Shader
  `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 4.0 + uTime) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform vec3 uColor;
    void main() {
      gl_FragColor = vec4(uColor * vUv.y, 1.0);
    }
  `
);

extend({ WaveShaderMaterial });
```

## Best Practices
- Prefer Drei's `Environment` over multiple heavy directional lights for realistic PBR reflections.
- Use `useGLTF.preload()` outside the component to avoid hitching on mount.
- For glass/liquid effects, use `MeshTransmissionMaterial` with optimized `samples` (keep samples ≤ 6 for performance).
