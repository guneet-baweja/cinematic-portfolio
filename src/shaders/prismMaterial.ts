import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

/**
 * PrismMaterial
 * -------------
 * GPU-accelerated optical glass shader implementing:
 * - Cauchy chromatic dispersion (R/G/B differential refraction)
 * - Fresnel edge glow and internal total reflection
 * - Dynamic velocity-driven contrast and chromatic aberration
 * - Mouse-driven refraction vectors
 */
export const PrismMaterial = shaderMaterial(
  {
    uTime: 0,
    uVelocity: 0,
    uProgress: 0,
    uMouse: new THREE.Vector2(0, 0),
    uDispersion: 0.8,
    uColor: new THREE.Color("#FF5F1F"),
    uTransmission: 0.95,
  },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* fragment */ `
    uniform float uTime;
    uniform float uVelocity;
    uniform float uProgress;
    uniform vec2 uMouse;
    uniform float uDispersion;
    uniform vec3 uColor;
    uniform float uTransmission;

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel rim reflection
      float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.2);

      // Velocity-dependent chromatic shift
      float velFactor = clamp(abs(uVelocity) * 2.5, 0.0, 3.0);
      float dispersion = (uDispersion + velFactor * 0.6);

      // Refraction angles for R, G, B channels (Cauchy dispersion)
      vec3 lightAngle = normalize(vec3(uMouse.x * 1.5, uMouse.y * 1.5, 1.2));
      vec3 rRefract = refract(-viewDir, normal, 1.0 / (1.50 + dispersion * 0.05));
      vec3 gRefract = refract(-viewDir, normal, 1.0 / 1.52);
      vec3 bRefract = refract(-viewDir, normal, 1.0 / (1.54 - dispersion * 0.05));

      // Specular glare
      float spec = pow(max(0.0, dot(reflect(-lightAngle, normal), viewDir)), 32.0);

      // Spectral prism splitting
      float r = clamp(dot(rRefract, lightAngle) * 0.5 + 0.5, 0.0, 1.0);
      float g = clamp(dot(gRefract, lightAngle) * 0.5 + 0.5, 0.0, 1.0);
      float b = clamp(dot(bRefract, lightAngle) * 0.5 + 0.5, 0.0, 1.0);

      // Internal caustic pulses
      float caustic = sin(vWorldPosition.x * 6.0 + uTime * 2.0) *
                      cos(vWorldPosition.y * 6.0 - uTime * 1.5) * 0.5 + 0.5;

      vec3 spectralColor = vec3(
        pow(r, 2.2) * 1.4 + caustic * 0.2,
        pow(g, 2.4) * 1.1 + caustic * 0.1,
        pow(b, 2.0) * 1.8 + caustic * 0.3
      );

      // Accent tone injection (#FF5F1F neon orange)
      vec3 finalColor = mix(spectralColor, uColor, fresnel * 0.65);
      finalColor += vec3(spec * 1.5);
      finalColor += fresnel * uColor * 0.8;

      float alpha = clamp(fresnel * 0.7 + (1.0 - uTransmission) + spec * 0.5 + velFactor * 0.1, 0.15, 0.95);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);
