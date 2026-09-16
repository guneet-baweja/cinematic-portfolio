---
name: react-three-fiber
description: React Three Fiber (R3F) declarative 3D canvas and lifecycle management. Use when developing React-based 3D applications, Canvas setup, useFrame render loops, useThree state, Suspense boundaries, and React 19 compatibility.
---

# React Three Fiber (R3F)

React Three Fiber translates Three.js imperativeness into declarative, high-performance React components.

## Canvas Setup & Performance Configuration

```tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';

export function SceneCanvas({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      gl={{
        antialias: window.devicePixelRatio < 2,
        toneMapping: THREE.ACESFilmicToneMapping,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]} // Cap DPI between 1 and 2
      camera={{ position: [0, 0, 5], fov: 45 }}
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
}
```

## `useFrame` Hook: The Render Loop

Never update React state inside `useFrame` (this would trigger React re-renders at 60fps). Instead, mutate Three.js objects directly via ref:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RotatingMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    // Correct: Mutate directly with delta for framerate-independent speed
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
    </mesh>
  );
}
```

## State & Viewport Access (`useThree`)

```tsx
import { useThree } from '@react-three/fiber';

export function ResponsiveCamera() {
  const { viewport, size } = useThree();
  const isMobile = size.width < 768;

  // Adapt 3D layout to screen proportions
  return (
    <mesh scale={isMobile ? 0.7 : 1}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial wireframe />
    </mesh>
  );
}
```

## Best Practices
1. **Never use React `useState` in 60fps animation loops**: Use mutable refs or GSAP.
2. **Preload assets**: Use `useGLTF.preload('/model.glb')` to avoid layout shifts.
3. **Suspense boundaries**: Always wrap 3D asset loaders in `<Suspense fallback={...}>`.
