---
name: shaders-glsl
description: High-performance GLSL vertex and fragment shaders for web experiences. Use when implementing image distortion, liquid ripple, simplex/perlin noise, wave vertex displacement, RGB chromatic split, interactive mouse ripples, and custom WebGL materials.
---

# GLSL Shaders & Procedural Effects

Custom shaders run directly on the GPU, allowing millions of mathematical operations per frame for liquid, organic, and dynamic visuals.

## Shader Pipeline Fundamentals
- **Vertex Shader**: Computes vertex positions in clip space (`gl_Position`), applies wave/displacement transforms.
- **Fragment Shader**: Computes per-pixel color (`gl_FragColor`), processes UV coordinates, textures, and noise.
- **Uniforms**: Read-only variables passed from JavaScript/React into shaders (`uTime`, `uMouse`, `uResolution`, `uVelocity`).
- **Varyings**: Variables computed in the vertex shader and interpolated across fragments (`vUv`, `vNormal`).

## Production Shader Pattern: Interactive Liquid Distortion

### 1. Vertex Shader (`distortion.vert`)
```glsl
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform float uDistortion;

void main() {
  vUv = uv;
  vPosition = position;

  vec3 pos = position;
  // Dynamic wave distortion based on sine waves
  pos.z += sin(pos.x * 3.0 + uTime) * cos(pos.y * 3.0 + uTime) * uDistortion;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### 2. Fragment Shader with RGB Split (`distortion.frag`)
```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uMouse;
uniform float uAberration;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Offset UVs for chromatic aberration
  vec2 offset = (uv - 0.5) * uAberration;
  float r = texture2D(uTexture, uv + offset).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - offset).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
```

## Connecting GSAP & Lenis to Shader Uniforms

```typescript
// Drive shader distortion from Lenis scroll velocity
lenis.on('scroll', ({ velocity }) => {
  gsap.to(materialRef.current.uniforms.uDistortion, {
    value: Math.min(Math.abs(velocity) * 0.02, 0.4),
    duration: 0.3,
    ease: 'power2.out',
  });
});
```

## Optimization Rules
1. Never recalculate constants inside the fragment loop; pre-calculate uniforms in JavaScript.
2. Avoid branching (`if / else`) in inner fragment calculations; use `step()`, `smoothstep()`, and `mix()` instead.
3. Match precision appropriately: use `precision highp float;` for UV coordinates and vertex math, `mediump` for basic color math.
