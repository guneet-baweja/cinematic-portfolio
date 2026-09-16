---
name: postprocessing
description: Cinematic screen-space postprocessing and visual effects with `@react-three/postprocessing` and `postprocessing`. Use when implementing Bloom, ChromaticAberration, Vignette, Noise, DepthOfField, ToneMapping, and custom pass orchestration.
---

# Postprocessing Visual Effects

Screen-space effects elevate a standard 3D scene into a cinematic production.

## `@react-three/postprocessing` Setup

```tsx
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export function CinematicEffects() {
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      {/* 1. Selective Glow */}
      <Bloom
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        intensity={1.2}
        mipmapBlur
      />

      {/* 2. Lens Distortion */}
      <ChromaticAberration
        offset={new THREE.Vector2(0.0015, 0.0015)}
        radialModulation={true}
        modulationOffset={0.5}
      />

      {/* 3. Film Grain / Texture */}
      <Noise
        opacity={0.04}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* 4. Focus / Vignette */}
      <Vignette
        eskil={false}
        offset={0.2}
        darkness={1.1}
      />
    </EffectComposer>
  );
}
```

## Performance & Quality Guidelines
1. **Multisampling**: Set `multisampling={0}` on `EffectComposer` when using `Bloom` with `mipmapBlur` to significantly reduce GPU load.
2. **Normal Pass**: If no SSAO or DepthOfField is used, pass `disableNormalPass` to skip the extra G-Buffer render pass.
3. **Subtlety**: Cinematic postprocessing should feel atmospheric, not overwhelming. Keep noise opacity low (< 0.05) and chromatic aberration subtle (< 0.002).
4. **Mobile Fallback**: Disable expensive passes (e.g. DepthOfField or heavy Bloom) on low-power mobile devices.
