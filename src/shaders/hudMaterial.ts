import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

/**
 * HudMaterial
 * -----------
 * A flat neon-orange material with a slow scan pulse — reads as an
 * illuminated instrument panel rather than a lit 3D object. Bloom in
 * SceneCanvas turns this into the glow.
 */
export const HudMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#FF5F1F"),
    uOpacity: 0.9,
  },
  /* vertex */ `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;

    void main() {
      float pulse = 0.85 + 0.15 * sin(uTime * 2.2);
      gl_FragColor = vec4(uColor * pulse, uOpacity);
    }
  `
);
