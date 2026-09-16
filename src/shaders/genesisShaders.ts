import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

/**
 * 2.5D Portrait Parallax Material
 * Displaces mesh geometry along normal based on grayscale depth map.
 * Injects warm Fresnel rim-lighting (#FF5F1F) along the silhouette edges.
 */
export const Portrait25DMaterial = shaderMaterial(
  {
    uTexture: null as THREE.Texture | null,
    uDepthMap: null as THREE.Texture | null,
    uDisplacementScale: 0.38,
    uPointer: new THREE.Vector2(0, 0),
    uEyeZoom: 0.0, // 0 = normal, 1 = focused into right eye
    uEyeTarget: new THREE.Vector2(0.53, 0.58), // UV of eye
    uRimColor: new THREE.Color("#FF5F1F"),
    uRimIntensity: 1.2,
    uOpacity: 1.0,
    uTime: 0.0,
  },
  // Vertex Shader
  /* glsl */ `
    uniform sampler2D uDepthMap;
    uniform float uDisplacementScale;
    uniform vec2 uPointer;
    uniform float uEyeZoom;
    uniform vec2 uEyeTarget;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vDepth;

    void main() {
      vUv = uv;

      // Sample depth map (0.0 = void, 1.0 = tip of nose / forward relief)
      float depth = texture2D(uDepthMap, uv).r;
      vDepth = depth;

      vec3 transformed = position;

      // Parallax vertex displacement along normal
      transformed.z += depth * uDisplacementScale;

      // Subtle dynamic head tilt tied to mouse pointer
      float tiltFactor = depth * 0.15;
      transformed.x += uPointer.x * tiltFactor;
      transformed.y += uPointer.y * tiltFactor;

      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform sampler2D uTexture;
    uniform vec3 uRimColor;
    uniform float uRimIntensity;
    uniform float uOpacity;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vDepth;

    void main() {
      vec4 texColor = texture2D(uTexture, vUv);

      // Discard background pixels
      if (texColor.a < 0.05) {
        discard;
      }

      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);

      // Organic Fresnel rim calculation
      float fresnel = 1.0 - max(0.0, dot(viewDir, normal));
      fresnel = pow(fresnel, 2.5) * uRimIntensity;

      // Gentle breathing shimmer along the rim
      float shimmer = 1.0 + 0.15 * sin(uTime * 2.5);

      // Composite color: Base photo texture + warm orange rim
      vec3 finalRgb = texColor.rgb + (uRimColor * fresnel * shimmer * texColor.a);

      gl_FragColor = vec4(finalRgb, texColor.a * uOpacity);
    }
  `
);

/**
 * GLSL Iris Aperture Wipe Shader
 * Radial polygonal aperture (8 blades) opening from eye into the void.
 */
export const IrisApertureMaterial = shaderMaterial(
  {
    uProgress: 0.0, // 0 = closed, 1 = fully open
    uCenter: new THREE.Vector2(0.5, 0.5),
    uColor: new THREE.Color("#050608"),
    uRimColor: new THREE.Color("#FF5F1F"),
    uAspect: 1.0,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uProgress;
    uniform vec2 uCenter;
    uniform vec3 uColor;
    uniform vec3 uRimColor;
    uniform float uAspect;
    varying vec2 vUv;

    #define PI 3.14159265359

    void main() {
      vec2 st = vUv - uCenter;
      st.x *= uAspect;

      float dist = length(st);
      float angle = atan(st.y, st.x);

      // 8-bladed camera diaphragm geometry
      float blades = 8.0;
      float r = cos(PI / blades) / cos(mod(angle + PI / blades, 2.0 * PI / blades) - PI / blades);
      float apertureRadius = uProgress * 1.5;
      float border = apertureRadius * r;

      if (dist < border) {
        // Inside open aperture (reveals void / next beat)
        float edgeDist = abs(dist - border);
        float edgeGlow = smoothstep(0.06, 0.0, edgeDist);
        gl_FragColor = vec4(uRimColor * edgeGlow * 1.8, edgeGlow * 0.9);
      } else {
        // Outside aperture: opaque dark transition curtain
        float edgeDist = dist - border;
        float edgeGlow = smoothstep(0.04, 0.0, edgeDist);
        vec3 col = mix(uColor, uRimColor, edgeGlow * 0.7);
        gl_FragColor = vec4(col, 1.0);
      }
    }
  `
);

/**
 * Neural Synapse Pulse Shader
 * Electric energy traveling along curved nerve tubes.
 */
export const SynapseMaterial = shaderMaterial(
  {
    uTime: 0.0,
    uColor: new THREE.Color("#FF5F1F"),
    uCoreColor: new THREE.Color("#FFFFFF"),
    uProgress: 0.0,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform float uProgress;
    uniform vec3 uColor;
    uniform vec3 uCoreColor;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // Flow along curve length (vUv.x)
      float flow = fract(vUv.x * 3.0 - uTime * 2.0);
      float pulse = smoothstep(0.15, 0.0, abs(flow - 0.5));

      // Scroll-driven lead pulse
      float scrubPulse = smoothstep(0.08, 0.0, abs(vUv.x - uProgress));

      float intensity = pulse * 0.5 + scrubPulse * 1.5;
      vec3 col = mix(uColor, uCoreColor, intensity * 0.6);

      float alpha = clamp(intensity + 0.15, 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `
);

/**
 * Bloodstream Conduit Shader
 * Warm red/orange cellular tunnel atmosphere with depth attenuation.
 */
export const BloodstreamMaterial = shaderMaterial(
  {
    uTime: 0.0,
    uVelocity: 0.0,
    uColor1: new THREE.Color("#3a0606"),
    uColor2: new THREE.Color("#FF4500"),
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform float uVelocity;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      float wave = sin(vUv.x * 20.0 + uTime * 3.0) * cos(vUv.y * 15.0 + uTime * 2.0);
      float depthFade = smoothstep(-15.0, 5.0, vPosition.z);

      vec3 col = mix(uColor1, uColor2, wave * 0.35 + 0.35);
      float alpha = (0.25 + 0.2 * wave) * depthFade;

      gl_FragColor = vec4(col, alpha);
    }
  `
);

