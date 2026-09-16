import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

/**
 * DistortionMaterial
 * -------------------
 * Displaces a textured plane's UVs with a soft wave driven by scroll
 * velocity and pointer position. Subtle by design — this should read
 * as a premium parallax, not a WebGL demo.
 */
export const DistortionMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uVelocity: 0,
    uPointer: new THREE.Vector2(0, 0),
    uTime: 0,
  },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform sampler2D uTexture;
    uniform float uVelocity;
    uniform vec2 uPointer;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      float dist = distance(uv, uPointer * 0.5 + 0.5);
      float pointerWave = sin(dist * 18.0 - uTime * 1.2) * 0.004 * smoothstep(0.5, 0.0, dist);

      float scrollWave = sin(uv.y * 6.0 + uTime * 0.3) * uVelocity * 0.02;

      uv.x += pointerWave + scrollWave;
      uv.y += pointerWave * 0.6;

      vec3 color = texture2D(uTexture, uv).rgb;
      gl_FragColor = vec4(color, 1.0);
    }
  `
);
