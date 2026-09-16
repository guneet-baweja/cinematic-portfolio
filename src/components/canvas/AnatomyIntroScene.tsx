import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Text3D, Center, useFont, Environment } from "@react-three/drei";
import { EffectComposer, DepthOfField, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { ScrollTrigger, useGSAP } from "../../lib/gsap";
import { getLenis, getGenesisHeight, getIsGenesisActive, addFrameListener, removeFrameListener } from "../../lib/lenis";
import { getMonolithBloodTextures, type LineBloodTextures, type MonolithBloodTextures } from "./bloodSplatterTexture";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LuxuryTimepieceDive } from "./LuxuryTimepieceDive";
import "./AnatomyIntroScene.css";

// Preload official high-res software logos for the bloodstream gallery
useTexture.preload([
  "/images/logos/premiere.png",
  "/images/logos/davinci.png",
  "/images/logos/blender.png",
  "/images/logos/houdini.png",
  "/images/logos/aftereffects.png",
]);

// Preload 3D font so Text3D never causes a network fetch or parse freeze mid-scroll
useFont.preload("/fonts/bold.json");

// ============================================================================
// EXACT EYE TARGET COORDINATES (Calibrated from Reference Video Frames)
// ============================================================================
const EYE_TARGET = {
  x: 0.067,
  y: 0.527,
};

// ============================================================================
// PHASE 4: THE EXTENDED BIOLOGICAL NEURAL NERVE SPLINE (BRAIN TO HEART)
// Deep 3D S-curve spiral nerve tract from the brainstem medulla oblongata down
// into the cardiac plexus and myocardial heart cavern.
// ============================================================================
const CORKSCREW_SPLINE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y, -16.50),   // 1. Brainstem medulla cleft base
    new THREE.Vector3(1.750, -1.800, -17.80),  // 2. Cervical nerve trunk banking right
    new THREE.Vector3(2.400, -5.200, -19.50),  // 3. Thoracic sympathetic trunk lateral sweep
    new THREE.Vector3(1.100, -8.800, -21.80),  // 4. Inward spiral crossing central spinal axis
    new THREE.Vector3(-1.650, -11.80, -23.80), // 5. S-curve sweeping lateral left loop
    new THREE.Vector3(-1.800, -14.20, -26.20), // 6. Vagal cardiac descent
    new THREE.Vector3(-0.450, -15.60, -28.00), // 7. Curving toward cardiac gateway
    new THREE.Vector3(0.065, -16.00, -29.50),  // 8. Terminal cardiac plexus on anterior heart
  ],
  false,
  "catmullrom",
  0.5
);

// ============================================================================
// CONTINUOUS 3D CAMERA TRAJECTORY (EYE -> BRAIN -> CORKSCREW DIVE -> HEART -> BLOODSTREAM)
// Strict monotonic C^1 smoothstep interpolation across all 3 spatial axes + lookAt + FOV.
// Zero acceleration spikes, zero stops, continuous cinematic narrative flight.
// ============================================================================
interface CameraPoseKey {
  p: number;
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
}

export interface CameraPose {
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
}

const CAMERA_KEYS: CameraPoseKey[] = [
  // 1. Initial State: Resting portrait (calibrated distance Z=4.35 fills full screen cleanly)
  { p: 0.000, x: 0.000, y: 0.000,  z: 4.35,   lookX: 0.000, lookY: 0.000,  lookZ: -8.0,  fov: 45 },
  // 1b. Resting Hold: Entire portrait remains completely visible and still before beginning zoom on scroll
  { p: 0.035, x: 0.000, y: 0.000,  z: 4.35,   lookX: 0.000, lookY: 0.000,  lookZ: -8.0,  fov: 45 },
  // 2a. Professional Cine Track: Initial smooth push & graceful pan toward the Left Eye
  { p: 0.070, x: 0.032, y: 0.260,  z: 2.65,   lookX: 0.045, lookY: 0.360,  lookZ: -8.5,  fov: 45 },
  // 2b. Professional Cine Track: Optical centering, locking onto the Left Eye iris
  { p: 0.105, x: 0.058, y: 0.460,  z: 1.35,   lookX: 0.067, lookY: 0.527,  lookZ: -9.0,  fov: 45 },
  // 2c. Professional Macro Lock: Extreme macro close-up, dead-center on Left Eye pupil
  { p: 0.135, x: 0.067, y: 0.527,  z: 0.45,   lookX: 0.067, lookY: 0.527,  lookZ: -10.0, fov: 45 },
  // 3. Inside 3D Iris tunnel, pupil breach into void (Brain already visible at Z = -12.0 in background)
  { p: 0.180, x: 0.067, y: 0.527,  z: -3.80,  lookX: 0.067, lookY: 0.527,  lookZ: -12.0, fov: 45 },
  // 4. Entering neural pathway, converging towards brain cleft
  { p: 0.220, x: 0.067, y: 0.527,  z: -7.50,  lookX: 0.067, lookY: 0.527,  lookZ: -14.0, fov: 50 },
  // 5. Anti-lag Brain Canyon: Gliding through the sagittal cleft between hemispheres (Left & Right flanking)
  { p: 0.260, x: 0.152, y: 0.537,  z: -10.50, lookX: 0.067, lookY: 0.527,  lookZ: -15.5, fov: 58 },
  // 6. Cruising between hemispheres: "THE ARCHITECTURE OF AN EDIT."
  { p: 0.300, x: 0.022, y: 0.522,  z: -13.50, lookX: 0.067, lookY: 0.527,  lookZ: -17.5, fov: 58 },
  // 7. Base of brainstem: approaching biological nerve conduit entrance
  { p: 0.340, x: 0.067, y: 0.527,  z: -16.50, lookX: 0.067, lookY: 0.527,  lookZ: -19.5, fov: 54 },

  // Phase 4: Extended Biological Nerve Pipeline (p: 0.34 -> 0.52) evaluated via CORKSCREW_SPLINE!

  // 8. Exiting neural nerve plexus, arriving at dark heart cavern (Heart beating directly ahead at Z: -34)
  { p: 0.52, x: 0.065, y: -16.00, z: -29.50, lookX: 0.065, lookY: -16.00, lookZ: -34.0, fov: 50 },
  // 9. Smooth Heart Approach: Beating heart looms massive ahead ("EVERY CUT IS MADE WITH HEART.")
  { p: 0.55, x: 0.150, y: -16.00, z: -32.00, lookX: 0.065, lookY: -16.00, lookZ: -35.0, fov: 48 },
  // 10. Smooth Heart Skirt: Orbiting past lateral heart ventricle & ascending aorta
  { p: 0.58, x: 0.220, y: -16.00, z: -35.00, lookX: 0.100, lookY: -16.00, lookZ: -39.0, fov: 46 },
  // 11. Gliding through aortic root / valve exit into bloodstream corridor
  { p: 0.61, x: 0.050, y: -16.00, z: -38.50, lookX: 0.000, lookY: -16.00, lookZ: -43.0, fov: 45 },
  // 12. Bloodstream Gallery - Encounter 1: PREMIERE PRO (Z: -43.0)
  { p: 0.65, x: 0.000, y: -16.00, z: -43.00, lookX: 0.000, lookY: -16.00, lookZ: -49.0, fov: 45 },
  // 13. Bloodstream Gallery - Encounter 2: DAVINCI RESOLVE (Z: -49.0)
  { p: 0.69, x: 0.000, y: -16.00, z: -49.00, lookX: 0.000, lookY: -16.00, lookZ: -55.0, fov: 45 },
  // 14. Bloodstream Gallery - Encounter 3: BLENDER 3D (Z: -55.0)
  { p: 0.73, x: 0.000, y: -16.00, z: -55.00, lookX: 0.000, lookY: -16.00, lookZ: -61.0, fov: 45 },
  // 15. Bloodstream Gallery - Encounter 4: HOUDINI FX (Z: -61.0)
  { p: 0.77, x: 0.000, y: -16.00, z: -61.00, lookX: 0.000, lookY: -16.00, lookZ: -67.0, fov: 45 },
  // 16. Encounter 5: AFTER EFFECTS CLIMAX BADGE (Z: -67.0) (Monolith text towering ahead in distance at Z: -80)
  { p: 0.8100, x: 0.000, y: -16.00, z: -67.00, lookX: 0.050, lookY: -16.00, lookZ: -80.0, fov: 45 },
  // 17. The Monolith Corridor: Gliding towards "AFTER EFFECTS IS IN MY BLOOD." (Gradual distance approach)
  { p: 0.8500, x: 0.120, y: -16.00, z: -74.00, lookX: 0.150, lookY: -16.00, lookZ: -80.0, fov: 45 },
  // 18. The Monolith Corridor: Text looms massive ahead in arterial space
  { p: 0.8750, x: 0.200, y: -16.00, z: -78.00, lookX: 0.220, lookY: -16.00, lookZ: -80.0, fov: 45 },
  // 19. The Monolith Fly-Through: Passing between colossal letters (Watch dial resolving in distance at Z: -94)
  { p: 0.8929, x: 0.265, y: -16.00, z: -81.50, lookX: 0.265, lookY: -16.00, lookZ: -94.0, fov: 45 },
  // 20. STAGE 1: Gliding towards Luxury Watch Exterior Dial (Z: -94)
  { p: 0.9154, x: 0.265, y: -16.00, z: -88.00, lookX: 0.265, lookY: -16.00, lookZ: -94.0, fov: 45 },
  // 21. STAGE 1: Phasing through Sapphire Glass & entering skeleton aperture (Z: -94 to -95)
  { p: 0.9389, x: 0.265, y: -16.00, z: -94.80, lookX: 0.265, lookY: -16.00, lookZ: -100.0, fov: 45 },
  // 22. STAGE 2: Diving between Interlocking Gears (Z: -97 to -103)
  { p: 0.9585, x: 0.265, y: -16.00, z: -100.50, lookX: 0.265, lookY: -16.00, lookZ: -106.0, fov: 45 },
  // 23. STAGE 2: Diving through Tourbillon Aperture (Z: -105.5) - clearing mechanics completely
  { p: 0.9769, x: 0.265, y: -16.00, z: -105.80, lookX: 0.265, lookY: -16.00, lookZ: -112.5, fov: 45 },
  // 24. STAGE 4: Grand Climax Typography Sanctuary - "ALWAYS DELIVER ON TIME." (Z: -112.5)
  { p: 0.9862, x: 0.265, y: -16.00, z: -108.50, lookX: 0.265, lookY: -16.00, lookZ: -112.5, fov: 45 },
  // 25. STAGE 4: Gliding right up to Typography, flying through letters into Act 01 handoff
  { p: 1.0000, x: 0.265, y: -16.00, z: -112.50, lookX: 0.265, lookY: -16.00, lookZ: -116.0, fov: 45 },
];

function evalCameraPose(p: number): CameraPose {
  const clamped = Math.max(0, Math.min(1, p));

  // ============================================================================
  // PHASE 4 EXTENDED BIOLOGICAL NERVE DIVE (BRAIN TO HEART TRANSITION: p in [0.34, 0.52])
  // Sweeping 3D S-curve spiral descent through the biological neural nerve tract
  // ============================================================================
  if (clamped >= 0.34 && clamped <= 0.52) {
    const t = (clamped - 0.34) / (0.52 - 0.34);
    // Smooth cubic Hermite interpolation
    const ease = t * t * (3.0 - 2.0 * t);
    const pos = CORKSCREW_SPLINE.getPointAt(ease);

    const tLead = Math.min(1.0, ease + 0.06);
    const leadPos = CORKSCREW_SPLINE.getPointAt(tLead);
    const tangent = CORKSCREW_SPLINE.getTangentAt(ease);

    // Initial brain cleft look target (looking ahead down Z)
    const initLook = new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y, -20.0);
    // Cavern look target (looking toward colossal beating heart at Z: -34)
    const cavernLook = new THREE.Vector3(0.065, -16.0, -34.0);

    let splineLook = leadPos.clone().add(tangent.clone().multiplyScalar(4.0));
    if (ease < 0.20) {
      const b = ease / 0.20;
      const smoothB = b * b * (3.0 - 2.0 * b);
      splineLook = initLook.clone().lerp(splineLook, smoothB);
    }
    const finalLook = splineLook.lerp(cavernLook, Math.pow(ease, 2.0));
    const fov = THREE.MathUtils.lerp(54, 50, ease);

    return {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      lookX: finalLook.x,
      lookY: finalLook.y,
      lookZ: finalLook.z,
      fov,
    };
  }

  // ============================================================================
  // UNIFORM 120 FPS ARTERIAL & WATCH CORRIDOR (p in [0.81, 1.00])
  // Phase 2 Continuous Trajectory:
  // 1. Monolith Corridor (0.81 -> 0.8929): Pure arterial fly-through
  // 2. Establishing Shot (0.8929 -> 0.9180): Subtle 3/4 hero perspective angle (X: 0.52, Y: -15.82)
  // 3. Continuous Push-In (0.9180 -> 0.9420): Single smooth glide into dial face (X -> 0.265, Y -> -16.00)
  // 4. Scale-Matched Macro Caliber (0.9420 -> 0.9780): Glides through gears with physical parallax
  // 5. Climax Typography (0.9780 -> 1.0000): Settles into grand typography space
  // ============================================================================
  if (clamped >= 0.81) {
    if (clamped < 0.8929) {
      // 1. Monolith arterial fly-through
      const t = (clamped - 0.81) / (0.8929 - 0.81);
      const z = THREE.MathUtils.lerp(-65.50, -81.50, t);
      return {
        x: 0.265,
        y: -16.00,
        z,
        lookX: 0.265,
        lookY: -16.00,
        lookZ: THREE.MathUtils.lerp(-80.00, -94.00, t),
        fov: 45,
      };
    } else if (clamped < 0.9180) {
      // 2. Reference Stage 1: Establishing Shot with subtle ~45° hero perspective
      const t = (clamped - 0.8929) / (0.9180 - 0.8929);
      const ease = t * t * (3.0 - 2.0 * t);
      const z = THREE.MathUtils.lerp(-81.50, -88.00, ease);
      return {
        x: THREE.MathUtils.lerp(0.265, 0.520, ease),
        y: THREE.MathUtils.lerp(-16.00, -15.82, ease),
        z,
        lookX: 0.265,
        lookY: -16.00,
        lookZ: -94.00,
        fov: 45,
      };
    } else if (clamped < 0.9420) {
      // 3. Reference Stage 2: Continuous Push-In toward dial center (gliding through opening dial)
      const t = (clamped - 0.9180) / (0.9420 - 0.9180);
      const ease = t * t * (3.0 - 2.0 * t);
      const z = THREE.MathUtils.lerp(-88.00, -93.85, ease);
      return {
        x: THREE.MathUtils.lerp(0.520, 0.280, ease),
        y: THREE.MathUtils.lerp(-15.82, -15.82, ease),
        z,
        lookX: THREE.MathUtils.lerp(0.265, 0.050, ease),
        lookY: THREE.MathUtils.lerp(-16.00, -15.88, ease),
        lookZ: THREE.MathUtils.lerp(-94.00, -96.50, ease),
        fov: 45,
      };
    } else if (clamped < 0.9780) {
      // 4. Reference Stage 3 & 4: HERO MACRO CALIBER FRAMING & SILKY PARALLAX DRIFT
      // Continuous forward glide through Swiss gears from Z: -93.85 to -101.50 (zero standstill or hang!)
      const t = (clamped - 0.9420) / (0.9780 - 0.9420);
      const ease = t * t * (3.0 - 2.0 * t);
      const z = THREE.MathUtils.lerp(-93.85, -101.50, ease);
      const x = THREE.MathUtils.lerp(0.280, 0.200, ease);
      const y = THREE.MathUtils.lerp(-15.82, -15.88, ease);
      const lookX = THREE.MathUtils.lerp(0.050, 0.120, ease);
      const lookY = THREE.MathUtils.lerp(-15.88, -15.95, ease);
      return {
        x,
        y,
        z,
        lookX,
        lookY,
        lookZ: THREE.MathUtils.lerp(-96.50, -106.00, ease),
        fov: 45,
      };
    } else {
      // 5. Reference Stage 5: Exit through Tourbillon into Climax Typography Sanctuary & Act 01 Breach
      const t = (clamped - 0.9780) / (1.0000 - 0.9780);
      const ease = t * t * (3.0 - 2.0 * t);
      const z = THREE.MathUtils.lerp(-101.50, -112.50, ease);
      return {
        x: THREE.MathUtils.lerp(0.200, 0.265, ease),
        y: THREE.MathUtils.lerp(-15.88, -16.00, ease),
        z,
        lookX: 0.265,
        lookY: -16.00,
        lookZ: THREE.MathUtils.lerp(-106.00, -116.00, ease),
        fov: 45,
      };
    }
  }

  if (clamped <= 0) return CAMERA_KEYS[0];
  if (clamped >= 1) return CAMERA_KEYS[CAMERA_KEYS.length - 1];

  let i = 0;
  while (i < CAMERA_KEYS.length - 2 && CAMERA_KEYS[i + 1].p <= clamped) {
    i++;
  }

  const k0 = CAMERA_KEYS[i];
  const k1 = CAMERA_KEYS[i + 1];
  const t = (clamped - k0.p) / (k1.p - k0.p);
  // Hermite smooth cubic ease
  const ease = t * t * (3.0 - 2.0 * t);

  return {
    x: THREE.MathUtils.lerp(k0.x, k1.x, ease),
    y: THREE.MathUtils.lerp(k0.y, k1.y, ease),
    z: THREE.MathUtils.lerp(k0.z, k1.z, ease),
    lookX: THREE.MathUtils.lerp(k0.lookX, k1.lookX, ease),
    lookY: THREE.MathUtils.lerp(k0.lookY, k1.lookY, ease),
    lookZ: THREE.MathUtils.lerp(k0.lookZ, k1.lookZ, ease),
    fov: THREE.MathUtils.lerp(k0.fov, k1.fov, ease),
  };
}





// ============================================================================
// PHASE 1: PROCEDURAL IRIS TUNNEL GLSL SHADER (WITH WARM DEPTH LIGHT BLEED)
// ============================================================================
const IrisShader = {
  uniforms: {
    uTime: { value: 0 },
    uPupilRadius: { value: 0.28 },
    uColorPupilRim: { value: new THREE.Color("#160a03") },
    uColorAmberStriae: { value: new THREE.Color("#d18938") },
    uColorHazelGold: { value: new THREE.Color("#e8b456") },
    uColorCiliaryOlive: { value: new THREE.Color("#4a5638") },
    uColorLimbalRing: { value: new THREE.Color("#080c12") },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform float uTime;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      float wave = sin(pos.z * 4.0 + uTime * 1.5) * cos(atan(pos.y, pos.x) * 6.0);
      pos += normal * wave * 0.02;
      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    uniform float uTime;
    uniform float uPupilRadius;
    uniform vec3 uColorPupilRim;
    uniform vec3 uColorAmberStriae;
    uniform vec3 uColorHazelGold;
    uniform vec3 uColorCiliaryOlive;
    uniform vec3 uColorLimbalRing;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.1;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;
      float theta = atan(p.y, p.x);

      // Pupil Aperture: Discard allows looking straight through into the glowing neural network!
      if (r < uPupilRadius) {
        discard;
      }

      float n = fbm(p * 9.0);
      float radialStriae = sin(theta * 64.0 + n * 6.0) * 0.5 + 0.5;
      radialStriae += sin(theta * 128.0 - n * 3.0) * 0.25;

      float concentric = sin(r * 28.0 + n * 4.0) * 0.5 + 0.5;
      float collarette = smoothstep(0.42, 0.58, r) * (1.0 - smoothstep(0.58, 0.76, r));

      vec3 col = uColorPupilRim;
      col = mix(col, uColorAmberStriae, smoothstep(uPupilRadius, 0.52, r) * radialStriae);
      col = mix(col, uColorHazelGold, collarette * (0.6 + 0.4 * concentric));
      col = mix(col, uColorCiliaryOlive, smoothstep(0.60, 0.88, r));
      col = mix(col, uColorLimbalRing, smoothstep(0.85, 1.0, r));

      float pulse = sin(uTime * 2.0 - r * 8.0 + theta * 4.0) * 0.5 + 0.5;
      col += uColorHazelGold * pulse * 0.15 * (1.0 - smoothstep(0.8, 1.0, r));

      // LIGHT BLEED: Tunnel walls transition into warm amber/gold radiance toward the neural exit
      float depthGlow = smoothstep(-2.5, -5.5, vWorldPosition.z);
      col = mix(col, vec3(0.38, 0.16, 0.04), depthGlow * 0.65);

      vec2 specLightPos = vec2(0.24, 0.36);
      float specDist = length(p - specLightPos);
      float specHighlight = exp(-pow(specDist * 7.0, 2.0)) * 0.8;
      col += vec3(1.0, 0.98, 0.94) * specHighlight;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// ============================================================================
// PHASE 1: STAGE 1 PORTRAIT PLANE (Z = 0)
// ============================================================================
interface PortraitPlaneProps {
  cameraZ: number;
}

function PortraitPlane({ cameraZ }: PortraitPlaneProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/assets/genesis/frame-001.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      setTexture(tex);
    });
  }, []);

  useFrame(() => {
    if (!materialRef.current || !meshRef.current) return;

    if (cameraZ > 0.40) {
      materialRef.current.opacity = 1.0;
      meshRef.current.visible = true;
    } else if (cameraZ > 0.05) {
      const t = (cameraZ - 0.05) / (0.40 - 0.05);
      materialRef.current.opacity = t * t * (3.0 - 2.0 * t);
      meshRef.current.visible = true;
    } else {
      materialRef.current.opacity = 0.0;
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[6.4, 3.6, 1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        depthWrite={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// PHASE 1: STAGE 2 THE 3D IRIS TUNNEL (WITH SEAMLESS EXIT LIGHT BLEED)
// ============================================================================
interface IrisTunnelProps {
  time: number;
}

function IrisTunnel({ time }: IrisTunnelProps) {
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPupilRadius: { value: 0.28 },
        uColorPupilRim: { value: new THREE.Color("#140902") },
        uColorAmberStriae: { value: new THREE.Color("#d18938") },
        uColorHazelGold: { value: new THREE.Color("#e8b456") },
        uColorCiliaryOlive: { value: new THREE.Color("#4a5638") },
        uColorLimbalRing: { value: new THREE.Color("#080c12") },
      },
      vertexShader: IrisShader.vertexShader,
      fragmentShader: IrisShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true,
    });
  }, []);

  useFrame(() => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = time;
    }
  });

  return (
    <group position={[EYE_TARGET.x, EYE_TARGET.y, 0]}>
      {/* 1. Front Iris Disk (Z: -2.5) */}
      <mesh position={[0, 0, -2.5]}>
        <ringGeometry args={[0.85, 3.6, 64, 16]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>

      {/* 2. 3D Torus Entrance Rim (Z: -2.5) */}
      <mesh position={[0, 0, -2.5]}>
        <torusGeometry args={[2.4, 0.75, 32, 100]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>

      {/* 3. Inverted 3D Cone/Tunnel (Z: -2.5 to -5.5) */}
      <mesh position={[0, 0, -4.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.85, 3.6, 3.0, 64, 32, true]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>

      {/* 4. Golden Luminous Rear Exit Ring (Z: -5.5) */}
      <mesh position={[0, 0, -5.5]}>
        <torusGeometry args={[0.95, 0.10, 16, 64]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.65} />
      </mesh>

      {/* 5. Volumetric Pupil Glow Light */}
      <pointLight position={[0, 0, -5.0]} intensity={18.0} color="#ff9922" distance={15} />
    </group>
  );
}

// ============================================================================
// PHASE 2.5: THE CONVERGENCE (NERVES ROUTING INTO & WRAPPING MAIN BRAIN)
// Nerves sprout inside Iris (Z: -6.5) and wrap around the Main Brain outer shell
// ============================================================================
const NerveShader = {
  uniforms: {
    uTime: { value: 0 },
    uCameraZ: { value: 4.35 },
    uColorBase: { value: new THREE.Color("#78350f") },
    uColorGlow: { value: new THREE.Color("#d97706") },
    uColorHot: { value: new THREE.Color("#fbbf24") },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    uniform float fogDensity;

    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;
      float depth = -mvPosition.z;
      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vFogFactor;

    uniform float uTime;
    uniform float uCameraZ;
    uniform vec3 uColorBase;
    uniform vec3 uColorGlow;
    uniform vec3 uColorHot;

    void main() {
      float pulsePattern = sin(vUv.x * 20.0 - uTime * 4.5) * 0.5 + 0.5;
      float packet = pow(pulsePattern, 6.0) * 2.2;

      vec3 col = uColorBase;
      col = mix(col, uColorGlow, clamp(packet * 0.7, 0.0, 1.0));
      col += uColorHot * clamp(packet - 1.2, 0.0, 1.0) * 0.5;

      // Clean corridor fade: dissolve as camera reaches the brain entrance (Z <= -8.4)
      float fadeZ = smoothstep(-8.4, -6.8, vWorldPos.z);

      col *= (1.0 - vFogFactor) * fadeZ;
      gl_FragColor = vec4(col, (1.0 - vFogFactor) * fadeZ * 0.85);
    }
  `,
};

function NeuralPathway({ time }: { time: number }) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const nerveGeometries = useMemo(() => {
    const geoms: THREE.TubeGeometry[] = [];
    const count = 8; // Refined count: elegant delicate filaments, zero clutter

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const isLeft = i < count / 2;
      const hemisphereTargetX = isLeft ? EYE_TARGET.x - 2.0 : EYE_TARGET.x + 2.0;

      // Point 0: Inside Iris funnel (Z: -3.5)
      const rIris = 1.45 + Math.sin(i * 3.7) * 0.15;
      const p0 = new THREE.Vector3(
        EYE_TARGET.x + Math.cos(angle) * rIris,
        EYE_TARGET.y + Math.sin(angle) * rIris,
        -3.5
      );

      // Point 1: Exiting pupil into void (Z: -5.0)
      const rExit = 1.1 + Math.cos(i * 2.1) * 0.25;
      const p1 = new THREE.Vector3(
        EYE_TARGET.x + Math.cos(angle) * rExit,
        EYE_TARGET.y + Math.sin(angle) * rExit,
        -5.0
      );

      // Point 2: Branching neural corridor (Z: -6.5)
      const rMid = 2.0 + Math.sin(i * 1.9) * 0.3;
      const p2 = new THREE.Vector3(
        EYE_TARGET.x + Math.cos(angle + 0.25) * rMid,
        EYE_TARGET.y + Math.sin(angle + 0.25) * rMid,
        -6.5
      );

      // Point 3: Converging into brain cortex periphery (Z: -7.6)
      const p3 = new THREE.Vector3(
        EYE_TARGET.x + Math.cos(angle) * 2.2,
        EYE_TARGET.y + Math.sin(angle) * 1.7,
        -7.6
      );

      // Point 4: Anchoring into cortex entrance (Z: -8.2) - never intrudes into sagittal canyon
      const wrapAngle = angle + (isLeft ? 0.35 : -0.35);
      const p4 = new THREE.Vector3(
        hemisphereTargetX + Math.cos(wrapAngle) * 1.8,
        EYE_TARGET.y + Math.sin(wrapAngle) * 1.4,
        -8.2
      );

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, "catmullrom", 0.5);
      // Delicate filament radius 0.014
      const tube = new THREE.TubeGeometry(curve, 48, 0.014, 8, false);
      geoms.push(tube);
    }
    return geoms;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 4.35 },
        uColorBase: { value: new THREE.Color("#78350f") },
        uColorGlow: { value: new THREE.Color("#d97706") },
        uColorHot: { value: new THREE.Color("#fbbf24") },
        fogDensity: { value: 0.032 },
      },
      vertexShader: NerveShader.vertexShader,
      fragmentShader: NerveShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(() => {
    if (material) {
      material.uniforms.uTime.value = time;
      material.uniforms.uCameraZ.value = camera.position.z;
    }
    if (groupRef.current) {
      // Disappear completely once camera has breached into brain (Z <= -8.4)
      groupRef.current.visible = camera.position.z > -8.4;
    }
  });

  return (
    <group ref={groupRef}>
      {nerveGeometries.map((geom, idx) => (
        <mesh key={idx} geometry={geom} material={material} />
      ))}
    </group>
  );
}

// ============================================================================
// ============================================================================
// PHASE 2.5: THE MAIN BRAIN CORTEX & DISTANCE-BASED DISSOLVE SHADER
// Authentic anatomical human brain tissue:
// - Physical gyri/sulci crevice occlusion (deep rosy crimson sulci, warm creamy pink gyri)
// - Branching dendritic pia mater micro-capillaries
// - Biological subsurface scattering (translucent flesh SSS)
// - Cerebrospinal fluid (CSF) wet clearcoat specular gloss
// - Smooth distance-based burning dissolve into internal logic/creative hemispheres
// ============================================================================
const BrainCortexShader = {
  uniforms: {
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3(0, 0, 4.35) },
    uBrainCenter: { value: new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y, -25.5) },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vViewDir;
    varying float vFogFactor;

    uniform float fogDensity;
    uniform vec3 uCameraPos;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);

      // ANTI-LAG PHYSICAL PROXIMITY VERTEX REPEL TUNNEL
      // Displace vertices away laterally from camera trajectory to create an unclipped passage
      // Completely eliminates GPU transparency overdraw by maintaining 100% opaque early-Z testing.
      vec3 toCam = wp.xyz - uCameraPos;
      float distToCam = length(toCam);
      float repelRadius = 3.6;

      if (distToCam < repelRadius) {
        float t = distToCam / repelRadius;
        float pushFactor = 1.0 - t * t * (3.0 - 2.0 * t);

        // Part outward laterally in X-Y plane perpendicular to camera flight axis
        vec2 lateral = wp.xy - uCameraPos.xy;
        float latLen = length(lateral);
        vec2 pushDir = latLen < 0.001 ? vec2(1.0, 0.0) : lateral / latLen;

        wp.xy += pushDir * pushFactor * 3.4;
        wp.z += sign(wp.z - uCameraPos.z) * pushFactor * 1.2;
      }

      vWorldPos = wp.xyz;
      vViewDir = normalize(uCameraPos - wp.xyz);

      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;

      float depth = -mvPosition.z;
      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vViewDir;
    varying float vFogFactor;

    uniform float uTime;
    uniform vec3 uBrainCenter;

    // 3D Simplex Noise for micro-vessel pathing and dendritic capillaries
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0 );
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // ======================================================================
      // 1. ANATOMICAL SULCI & GYRI GEOMETRIC OCCLUSION
      // ======================================================================
      vec3 radialVec = vWorldPos - uBrainCenter;
      vec3 radialDir = normalize(radialVec);

      float radialDot = dot(vNormal, radialDir);
      float curvature = length(fwidth(vNormal));

      // Sulcus depth factor: 0.0 = ridge peak, 1.0 = deep valley
      float sulcus = clamp(1.0 - (radialDot - 0.20) / 0.70, 0.0, 1.0);
      sulcus = max(sulcus, smoothstep(0.14, 0.42, curvature));

      // Sulci: deep crimson shadow, Gyri: warm rich biological tissue tones (zero blinding white)
      vec3 cSulcusDark = vec3(0.12, 0.02, 0.03);
      vec3 cSulcusGlow = vec3(0.38, 0.06, 0.08);
      vec3 cSulcus     = mix(cSulcusDark, cSulcusGlow, 0.35);

      vec3 cGyriBase   = vec3(0.42, 0.22, 0.20);
      vec3 cGyriPeak   = vec3(0.58, 0.32, 0.28);
      vec3 cGyri       = mix(cGyriBase, cGyriPeak, clamp(radialDot * 0.5 + 0.5, 0.0, 1.0));

      vec3 tissueColor = mix(cGyri, cSulcus, sulcus);

      // ======================================================================
      // 2. DENDRITIC PIA MATER MICRO-CAPILLARIES
      // ======================================================================
      float vesselNoise1 = snoise(vWorldPos * 2.8);
      float vesselNoise2 = snoise(vWorldPos * 6.5 + vec3(4.3, 1.2, 8.7));
      float vessels = smoothstep(0.72, 0.88, abs(vesselNoise1 * 0.65 + vesselNoise2 * 0.35));
      vec3 cCapillary = vec3(0.68, 0.04, 0.06);
      tissueColor = mix(tissueColor, cCapillary, vessels * 0.65 * (1.0 - sulcus * 0.5));

      // ======================================================================
      // 3. BIOLOGICAL TRANSLUCENT SUBSURFACE SCATTERING (SSS)
      // ======================================================================
      vec3 keyLight = normalize(vec3(0.35, 0.65, 0.68));
      float nDotL = dot(vNormal, keyLight);
      float wrapDiffuse = max(0.0, (nDotL + 0.55) / 1.55);

      // Forward wrap SSS into translucent flesh
      float forwardSSS = pow(max(0.0, dot(-vViewDir, keyLight) * 0.75 + 0.25), 3.2);
      vec3 cSSS = vec3(0.85, 0.18, 0.10);
      vec3 diffuse = tissueColor * wrapDiffuse;
      diffuse += cSSS * forwardSSS * 0.35 * (1.0 - sulcus * 0.6);

      // Warm ambient cavity occlusion
      vec3 cCavity = vec3(0.10, 0.02, 0.03);
      vec3 ambient = mix(cCavity, vec3(0.18, 0.12, 0.12), 1.0 - sulcus);
      vec3 baseColor = diffuse + ambient;

      // ======================================================================
      // 4. CEREBROSPINAL FLUID (CSF) WET SPECULAR GLOSS
      // ======================================================================
      vec3 halfVec = normalize(keyLight + vViewDir);
      float nDotH = max(0.0, dot(vNormal, halfVec));
      float broadSpec = pow(nDotH, 18.0) * 0.12;
      float tightSpec = pow(nDotH, 80.0) * 0.35;
      float fresnelWet = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.8) * 0.25;

      vec3 cSpec = vec3(0.85, 0.75, 0.70) * (broadSpec + tightSpec) + vec3(0.60, 0.75, 0.90) * fresnelWet;
      baseColor += cSpec * (1.0 - sulcus * 0.4);

      // ======================================================================
      // 5. DUAL-MIND SEMANTIC RIM & SYNAPSE ACTION POTENTIALS
      // ======================================================================
      float hemisphereX = (vWorldPos.x - uBrainCenter.x) / 1.5;
      vec3 rimColor = mix(vec3(0.0, 0.92, 1.0), vec3(1.0, 0.68, 0.18), smoothstep(-0.6, 0.6, hemisphereX));
      float rimFresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 2.6);
      baseColor += rimColor * rimFresnel * 0.45;

      // Pulsating synaptic action potentials along nerve folds
      float pulse = sin(uTime * 3.5 + vWorldPos.y * 3.0 + vWorldPos.z * 2.0) * 0.5 + 0.5;
      vec3 cSynapse = mix(vec3(0.2, 0.85, 1.0), vec3(1.0, 0.80, 0.35), smoothstep(-0.4, 0.4, hemisphereX));
      baseColor += cSynapse * pow(pulse, 5.0) * 0.18;

      // Atmospheric depth fog
      baseColor *= (1.0 - vFogFactor);

      // Completely opaque: zero GPU alpha overdraw, early-Z rejection active!
      gl_FragColor = vec4(baseColor, 1.0);
    }
  `,
};

// Preload the real 3D anatomical brain model
useGLTF.preload("/models/brain.glb");

function AnatomicalBrain({ cameraZ: _cameraZ, time }: { cameraZ: number; time: number }) {
  const { scene } = useGLTF("/models/brain.glb");
  const { camera } = useThree();
  const brainGroupRef = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPos: { value: new THREE.Vector3(0, 0, 4.35) },
        uBrainCenter: { value: new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y, -12.0) },
        fogDensity: { value: 0.032 },
      },
      vertexShader: BrainCortexShader.vertexShader,
      fragmentShader: BrainCortexShader.fragmentShader,
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });
  }, []);

  const brainScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = material;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, material]);

  useFrame(() => {
    if (!material) return;
    material.uniforms.uTime.value = time;
    // Pass live 3D camera position for physical proximity vertex repel
    material.uniforms.uCameraPos.value.copy(camera.position);

    // Fast Cortex Breakthrough:
    // Outer brain cortex dissolves quickly between Z: -7.5 and -8.6
    // Once camZ <= -8.6, outer brain is hidden so Left & Right brain hemispheres
    // are visible in pristine obsidian clarity with zero white blur!
    if (brainGroupRef.current) {
      const dissolve = THREE.MathUtils.smoothstep(camera.position.z, -8.6, -7.5);
      brainGroupRef.current.visible = dissolve > 0.01 && camera.position.z > -10.0;
    }
  });

  return (
    <group
      ref={brainGroupRef}
      position={[EYE_TARGET.x, EYE_TARGET.y, -12.0]}
      rotation={[0.16, Math.PI, 0]}
      scale={[38.0, 38.0, 38.0]}
    >
      <primitive object={brainScene} position={[0, -1.619286, 0.00877]} />
    </group>
  );
}

function MainBrainCortex({ cameraZ, time }: { cameraZ: number; time: number }) {
  return (
    <Suspense fallback={null}>
      <AnatomicalBrain cameraZ={cameraZ} time={time} />
    </Suspense>
  );
}

// ============================================================================
// PHASE 2.5: THE CORE SPLIT (INTERNAL MACRO-ENVIRONMENTS)
// ============================================================================

// 1. LEFT BRAIN (THE EDITOR'S LOGIC): Analytics, precision, grids & keyframe diamonds
function LeftEditorLogicHemisphere({ cameraZ }: { cameraZ: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const diamondsRef = useRef<THREE.InstancedMesh>(null);
  const cubesRef = useRef<THREE.InstancedMesh>(null);

  const diamondCount = 120;
  const cubeCount = 180;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Octahedron keyframe diamonds along longitudinal timeline precision tracks (Z: -24 to -38)
  const diamondData = useMemo(() => {
    const list: { pos: THREE.Vector3; scale: number; rotOffset: number }[] = [];
    const trackY = [1.2, 0.4, -0.4, -1.2];

    for (let i = 0; i < diamondCount; i++) {
      const t = i / (diamondCount - 1);
      const z = -9.0 - t * 7.0 + Math.sin(i * 4.3) * 0.25;
      const trackIdx = i % trackY.length;
      const y = trackY[trackIdx] + Math.sin(i * 2.7) * 0.15;
      const x = -0.4 + Math.cos(i * 3.1) * 0.9;

      list.push({
        pos: new THREE.Vector3(x, y, z),
        scale: 0.22 + (i % 4 === 0 ? 0.14 : 0.06),
        rotOffset: (i * Math.PI) / 4,
      });
    }
    return list;
  }, []);

  // Analytical matrix cubes in structured 3D grid constellation flanking timeline tracks
  const cubeData = useMemo(() => {
    const list: { pos: THREE.Vector3; scale: number }[] = [];
    for (let i = 0; i < cubeCount; i++) {
      const z = -9.0 - Math.random() * 7.0;
      const x = -1.6 + Math.random() * 2.2;
      const y = -1.6 + Math.random() * 3.2;

      list.push({
        pos: new THREE.Vector3(x, y, z),
        scale: 0.14 + Math.sin(i * 1.7) * 0.06,
      });
    }
    return list;
  }, []);

  // 4 Horizontal Timeline Rail Tracks (Z: -9.0 to -16.0)
  const railGeometries = useMemo(() => {
    const tracks: { start: THREE.Vector3; end: THREE.Vector3 }[] = [
      { start: new THREE.Vector3(-0.3, 1.2, -9.0), end: new THREE.Vector3(-0.3, 1.2, -16.0) },
      { start: new THREE.Vector3(0.1, 0.4, -9.0), end: new THREE.Vector3(0.1, 0.4, -16.0) },
      { start: new THREE.Vector3(0.1, -0.4, -9.0), end: new THREE.Vector3(0.1, -0.4, -16.0) },
      { start: new THREE.Vector3(-0.3, -1.2, -9.0), end: new THREE.Vector3(-0.3, -1.2, -16.0) },
    ];
    return tracks;
  }, []);

  useEffect(() => {
    if (!diamondsRef.current || !cubesRef.current) return;
    const cCyan = new THREE.Color("#00f0ff");
    const cWhite = new THREE.Color("#ffffff");
    const cIce = new THREE.Color("#70d6ff");

    diamondData.forEach((d, i) => {
      dummy.position.copy(d.pos);
      dummy.rotation.set(0, d.rotOffset, Math.PI / 4); // 45-degree keyframe diamond orientation
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      diamondsRef.current!.setMatrixAt(i, dummy.matrix);
      diamondsRef.current!.setColorAt(i, i % 3 === 0 ? cWhite : cCyan);
    });
    diamondsRef.current.instanceMatrix.needsUpdate = true;
    if (diamondsRef.current.instanceColor) diamondsRef.current.instanceColor.needsUpdate = true;

    cubeData.forEach((c, i) => {
      dummy.position.copy(c.pos);
      dummy.rotation.set(0, 0, 0); // Strict orthogonal orientation
      dummy.scale.setScalar(c.scale);
      dummy.updateMatrix();
      cubesRef.current!.setMatrixAt(i, dummy.matrix);
      cubesRef.current!.setColorAt(i, i % 2 === 0 ? cWhite : cIce);
    });
    cubesRef.current.instanceMatrix.needsUpdate = true;
    if (cubesRef.current.instanceColor) cubesRef.current.instanceColor.needsUpdate = true;
  }, [diamondData, cubeData, dummy]);

  const railMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#00f0ff", transparent: true, opacity: 0.65 }),
    []
  );
  const tickMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#00f0ff", wireframe: true, transparent: true, opacity: 0.18 }),
    []
  );

  useEffect(() => {
    return () => {
      railMaterial.dispose();
      tickMaterial.dispose();
    };
  }, [railMaterial, tickMaterial]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth volumetric corridor visibility: visible between Z: -8.0 and -18.5
    const fadeIn = THREE.MathUtils.smoothstep(-cameraZ, 7.0, 10.0);
    const fadeOut = 1.0 - THREE.MathUtils.smoothstep(-cameraZ, 15.5, 18.5);
    const visibility = Math.max(0, Math.min(1, fadeIn * fadeOut));

    // Mathematical precision subtle pulse
    groupRef.current.rotation.z += delta * 0.05;

    railMaterial.opacity = 0.65 * visibility;
    tickMaterial.opacity = 0.18 * visibility;

    if (diamondsRef.current && cubesRef.current) {
      (diamondsRef.current.material as THREE.MeshBasicMaterial).opacity = 0.95 * visibility;
      (cubesRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * visibility;
    }
  });

  return (
    <group ref={groupRef} position={[EYE_TARGET.x - 1.85, EYE_TARGET.y, 0]}>
      {/* Precision Geometric Timeline Rails */}
      {railGeometries.map((r, idx) => (
        <mesh
          key={idx}
          position={[(r.start.x + r.end.x) / 2, (r.start.y + r.end.y) / 2, -12.5]}
          rotation={[Math.PI / 2, 0, 0]}
          material={railMaterial}
        >
          <cylinderGeometry args={[0.016, 0.016, 7.0, 8]} />
        </mesh>
      ))}

      {/* Precision Frame Tick Markers along rails */}
      {[-9.5, -10.5, -11.5, -12.5, -13.5, -14.5, -15.5].map((z, idx) => (
        <mesh key={`tick-${idx}`} position={[0, 0, z]} material={tickMaterial}>
          <boxGeometry args={[1.6, 2.8, 0.02]} />
        </mesh>
      ))}

      {/* Glowing Keyframe Diamonds */}
      <instancedMesh ref={diamondsRef} args={[undefined, undefined, diamondCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial transparent opacity={0.95} />
      </instancedMesh>

      {/* Analytical Matrix Cubes */}
      <instancedMesh ref={cubesRef} args={[undefined, undefined, cubeCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.85} />
      </instancedMesh>
    </group>
  );
}

// 2. RIGHT BRAIN (THE ARTIST'S CREATIVITY): Swirling fluid nebula, vibrant emotion
const CreativeNebulaShader = {
  uniforms: {
    uTime: { value: 0 },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float fogDensity;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vFogFactor;
    varying float vWorldZ;

    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0 );
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vec3 pos = position;
      // Fluid, chaotic organic swirling motion along the Z corridor
      float n = snoise(pos * 0.45 + vec3(0.0, uTime * 0.35, pos.z * 0.2));
      float swirlAngle = uTime * 0.65 + pos.z * 0.35;
      float c = cos(swirlAngle);
      float s = sin(swirlAngle);
      vec2 rotXY = mat2(c, -s, s, c) * pos.xy;
      pos.xy = mix(pos.xy, rotXY, 0.35);
      pos += normal * (n * 0.65);

      vec4 wp = modelMatrix * vec4(pos, 1.0);
      vWorldZ = wp.z;
      vec4 mvPosition = viewMatrix * wp;
      float depth = -mvPosition.z;

      float pSize = (140.0 / max(1.0, depth)) * (0.85 + n * 0.45);
      gl_PointSize = clamp(pSize, 2.5, 24.0);
      gl_Position = projectionMatrix * mvPosition;

      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);

      // Saturated Chromatic Palette: Vibrant Orange -> Hot Magenta Pink -> Luminous Gold
      float heat = n * 0.5 + 0.5;
      vec3 cOrange = vec3(1.0, 0.33, 0.0);
      vec3 cPink = vec3(1.0, 0.02, 0.52);
      vec3 cGold = vec3(1.0, 0.78, 0.08);

      vColor = mix(cOrange, mix(cPink, cGold, smoothstep(0.3, 0.8, heat)), smoothstep(0.2, 0.7, heat)) * 1.85;
      vAlpha = smoothstep(0.05, 0.4, length(pos.xy));
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vFogFactor;
    varying float vWorldZ;

    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float d = length(p);
      if (d > 0.5) discard;

      // Soft gaussian point disk
      float soft = exp(-d * d * 8.0);

      // Volumetric corridor fade between Z: -7.5 and -18.5
      float fadeIn = smoothstep(7.0, 10.0, -vWorldZ);
      float fadeOut = 1.0 - smoothstep(15.5, 18.5, -vWorldZ);
      float corridorFade = clamp(fadeIn * fadeOut, 0.0, 1.0);

      vec3 col = vColor * (1.0 - vFogFactor);
      float alpha = soft * vAlpha * (1.0 - vFogFactor) * corridorFade * 0.95;
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

function RightArtistCreativityHemisphere({ time }: { time: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const particleCount = 7500;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Swirling cylindrical vortex along Z: -9.0 to -16.0
      const z = -9.0 - Math.random() * 7.0;
      const angle = z * 0.55 + Math.random() * Math.PI * 2.0;
      const radius = 1.1 + Math.pow(Math.random(), 0.72) * 2.3;

      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: CreativeNebulaShader.vertexShader,
      fragmentShader: CreativeNebulaShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(() => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = time;
    }
  });

  return (
    <points
      ref={pointsRef}
      position={[EYE_TARGET.x + 1.85, EYE_TARGET.y, 0]}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
}

// ============================================================================
// PHASE 3A: THE AUTHENTIC BIOLOGICAL NERVE PLEXUS (BRAINSTEM TO CARDIAC INNERVATION)
// Real biological multi-fascicle braided neural cables with Nodes of Ranvier,
// cranial brainstem rootlets (fila radicularia), collateral dendritic tendrils,
// and cardiac plexus arborization wrapping directly onto the anatomical heart.
// ============================================================================

// Stable parallel transport frame (Bishop frame) along 3D Catmull-Rom spline (0 twist-flips)
function computeBishopFrames(curve: THREE.Curve<THREE.Vector3>, segments: number) {
  const points: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    points.push(curve.getPointAt(u));
    tangents.push(curve.getTangentAt(u).normalize());
  }

  // Initial normal reference
  const t0 = tangents[0];
  let n0 = new THREE.Vector3(1, 0, 0);
  if (Math.abs(t0.dot(n0)) > 0.85) {
    n0 = new THREE.Vector3(0, 1, 0);
  }
  n0.sub(t0.clone().multiplyScalar(t0.dot(n0))).normalize();
  normals.push(n0);
  binormals.push(new THREE.Vector3().crossVectors(t0, n0).normalize());

  for (let i = 1; i <= segments; i++) {
    const tPrev = tangents[i - 1];
    const tCurr = tangents[i];
    const nPrev = normals[i - 1];

    const axis = new THREE.Vector3().crossVectors(tPrev, tCurr);
    let nCurr: THREE.Vector3;
    if (axis.lengthSq() < 1e-6) {
      nCurr = nPrev.clone();
    } else {
      axis.normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(tPrev.dot(tCurr), -1, 1));
      nCurr = nPrev.clone().applyAxisAngle(axis, angle);
    }
    nCurr.sub(tCurr.clone().multiplyScalar(tCurr.dot(nCurr))).normalize();
    const bCurr = new THREE.Vector3().crossVectors(tCurr, nCurr).normalize();

    normals.push(nCurr);
    binormals.push(bCurr);
  }

  return { points, tangents, normals, binormals };
}

// ============================================================================
// PHASE 2.6: HEMISPHERE NEURAL CONVERGENCE CHIASM (LEFT & RIGHT BRAIN -> NERVES)
// Bridges the analytical Left Brain (cyan timeline rails) and emotional Right Brain
// (golden nebula) into the central brainstem medulla cleft base (Z: -16.50).
// Eliminates abrupt pop-ins and creates an authentic anatomical convergence chiasm.
// ============================================================================

const ConvergenceAxonShader = {
  uniforms: {
    uTime: { value: 0 },
    uCameraZ: { value: 4.35 },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    attribute float aHemisphere; // 0.0 = Left (Logic), 1.0 = Right (Creativity), 0.5 = Cross-over
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    varying float vHemisphere;
    uniform float fogDensity;

    void main() {
      vUv = uv;
      vHemisphere = aHemisphere;
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;

      float depth = -mvPosition.z;
      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    varying float vHemisphere;

    uniform float uTime;
    uniform float uCameraZ;

    void main() {
      vec3 lightDir = normalize(vec3(0.35, 1.0, 0.75));
      float ndl = max(0.22, dot(vNormal, lightDir));

      vec3 viewDir = normalize(-vWorldPos);
      vec3 halfVec = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(vNormal, halfVec)), 28.0) * 0.40;

      // Longitudinal fine axonal micro-fibrils
      float axonFibers = sin(vUv.x * 20.0 + sin(vUv.y * 12.0) * 1.5) * 0.5 + 0.5;

      // Periodic Nodes of Ranvier constrictions (saltatory conduction sites)
      float ranvierRing = pow(sin(vUv.y * 48.0) * 0.5 + 0.5, 24.0);

      // Primary electrical action potential packet streaming down axon towards brainstem
      float streamPos = vUv.y * 18.0 - uTime * 13.0;
      float packet = pow(sin(streamPos) * 0.5 + 0.5, 14.0);

      // High-speed saltatory micro-sparks jumping along nodes
      float fastSpark = pow(sin(vUv.y * 58.0 - uTime * 28.0 + vUv.x * 6.28) * 0.5 + 0.5, 18.0);

      // Translucent biological rim lighting (Fresnel effect)
      float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.8);

      // Distinct Biological Palettes:
      // Left Brain (Logic): Electric Cyan & Ice
      vec3 cLeftBase = vec3(0.02, 0.10, 0.16);
      vec3 cLeftTissue = vec3(0.22, 0.65, 0.85);
      vec3 cLeftSignal = vec3(0.0, 0.94, 1.0);

      // Right Brain (Creativity): Warm Synaptic Amber & Rose-Gold
      vec3 cRightBase = vec3(0.16, 0.08, 0.02);
      vec3 cRightTissue = vec3(0.85, 0.55, 0.22);
      vec3 cRightSignal = vec3(1.0, 0.75, 0.22);

      // Interpolate along hemisphere ownership
      vec3 cBase = mix(cLeftBase, cRightBase, vHemisphere);
      vec3 cTissue = mix(cLeftTissue, cRightTissue, ndl);
      vec3 cSignal = mix(cLeftSignal, cRightSignal, vHemisphere);

      // Chiasm Decussation: as axons approach brainstem (Z: -14.0 -> -16.5), blend into searing bio-luminescent pearl
      float convergeT = smoothstep(-13.5, -16.5, vWorldPos.z);
      cSignal = mix(cSignal, vec3(1.0, 0.96, 0.88), convergeT * 0.45);

      vec3 cRanvier = mix(vec3(0.3, 0.85, 1.0), vec3(1.0, 0.78, 0.25), vHemisphere);
      vec3 cCoreSpark = vec3(1.0, 0.98, 0.95);

      vec3 color = mix(cBase, cTissue, ndl);
      color += vec3(0.15, 0.12, 0.10) * axonFibers * 0.35;
      color += vec3(spec);
      color += cRanvier * ranvierRing * 1.2;
      color += cSignal * packet * 1.8;
      color += cCoreSpark * fastSpark * 2.2;
      color += cSignal * fresnel * 0.5;

      // Distance fade: visible early in the distance (camZ < -7.0), stays solid through canyon, fades out past Z: -22.0
      float fadeIn = smoothstep(-7.2, -9.8, -uCameraZ);
      float fadeOut = 1.0 - smoothstep(20.0, 24.5, -uCameraZ);
      float corridorFade = clamp(fadeIn * fadeOut, 0.0, 1.0);

      // Longitudinal start & end taper
      float tubeFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
      color *= (1.0 - vFogFactor) * corridorFade;

      float alpha = clamp(0.76 + packet * 0.24 + fastSpark * 0.24, 0.0, 1.0) * tubeFade * corridorFade * (1.0 - vFogFactor);
      gl_FragColor = vec4(color, alpha);
    }
  `,
};

// Multipolar Neuron Soma (Cell Body) Shader with illuminated central nucleus
const NeuronSomaShader = {
  uniforms: {
    uTime: { value: 0 },
    uCameraZ: { value: 4.35 },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vLocalPos;
    varying float vFogFactor;
    uniform float fogDensity;

    void main() {
      vLocalPos = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;

      float depth = -mvPosition.z;
      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vLocalPos;
    varying float vFogFactor;

    uniform float uTime;
    uniform float uCameraZ;

    void main() {
      vec3 viewDir = normalize(-vWorldPos);
      float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.6);

      // Radial glowing nucleus inside cell body
      float distToCenter = length(vLocalPos);
      float nucleusGlow = pow(max(0.0, 1.0 - distToCenter * 1.8), 2.5);

      // Pulsating metabolic action potential firing
      float pulse = pow(sin(uTime * 3.5 + vWorldPos.z * 1.8 + vWorldPos.x * 2.5) * 0.5 + 0.5, 8.0);

      // Color based on position (Left: Cyan, Right: Amber, Brainstem: Ivory Gold)
      vec3 cLeft = vec3(0.0, 0.92, 1.0);
      vec3 cRight = vec3(1.0, 0.72, 0.22);
      vec3 cMid = vec3(1.0, 0.95, 0.88);

      float tHem = clamp((vWorldPos.x - ${EYE_TARGET.x.toFixed(3)}) / 2.0 + 0.5, 0.0, 1.0);
      vec3 baseColor = mix(cLeft, cRight, tHem);
      if (vWorldPos.z < -16.0) {
        baseColor = mix(baseColor, cMid, 0.6);
      }

      vec3 col = baseColor * (0.35 + nucleusGlow * 1.4 + pulse * 1.6);
      col += vec3(1.0, 0.98, 0.92) * (nucleusGlow * 0.8 + pulse * 1.0);
      col += baseColor * fresnel * 0.6;

      float fadeIn = smoothstep(-7.5, -10.0, -uCameraZ);
      float fadeOut = 1.0 - smoothstep(22.0, 27.0, -uCameraZ);
      float alpha = clamp(0.70 + nucleusGlow * 0.3 + pulse * 0.2, 0.0, 1.0) * fadeIn * fadeOut * (1.0 - vFogFactor);

      gl_FragColor = vec4(col * (1.0 - vFogFactor), alpha);
    }
  `,
};

// ============================================================================
// HEMISPHERE NEURAL CONVERGENCE COMPONENT
// ============================================================================
function HemisphereNeuralConvergence({ time }: { time: number }) {
  const { camera } = useThree();
  const somasRef = useRef<THREE.InstancedMesh>(null);
  const sparkPointsRef = useRef<THREE.Points>(null);

  // 1. Converging Axons: 10 Left + 10 Right + 4 Decussation Cross-overs
  const { axonGeometries, axonHemispheres } = useMemo(() => {
    const geos: THREE.TubeGeometry[] = [];
    const hemis: number[] = [];

    const brainstemEntry = new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y, -16.50);

    // A. Left Hemisphere Efferent Axons (sprouting from timeline rails, cyan logic)
    const numLeft = 10;
    for (let i = 0; i < numLeft; i++) {
      const z0 = -11.5 - i * 0.45;
      const p0 = new THREE.Vector3(
        EYE_TARGET.x - 1.85 + Math.sin(i * 1.7) * 0.45,
        EYE_TARGET.y + ((i % 4 - 1.5) * 0.55) + Math.cos(i * 2.3) * 0.15,
        z0
      );
      const p1 = new THREE.Vector3(
        p0.x * 0.65 + brainstemEntry.x * 0.35 + Math.sin(i * 3.1) * 0.22,
        p0.y * 0.65 + brainstemEntry.y * 0.35 + Math.cos(i * 1.9) * 0.18,
        z0 - 1.6
      );
      const p2 = new THREE.Vector3(
        brainstemEntry.x - 0.22 + Math.sin(i * 2.5) * 0.18,
        brainstemEntry.y + 0.15 + Math.cos(i * 2.1) * 0.18,
        -15.6 - i * 0.08
      );
      const p3 = new THREE.Vector3(
        brainstemEntry.x - 0.08 + Math.sin(i * 1.5) * 0.12,
        brainstemEntry.y + 0.05 + Math.cos(i * 1.8) * 0.12,
        -16.50
      );

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, "catmullrom", 0.45);
      geos.push(new THREE.TubeGeometry(curve, 48, 0.045, 7, false));
      hemis.push(0.0); // Left
    }

    // B. Right Hemisphere Afferent Axons (sprouting from creative particle nebula, warm gold)
    const numRight = 10;
    for (let i = 0; i < numRight; i++) {
      const z0 = -11.5 - i * 0.45;
      const p0 = new THREE.Vector3(
        EYE_TARGET.x + 1.85 + Math.cos(i * 2.1) * 0.55,
        EYE_TARGET.y + Math.sin(i * 1.6) * 0.85,
        z0
      );
      const p1 = new THREE.Vector3(
        p0.x * 0.65 + brainstemEntry.x * 0.35 + Math.cos(i * 2.9) * 0.22,
        p0.y * 0.65 + brainstemEntry.y * 0.35 + Math.sin(i * 2.3) * 0.18,
        z0 - 1.6
      );
      const p2 = new THREE.Vector3(
        brainstemEntry.x + 0.22 + Math.cos(i * 3.3) * 0.18,
        brainstemEntry.y + 0.15 + Math.sin(i * 2.7) * 0.18,
        -15.6 - i * 0.08
      );
      const p3 = new THREE.Vector3(
        brainstemEntry.x + 0.08 + Math.cos(i * 1.8) * 0.12,
        brainstemEntry.y + 0.05 + Math.sin(i * 2.1) * 0.12,
        -16.50
      );

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, "catmullrom", 0.45);
      geos.push(new THREE.TubeGeometry(curve, 48, 0.045, 7, false));
      hemis.push(1.0); // Right
    }

    // C. Pyramidal Decussation Cross-Over Axons (interweaving across midline)
    const numDecuss = 4;
    for (let d = 0; d < numDecuss; d++) {
      const isLeftToRight = d % 2 === 0;
      const startX = isLeftToRight ? EYE_TARGET.x - 1.4 : EYE_TARGET.x + 1.4;
      const endX = isLeftToRight ? EYE_TARGET.x + 0.2 : EYE_TARGET.x - 0.2;
      const z0 = -13.2 - d * 0.7;

      const p0 = new THREE.Vector3(startX, EYE_TARGET.y + 0.4 - d * 0.2, z0);
      const pMid = new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y + 0.6 + (d % 2 === 0 ? 0.2 : -0.2), z0 - 1.2);
      const pEnd = new THREE.Vector3(endX, EYE_TARGET.y + 0.1, -16.50);

      const curve = new THREE.CatmullRomCurve3([p0, pMid, pEnd], false, "catmullrom", 0.5);
      geos.push(new THREE.TubeGeometry(curve, 40, 0.038, 7, false));
      hemis.push(0.5); // Decussation midline
    }

    return { axonGeometries: geos, axonHemispheres: hemis };
  }, []);

  // 2. Multipolar Neuron Somas (Cell Bodies) placed strategically in convergence chiasm
  const somaCount = 18;
  const somaDummy = useMemo(() => new THREE.Object3D(), []);
  const somaPositions = useMemo(() => {
    const list: THREE.Vector3[] = [];
    for (let s = 0; s < somaCount; s++) {
      const t = s / (somaCount - 1);
      const z = -12.2 - t * 4.2;
      const spread = (1.0 - t * 0.7) * 1.6;
      const angle = s * 2.399; // Golden ratio angle
      const x = EYE_TARGET.x + Math.cos(angle) * spread;
      const y = EYE_TARGET.y + Math.sin(angle) * (spread * 0.75);
      list.push(new THREE.Vector3(x, y, z));
    }
    return list;
  }, []);

  // 3. Materials
  const axonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 4.35 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: ConvergenceAxonShader.vertexShader,
      fragmentShader: ConvergenceAxonShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }, []);

  const somaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 4.35 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: NeuronSomaShader.vertexShader,
      fragmentShader: NeuronSomaShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }, []);

  // 4. Floating Neurotransmitter Synaptic Spark Cloud in Chiasm
  const sparkCount = 140;
  const [sparkPositions, sparkPhases] = useMemo(() => {
    const pos = new Float32Array(sparkCount * 3);
    const phases = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
      phases[i] = i / sparkCount;
      const z = -11.5 - Math.random() * 5.0;
      const spread = (1.0 - (-z - 11.5) / 5.0) * 1.5 + 0.2;
      pos[i * 3 + 0] = EYE_TARGET.x + (Math.random() - 0.5) * spread * 2.0;
      pos[i * 3 + 1] = EYE_TARGET.y + (Math.random() - 0.5) * spread * 1.4;
      pos[i * 3 + 2] = z;
    }
    return [pos, phases];
  }, []);

  const sparkMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          float t = fract(aPhase + uTime * 0.22);
          vAlpha = sin(t * 3.14159);

          // Color interpolate from Left (Cyan) to Right (Gold)
          float isRight = step(0.0, position.x - ${EYE_TARGET.x.toFixed(3)});
          vColor = mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.78, 0.24), isRight);
          if (position.z < -15.5) {
            vColor = mix(vColor, vec3(1.0, 0.98, 0.90), 0.7);
          }

          vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (4.0 + sin(t * 14.0) * 2.5) * (18.0 / -mvPosition.z);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float glow = pow(1.0 - dist * 2.0, 2.0);
          gl_FragColor = vec4(vColor * 2.0, glow * vAlpha * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Initialize InstancedMesh positions for Somas
  useEffect(() => {
    if (!somasRef.current) return;
    somaPositions.forEach((pos, i) => {
      somaDummy.position.copy(pos);
      const scale = 0.12 + (i % 3 === 0 ? 0.06 : 0.02);
      somaDummy.scale.setScalar(scale);
      somaDummy.rotation.set(i * 0.4, i * 0.6, i * 0.2);
      somaDummy.updateMatrix();
      somasRef.current!.setMatrixAt(i, somaDummy.matrix);
    });
    somasRef.current.instanceMatrix.needsUpdate = true;
  }, [somaPositions, somaDummy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      axonGeometries.forEach((g) => g.dispose());
      axonMaterial.dispose();
      somaMaterial.dispose();
      sparkMaterial.dispose();
    };
  }, [axonGeometries, axonMaterial, somaMaterial, sparkMaterial]);

  useFrame(() => {
    const camZ = camera.position.z;
    axonMaterial.uniforms.uTime.value = time;
    axonMaterial.uniforms.uCameraZ.value = camZ;
    somaMaterial.uniforms.uTime.value = time;
    somaMaterial.uniforms.uCameraZ.value = camZ;
    sparkMaterial.uniforms.uTime.value = time;

    // Subtle breathing micro-motion on somas
    if (somasRef.current) {
      somaPositions.forEach((pos, i) => {
        somaDummy.position.copy(pos);
        const pulse = Math.sin(time * 3.0 + i * 1.5) * 0.015;
        const scale = 0.12 + (i % 3 === 0 ? 0.06 : 0.02) + pulse;
        somaDummy.scale.setScalar(scale);
        somaDummy.rotation.y = time * 0.15 + i * 0.4;
        somaDummy.updateMatrix();
        somasRef.current!.setMatrixAt(i, somaDummy.matrix);
      });
      somasRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 24 Converging Axons with Nodes of Ranvier and Action Potentials */}
      {axonGeometries.map((geo, idx) => (
        <mesh key={`conv-axon-${idx}`} geometry={geo} material={axonMaterial}>
          {/* Tag hemisphere ownership onto geometry attribute */}
          <primitive
            object={new THREE.Float32BufferAttribute(
              new Float32Array(geo.attributes.position.count).fill(axonHemispheres[idx]),
              1
            )}
            attach="geometry-attributes-aHemisphere"
          />
        </mesh>
      ))}

      {/* 18 Multipolar Neuron Somas with glowing central nuclei */}
      <instancedMesh ref={somasRef} args={[undefined, undefined, somaCount]}>
        <sphereGeometry args={[1, 14, 14]} />
        <primitive object={somaMaterial} attach="material" />
      </instancedMesh>

      {/* 140 Synaptic spark vesicles dancing between axons */}
      <points ref={sparkPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[sparkPhases, 1]} />
        </bufferGeometry>
        <primitive object={sparkMaterial} attach="material" />
      </points>
    </group>
  );
}

// ============================================================================
// PHASE 3A: THE AUTHENTIC BIOLOGICAL NERVE PLEXUS (BRAINSTEM TO CARDIAC INNERVATION)
// Real biological multi-fascicle braided neural cables with Nodes of Ranvier,
// dendritic arborization trees, multipolar ganglia somas, and cardiac innervation.
// ============================================================================

// Biological Action Potential & Axonal Myelin Shader
const AxonFascicleShader = {
  uniforms: {
    uTime: { value: 0 },
    uCameraZ: { value: 4.35 },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    uniform float fogDensity;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;

      float depth = -mvPosition.z;
      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    uniform float uTime;
    uniform float uCameraZ;

    void main() {
      // Directional light for tubular 3D definition
      vec3 lightDir = normalize(vec3(0.4, 1.0, 0.7));
      float ndl = max(0.20, dot(vNormal, lightDir));

      vec3 viewDir = normalize(-vWorldPos);
      vec3 halfVec = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(vNormal, halfVec)), 32.0);

      // High-frequency longitudinal cybernetic striations
      float railGroove = sin(vUv.x * 24.0) * 0.5 + 0.5;

      // Primary surging high-speed action energy pulse wave rushing towards the heart
      float streamPos = vUv.y * 28.0 - uTime * 18.0;
      float packet = pow(sin(streamPos) * 0.5 + 0.5, 12.0);

      // Secondary fast electrical sparks jumping along the rails
      float fastSpark = pow(sin(vUv.y * 64.0 - uTime * 36.0 + vUv.x * 6.28) * 0.5 + 0.5, 16.0);

      // Searing luminous Fresnel neon edge
      float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.4);

      // Iconic Electric Cyber-Blue Palette
      vec3 cDeepNavy = vec3(0.015, 0.08, 0.32);     // Deep midnight cobalt
      vec3 cElectricCyan = vec3(0.0, 0.85, 1.0);    // Searing neon cyan rail
      vec3 cWhiteLightning = vec3(0.85, 0.98, 1.0); // White-hot electrical surge

      vec3 color = mix(cDeepNavy, vec3(0.03, 0.22, 0.65), ndl);
      color += cElectricCyan * (packet * 1.8 + fresnel * 0.95);
      color += cWhiteLightning * fastSpark * 2.2;
      color += vec3(0.7, 0.9, 1.0) * spec * 0.6;
      color += cElectricCyan * railGroove * 0.25;

      // Precise corridor visibility from brainstem descent (uCameraZ < -5.0) down to heart entry (vWorldPos.z > -33.5)
      float fadeIn = smoothstep(-4.5, -8.0, uCameraZ);
      float fadeOut = smoothstep(-34.0, -30.5, vWorldPos.z);
      float conduitFade = clamp(fadeIn * fadeOut, 0.0, 1.0);

      float tubeFade = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
      color *= (1.0 - vFogFactor) * conduitFade;

      float alpha = clamp(0.85 + packet * 0.3 + fastSpark * 0.3, 0.0, 1.0) * tubeFade * conduitFade * (1.0 - vFogFactor);
      gl_FragColor = vec4(color, alpha);
    }
  `,
};

// Translucent Outer Perineurium Sheath Shader
const PerineuriumSheathShader = {
  uniforms: {
    uTime: { value: 0 },
    uCameraZ: { value: 4.35 },
    fogDensity: { value: 0.032 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    uniform float fogDensity;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;

      float depth = -mvPosition.z;
      vFogFactor = 1.0 - exp(-fogDensity * fogDensity * depth * depth);
      vFogFactor = clamp(vFogFactor, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vFogFactor;
    uniform float uTime;
    uniform float uCameraZ;

    void main() {
      vec3 viewDir = normalize(-vWorldPos);
      float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.5);

      float membraneWave = pow(sin(vUv.y * 20.0 - uTime * 10.0) * 0.5 + 0.5, 12.0);
      vec3 cGlow = vec3(0.0, 0.70, 1.0);

      vec3 color = cGlow * (membraneWave * 0.8 + fresnel * 0.75);

      float fadeIn = smoothstep(-4.5, -8.0, uCameraZ);
      float fadeOut = smoothstep(-34.0, -30.5, vWorldPos.z);
      float conduitFade = clamp(fadeIn * fadeOut, 0.0, 1.0);

      float alpha = (0.08 + fresnel * 0.22 + membraneWave * 0.15) * conduitFade * (1.0 - vFogFactor);
      gl_FragColor = vec4(color * (1.0 - vFogFactor), alpha);
    }
  `,
};

// Synaptic Spark Particle Stream along the Neural Conduit
function SynapticSparkParticles({ time }: { time: number }) {
  const count = 220;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      offs[i] = i / count;
      const pt = CORKSCREW_SPLINE.getPointAt(offs[i]).add(new THREE.Vector3(0, -0.55, 0));
      pos[i * 3] = pt.x;
      pos[i * 3 + 1] = pt.y;
      pos[i * 3 + 2] = pt.z;
    }
    return [pos, offs];
  }, []);

  const pointMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aOffset;
        varying float vAlpha;

        void main() {
          float t = fract(aOffset - uTime * 0.28);
          vAlpha = sin(t * 3.14159);

          vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (4.5 + sin(t * 12.0) * 2.0) * (20.0 / -mvPosition.z);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float glow = pow(1.0 - dist * 2.0, 2.0);
          vec3 sparkColor = mix(vec3(0.0, 0.95, 1.0), vec3(1.0, 0.98, 0.85), glow);
          gl_FragColor = vec4(sparkColor * 1.8, glow * vAlpha * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    pointMaterial.uniforms.uTime.value = time;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
      </bufferGeometry>
      <primitive object={pointMaterial} attach="material" />
    </points>
  );
}

function BiologicalNervePlexus({ time }: { time: number }) {
  const { camera } = useThree();
  const gangliaRef = useRef<THREE.InstancedMesh>(null);
  const gangliaDummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Compute continuous, twist-free parallel transport frame along CORKSCREW_SPLINE
  const { points, normals } = useMemo(() => {
    return computeBishopFrames(CORKSCREW_SPLINE, 120);
  }, []);

  // 2. Central Primary Cyber-Blue Core Conduit running slightly below camera
  const coreConduitGeo = useMemo(() => {
    const centerPoints = points.map((pt) => pt.clone().add(new THREE.Vector3(0, -0.55, 0)));
    const curve = new THREE.CatmullRomCurve3(centerPoints, false, "catmullrom", 0.35);
    return new THREE.TubeGeometry(curve, 140, 0.12, 8, false);
  }, [points]);

  // 3. Cyber Roller Coaster Twin Rails (Left & Right) + Glowing Neon Cross-Ties
  const leftRailGeo = useMemo(() => {
    const leftPoints = points.map((pt, k) =>
      pt.clone().addScaledVector(normals[k], -0.38).add(new THREE.Vector3(0, -0.55, 0))
    );
    const curve = new THREE.CatmullRomCurve3(leftPoints, false, "catmullrom", 0.35);
    return new THREE.TubeGeometry(curve, 140, 0.065, 8, false);
  }, [points, normals]);

  const rightRailGeo = useMemo(() => {
    const rightPoints = points.map((pt, k) =>
      pt.clone().addScaledVector(normals[k], 0.38).add(new THREE.Vector3(0, -0.55, 0))
    );
    const curve = new THREE.CatmullRomCurve3(rightPoints, false, "catmullrom", 0.35);
    return new THREE.TubeGeometry(curve, 140, 0.065, 8, false);
  }, [points, normals]);

  const crossTieGeometries = useMemo(() => {
    const geos: THREE.TubeGeometry[] = [];
    const step = 3;
    for (let k = 2; k < points.length - 2; k += step) {
      const pLeft = points[k].clone().addScaledVector(normals[k], -0.38).add(new THREE.Vector3(0, -0.55, 0));
      const pRight = points[k].clone().addScaledVector(normals[k], 0.38).add(new THREE.Vector3(0, -0.55, 0));
      const tieCurve = new THREE.CatmullRomCurve3([pLeft, points[k].clone().add(new THREE.Vector3(0, -0.55, 0)), pRight], false, "catmullrom", 0.1);
      geos.push(new THREE.TubeGeometry(tieCurve, 8, 0.04, 6, false));
    }
    return geos;
  }, [points, normals]);

  // 4. Cranial Brainstem Rootlets (Fila Radicularia) anchoring into medulla oblongata
  const rootletGeometries = useMemo(() => {
    const geos: THREE.TubeGeometry[] = [];
    const numRootlets = 10;
    const brainCenter = new THREE.Vector3(EYE_TARGET.x, EYE_TARGET.y, -16.50);
    const trunkEntry = CORKSCREW_SPLINE.getPointAt(0.04);

    for (let r = 0; r < numRootlets; r++) {
      const theta = (r * Math.PI * 2) / numRootlets;
      const spreadRad = 1.15 + 0.25 * Math.sin(r * 3.0);
      const anchor = new THREE.Vector3(
        brainCenter.x + Math.cos(theta) * spreadRad,
        brainCenter.y + 0.35 + Math.sin(theta * 2.0) * 0.25,
        brainCenter.z + Math.sin(theta) * spreadRad * 0.6 - 0.2
      );
      const mid = anchor.clone().lerp(trunkEntry, 0.48).add(new THREE.Vector3(
        Math.cos(theta) * 0.24,
        -0.22,
        0.12
      ));
      const c = new THREE.CatmullRomCurve3([anchor, mid, trunkEntry], false, "catmullrom", 0.5);
      geos.push(new THREE.TubeGeometry(c, 36, 0.075, 7, false));
    }
    return geos;
  }, []);

  // 5. Multi-Tiered Dendritic Arborization Trees branching laterally in 3D along descent
  const { arborGeometries, arborGangliaPositions, arborBoutonPositions } = useMemo(() => {
    const geos: THREE.TubeGeometry[] = [];
    const gangliaPos: THREE.Vector3[] = [];
    const boutonPos: THREE.Vector3[] = [];

    const branchU = [0.12, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.92];

    for (let b = 0; b < branchU.length; b++) {
      const u = branchU[b];
      const origin = CORKSCREW_SPLINE.getPointAt(u);
      const tangent = CORKSCREW_SPLINE.getTangentAt(u).normalize();
      const dirPrimary = new THREE.Vector3(
        Math.cos(b * 2.4),
        Math.sin(b * 1.8) * 0.5,
        Math.cos(b * 3.9)
      ).cross(tangent).normalize();

      // Primary branch
      const pFork = origin.clone().addScaledVector(dirPrimary, 1.35).add(new THREE.Vector3(0, -0.25, 0));
      const crvPrimary = new THREE.CatmullRomCurve3([origin, origin.clone().lerp(pFork, 0.5), pFork], false, "catmullrom", 0.4);
      geos.push(new THREE.TubeGeometry(crvPrimary, 24, 0.085, 6, false));

      // Ganglia soma at primary fork
      gangliaPos.push(pFork.clone());

      // Secondary branchlet A
      const dirChildA = dirPrimary.clone().applyAxisAngle(tangent, 0.65).add(new THREE.Vector3(0, -0.3, 0)).normalize();
      const pTipA = pFork.clone().addScaledVector(dirChildA, 1.1);
      const crvChildA = new THREE.CatmullRomCurve3([pFork, pTipA], false, "catmullrom", 0.4);
      geos.push(new THREE.TubeGeometry(crvChildA, 18, 0.055, 6, false));
      boutonPos.push(pTipA);

      // Secondary branchlet B
      const dirChildB = dirPrimary.clone().applyAxisAngle(tangent, -0.65).add(new THREE.Vector3(0, -0.2, 0)).normalize();
      const pTipB = pFork.clone().addScaledVector(dirChildB, 1.0);
      const crvChildB = new THREE.CatmullRomCurve3([pFork, pTipB], false, "catmullrom", 0.4);
      geos.push(new THREE.TubeGeometry(crvChildB, 18, 0.055, 6, false));
      boutonPos.push(pTipB);
    }

    return { arborGeometries: geos, arborGangliaPositions: gangliaPos, arborBoutonPositions: boutonPos };
  }, []);

  // 6. Cardiac Plexus Arborization: Nerves wrapping directly onto aorta and myocardium
  const { cardiacGeometries, cardiacTargets } = useMemo(() => {
    const targets = [
      new THREE.Vector3(0.38, -15.10, -32.6),  // Ascending aorta root
      new THREE.Vector3(0.85, -14.60, -32.0),  // Superior vena cava junction
      new THREE.Vector3(-0.45, -15.00, -32.8), // Pulmonary trunk anterior
      new THREE.Vector3(-0.68, -16.40, -33.4), // Left anterior descending groove
      new THREE.Vector3(0.72, -16.20, -33.2),  // Right coronary sulcus
      new THREE.Vector3(0.32, -17.20, -33.8),  // Right ventricular myocardium
      new THREE.Vector3(-0.78, -17.00, -33.9), // Left ventricular myocardium
      new THREE.Vector3(-0.15, -15.80, -33.1), // Conus arteriosus
      new THREE.Vector3(0.08, -18.20, -34.2),  // Apex cordis tendril
      new THREE.Vector3(-0.85, -15.60, -33.5), // Left atrial junction
    ];

    const trunkExit = CORKSCREW_SPLINE.getPointAt(0.96);
    const geos: THREE.TubeGeometry[] = [];

    for (let c = 0; c < targets.length; c++) {
      const target = targets[c];
      const mid = trunkExit.clone().lerp(target, 0.45).add(new THREE.Vector3(
        Math.sin(c * 2.1) * 0.35,
        Math.cos(c * 1.7) * 0.35,
        Math.sin(c * 3.4) * 0.25
      ));
      const crv = new THREE.CatmullRomCurve3([trunkExit, mid, target], false, "catmullrom", 0.5);
      geos.push(new THREE.TubeGeometry(crv, 36, 0.075, 7, false));
    }
    return { cardiacGeometries: geos, cardiacTargets: targets };
  }, []);

  // 7. Outer Ethereal Cyan Aura Sheath (Sleek 0.75 radius, 0 overdraw stall)
  const sheathGeo = useMemo(() => {
    return new THREE.TubeGeometry(CORKSCREW_SPLINE, 100, 0.75, 12, false);
  }, []);

  // 8. Materials
  const axonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 4.35 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: AxonFascicleShader.vertexShader,
      fragmentShader: AxonFascicleShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: true,
    });
  }, []);

  const sheathMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 4.35 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: PerineuriumSheathShader.vertexShader,
      fragmentShader: PerineuriumSheathShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }, []);

  const somaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 4.35 },
        fogDensity: { value: 0.032 },
      },
      vertexShader: NeuronSomaShader.vertexShader,
      fragmentShader: NeuronSomaShader.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }, []);

  // Initialize Ganglia InstancedMesh
  useEffect(() => {
    if (!gangliaRef.current) return;
    arborGangliaPositions.forEach((pos, i) => {
      gangliaDummy.position.copy(pos);
      gangliaDummy.scale.setScalar(0.16 + (i % 2 === 0 ? 0.04 : 0.02));
      gangliaDummy.rotation.set(i * 0.5, i * 0.3, 0);
      gangliaDummy.updateMatrix();
      gangliaRef.current!.setMatrixAt(i, gangliaDummy.matrix);
    });
    gangliaRef.current.instanceMatrix.needsUpdate = true;
  }, [arborGangliaPositions, gangliaDummy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      coreConduitGeo.dispose();
      leftRailGeo.dispose();
      rightRailGeo.dispose();
      crossTieGeometries.forEach((g) => g.dispose());
      rootletGeometries.forEach((g) => g.dispose());
      arborGeometries.forEach((g) => g.dispose());
      cardiacGeometries.forEach((g) => g.dispose());
      sheathGeo.dispose();
      axonMaterial.dispose();
      sheathMaterial.dispose();
      somaMaterial.dispose();
    };
  }, [
    coreConduitGeo,
    leftRailGeo,
    rightRailGeo,
    crossTieGeometries,
    rootletGeometries,
    arborGeometries,
    cardiacGeometries,
    sheathGeo,
    axonMaterial,
    sheathMaterial,
    somaMaterial,
  ]);

  // Uniform updates in 120 FPS render loop
  useFrame(() => {
    const camZ = camera.position.z;
    axonMaterial.uniforms.uTime.value = time;
    axonMaterial.uniforms.uCameraZ.value = camZ;
    sheathMaterial.uniforms.uTime.value = time;
    sheathMaterial.uniforms.uCameraZ.value = camZ;
    somaMaterial.uniforms.uTime.value = time;
    somaMaterial.uniforms.uCameraZ.value = camZ;

    // Ganglia subtle biological pulse
    if (gangliaRef.current) {
      arborGangliaPositions.forEach((pos, i) => {
        gangliaDummy.position.copy(pos);
        const pulse = Math.sin(time * 3.5 + i * 1.8) * 0.02;
        const scale = 0.16 + (i % 2 === 0 ? 0.04 : 0.02) + pulse;
        gangliaDummy.scale.setScalar(scale);
        gangliaDummy.rotation.y = time * 0.2 + i * 0.4;
        gangliaDummy.updateMatrix();
        gangliaRef.current!.setMatrixAt(i, gangliaDummy.matrix);
      });
      gangliaRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Central Superconducting Blue Energy Rail */}
      <mesh geometry={coreConduitGeo} material={axonMaterial} />

      {/* Cyber-Blue Roller Coaster Twin Guide Rails */}
      <mesh geometry={leftRailGeo} material={axonMaterial} />
      <mesh geometry={rightRailGeo} material={axonMaterial} />

      {/* Glowing Neon Roller Coaster Cross Ties / Rungs */}
      {crossTieGeometries.map((geo, idx) => (
        <mesh key={`tie-${idx}`} geometry={geo} material={axonMaterial} />
      ))}


      {/* Cranial rootlets anchoring into medulla oblongata */}
      {rootletGeometries.map((geo, idx) => (
        <mesh key={`rootlet-${idx}`} geometry={geo} material={axonMaterial} />
      ))}

      {/* Multi-tiered dendritic arborization trees branching in 3D */}
      {arborGeometries.map((geo, idx) => (
        <mesh key={`arbor-${idx}`} geometry={geo} material={axonMaterial} />
      ))}

      {/* Multipolar Ganglia Somas along descent */}
      <instancedMesh ref={gangliaRef} args={[undefined, undefined, arborGangliaPositions.length]}>
        <sphereGeometry args={[1, 14, 14]} />
        <primitive object={somaMaterial} attach="material" />
      </instancedMesh>

      {/* Cardiac plexus arborization wrapping onto heart myocardium & aorta */}
      {cardiacGeometries.map((geo, idx) => (
        <mesh key={`cardiac-${idx}`} geometry={geo} material={axonMaterial} />
      ))}

      {/* Synaptic terminal boutons (neuro-effector junctions) glowing on heart & arbor tips */}
      {[...cardiacTargets, ...arborBoutonPositions].map((target, idx) => (
        <mesh key={`bouton-${idx}`} position={target}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial
            color="#ffbb33"
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}

      {/* Bioluminescent action potential spark stream */}
      <SynapticSparkParticles time={time} />
    </group>
  );
}

// ============================================================================
// PHASE 3B & 3C: THE AUTHENTIC 3D ANATOMICAL HEART & CORONARY VASCULAR NETWORK
// High-detail ZBrush sculpted anatomical 3D model (/models/heart.glb)
// Multi-region PBR Shader:
// - Vivid Royal Cobalt Blue Vena Cava & Pulmonary Trunk
// - Arterial Scarlet Red Aorta & Aortic Arch with 3 Brachiocephalic Branch Tubes
// - Deep Plum/Burgundy Auricles
// - Fine-striated Crimson Myocardium with cellular wet sheen
// - 3D Catmull-Rom Branching Coronary Veins & Arteries hugging anterior ventricles
// Dual-stage physiological Lub-Dub ("dhak-dhak") systolic and diastolic pumping
// ============================================================================
useGLTF.preload("/models/heart.glb");

// Helper to generate a 3D Catmull-Rom vascular tube geometry
function createVascularTube(
  pts: [number, number, number][],
  radius: number,
  tubularSegments = 24,
  radialSegments = 8
) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

// 3D Branching Royal Cobalt Blue Coronary Veins & Superior Vena Cava Branch Conduits
const BLUE_VESSEL_BRANCHES: { pts: [number, number, number][]; r: number }[] = [
  // 1. Main Anterior Interventricular Vein (coursing down the anterior sulcus to apex)
  {
    pts: [
      [-0.10, 0.46, 0.91],
      [-0.06, 0.22, 0.94],
      [0.00, 0.00, 0.98],
      [0.06, -0.22, 0.98],
      [0.11, -0.44, 0.98],
      [0.16, -0.72, 0.92],
      [0.19, -1.02, 0.82],
      [0.16, -1.32, 0.70],
    ],
    r: 0.038,
  },
  // 2. Left Ventricular Diagonal Vein 1
  {
    pts: [
      [-0.05, 0.16, 0.95],
      [-0.20, -0.04, 0.98],
      [-0.38, -0.25, 0.97],
      [-0.55, -0.46, 0.93],
    ],
    r: 0.026,
  },
  // 3. Left Ventricular Sub-branch 1
  {
    pts: [
      [-0.20, -0.04, 0.98],
      [-0.27, -0.20, 0.99],
      [-0.35, -0.38, 0.96],
    ],
    r: 0.018,
  },
  // 4. Left Ventricular Diagonal Vein 2
  {
    pts: [
      [0.06, -0.20, 0.98],
      [-0.12, -0.38, 0.99],
      [-0.30, -0.58, 0.96],
      [-0.44, -0.78, 0.89],
    ],
    r: 0.024,
  },
  // 5. Left Ventricular Sub-branch 2
  {
    pts: [
      [-0.12, -0.38, 0.99],
      [-0.16, -0.54, 0.97],
      [-0.24, -0.70, 0.92],
    ],
    r: 0.016,
  },
  // 6. Right Ventricular Vein 1
  {
    pts: [
      [0.01, 0.22, 0.95],
      [0.20, 0.08, 0.96],
      [0.40, -0.12, 0.90],
      [0.54, -0.36, 0.80],
    ],
    r: 0.026,
  },
  // 7. Right Ventricular Sub-branch 1
  {
    pts: [
      [0.20, 0.08, 0.96],
      [0.32, -0.04, 0.93],
      [0.42, -0.22, 0.85],
    ],
    r: 0.018,
  },
  // 8. Right Ventricular Vein 2
  {
    pts: [
      [0.08, -0.30, 0.98],
      [0.24, -0.46, 0.93],
      [0.38, -0.66, 0.84],
    ],
    r: 0.022,
  },
  // 9. Apex Micro-Vein
  {
    pts: [
      [0.18, -1.02, 0.82],
      [0.24, -1.18, 0.76],
      [0.22, -1.34, 0.68],
    ],
    r: 0.016,
  },
  // 10. Superior Vena Cava Top Branch 1 (Right brachiocephalic vein conduit)
  {
    pts: [
      [-0.46, 1.40, 0.04],
      [-0.52, 1.70, 0.08],
      [-0.58, 1.98, 0.12],
    ],
    r: 0.068,
  },
  // 11. Superior Vena Cava Top Branch 2 (Left brachiocephalic vein conduit)
  {
    pts: [
      [-0.34, 1.36, -0.08],
      [-0.30, 1.64, -0.12],
      [-0.25, 1.92, -0.16],
    ],
    r: 0.058,
  },
  // 12. Pulmonary Artery Lateral Branch
  {
    pts: [
      [-0.60, 1.25, -0.02],
      [-0.80, 1.35, -0.05],
      [-1.02, 1.42, -0.08],
    ],
    r: 0.050,
  },
];

// 3D Branching Arterial Scarlet Red Coronary Arteries & Aortic Arch Branches
const RED_VESSEL_BRANCHES: { pts: [number, number, number][]; r: number }[] = [
  // 1. Left Anterior Descending Artery (coursing in tandem with anterior vein)
  {
    pts: [
      [-0.07, 0.44, 0.92],
      [-0.03, 0.20, 0.95],
      [0.03, -0.02, 0.98],
      [0.08, -0.24, 0.98],
      [0.13, -0.46, 0.98],
      [0.17, -0.74, 0.92],
    ],
    r: 0.025,
  },
  // 2. Right Coronary Artery Branch
  {
    pts: [
      [0.15, 0.35, 0.92],
      [0.35, 0.20, 0.88],
      [0.50, 0.00, 0.82],
      [0.58, -0.22, 0.74],
    ],
    r: 0.025,
  },
  // 3. Aortic Arch Branch 1: Brachiocephalic Trunk (with ascending bifurcation)
  {
    pts: [
      [0.04, 1.48, 0.08],
      [0.06, 1.72, 0.12],
      [0.08, 1.96, 0.16],
    ],
    r: 0.065,
  },
  {
    pts: [
      [0.08, 1.96, 0.16],
      [0.05, 2.16, 0.18],
    ],
    r: 0.042,
  },
  {
    pts: [
      [0.08, 1.96, 0.16],
      [0.13, 2.16, 0.14],
    ],
    r: 0.042,
  },
  // 4. Aortic Arch Branch 2: Left Common Carotid Artery
  {
    pts: [
      [0.18, 1.50, 0.04],
      [0.22, 1.76, 0.06],
      [0.26, 2.04, 0.08],
    ],
    r: 0.052,
  },
  // 5. Aortic Arch Branch 3: Left Subclavian Artery
  {
    pts: [
      [0.32, 1.44, -0.02],
      [0.38, 1.70, -0.03],
      [0.44, 1.98, -0.04],
    ],
    r: 0.050,
  },
  // 6. Right Pulmonary Vein Lateral Trunk
  {
    pts: [
      [0.55, 0.65, -0.15],
      [0.72, 0.72, -0.18],
      [0.92, 0.78, -0.20],
    ],
    r: 0.045,
  },
];

// Pre-merge 3D coronary vascular tube geometries at module evaluation for 0 runtime allocation
const MERGED_BLUE_VESSELS_GEO = typeof document !== "undefined"
  ? (() => {
    const geos = BLUE_VESSEL_BRANCHES.map((b) => createVascularTube(b.pts, b.r));
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return merged;
  })()
  : null;

const MERGED_RED_VESSELS_GEO = typeof document !== "undefined"
  ? (() => {
    const geos = RED_VESSEL_BRANCHES.map((b) => createVascularTube(b.pts, b.r));
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return merged;
  })()
  : null;

const addNearCameraDiscard = (mat: THREE.MeshStandardMaterial) => {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 vWorldPos;"
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;"
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 vWorldPos;"
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float distToCam = length(vWorldPos - cameraPosition);
      if (distToCam < 0.28) discard;`
    );
  };
};

const MAT_BLUE_VESSELS = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#1674dc"), // Royal Cobalt Blue
  roughness: 0.18,
  metalness: 0.14,
  emissive: new THREE.Color("#083478"),
  emissiveIntensity: 0.42,
});
addNearCameraDiscard(MAT_BLUE_VESSELS);

const MAT_RED_VESSELS = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#e62934"), // Arterial Scarlet Red
  roughness: 0.18,
  metalness: 0.10,
  emissive: new THREE.Color("#5e0a10"),
  emissiveIntensity: 0.42,
});
addNearCameraDiscard(MAT_RED_VESSELS);

function AnatomicalHeart({ cameraZ: _cameraZ }: { cameraZ: number; time: number }) {
  const { scene } = useGLTF("/models/heart.glb");
  const heartGroupRef = useRef<THREE.Group>(null);
  const heartMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Smooth continuous phase accumulator & velocity damper (0 jitter, continuous 120 FPS)
  const phaseRef = useRef(0);
  const boostRef = useRef(0);

  // Dynamic uniform driving systolic bio-fluorescence
  const customUniforms = useMemo(() => ({ uPulse: { value: 0 } }), []);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    let targetHeartMesh: THREE.Mesh | null = null;

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        targetHeartMesh = mesh;

        // Custom multi-region anatomical PBR shader material matching authentic reference image
        const hMat = new THREE.MeshStandardMaterial({
          roughness: 0.25,
          metalness: 0.08,
        });

        hMat.onBeforeCompile = (shader) => {
          shader.uniforms.uPulse = customUniforms.uPulse;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vLocalPos;\nvarying vec3 vWorldPos;"
          );
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvLocalPos = position;\nvWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;"
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vLocalPos;\nvarying vec3 vWorldPos;\nuniform float uPulse;"
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            `#include <color_fragment>
            // Discard fragments extremely close to camera lens to eliminate near-plane clipping & fill-rate stall
            float distToCam = length(vWorldPos - cameraPosition);
            if (distToCam < 0.28) discard;

            // Authentic multi-region anatomical coloring matching reference:
            // 1. Superior Vena Cava & Pulmonary Trunk: Royal Cobalt Blue
            // 2. Aortic Arch: Arterial Scarlet Red
            // 3. Auricles / Atria: Deep Plum Burgundy
            // 4. Ventricles: Rich Striated Crimson Myocardium

            float blueWeight = smoothstep(0.46, 0.58, vLocalPos.y) * smoothstep(0.02, -0.14, vLocalPos.x);
            float rPulmWeight = smoothstep(0.50, 0.65, vLocalPos.y) * smoothstep(-0.45, -0.20, vLocalPos.x) * smoothstep(0.3, -0.2, vLocalPos.z);
            blueWeight = clamp(blueWeight + rPulmWeight * 0.6, 0.0, 1.0);

            float aortaWeight = smoothstep(0.48, 0.62, vLocalPos.y) * smoothstep(-0.16, 0.02, vLocalPos.x);

            float auricleLeft = smoothstep(0.12, 0.35, vLocalPos.y) * smoothstep(0.65, 0.40, vLocalPos.y) * smoothstep(0.28, 0.55, vLocalPos.x);
            float auricleRight = smoothstep(0.12, 0.35, vLocalPos.y) * smoothstep(0.60, 0.38, vLocalPos.y) * smoothstep(-0.35, -0.60, vLocalPos.x);
            float auricleWeight = clamp(auricleLeft + auricleRight, 0.0, 1.0) * (1.0 - blueWeight) * (1.0 - aortaWeight);

            // Ventricular muscle fiber striations & micro-striations
            float striation = sin(vLocalPos.y * 65.0 + sin(vLocalPos.x * 24.0) * 1.8) * 0.5 + 0.5;
            float micro = sin(vLocalPos.y * 130.0 - vLocalPos.x * 35.0) * 0.5 + 0.5;
            vec3 ventCrimson = mix(vec3(0.72, 0.09, 0.13), vec3(0.88, 0.15, 0.20), striation * 0.65 + micro * 0.35);

            vec3 blueVessels = vec3(0.07, 0.42, 0.86); // Intense Royal Cobalt Blue
            vec3 aortaRed = vec3(0.92, 0.15, 0.16);    // Arterial Scarlet Red
            vec3 plumAuricle = vec3(0.42, 0.10, 0.16); // Deep Burgundy Plum

            vec3 anatomicalDiffuse = ventCrimson;
            anatomicalDiffuse = mix(anatomicalDiffuse, plumAuricle, auricleWeight);
            anatomicalDiffuse = mix(anatomicalDiffuse, aortaRed, aortaWeight);
            anatomicalDiffuse = mix(anatomicalDiffuse, blueVessels, blueWeight);

            diffuseColor.rgb = anatomicalDiffuse;`
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <roughnessmap_fragment>",
            `#include <roughnessmap_fragment>
            roughnessFactor = mix(0.26, 0.18, max(blueWeight, aortaWeight));`
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
            vec3 baseEmissive = mix(vec3(0.22, 0.01, 0.03), vec3(0.01, 0.08, 0.22), blueWeight);
            totalEmissiveRadiance += baseEmissive * (0.35 + uPulse * 1.4);`
          );
        };

        mesh.material = hMat;
        heartMaterialRef.current = hMat;
      }
    });

    if (targetHeartMesh) {
      if (MERGED_BLUE_VESSELS_GEO) {
        const blueMesh = new THREE.Mesh(MERGED_BLUE_VESSELS_GEO, MAT_BLUE_VESSELS);
        (targetHeartMesh as THREE.Mesh).add(blueMesh);
      }
      if (MERGED_RED_VESSELS_GEO) {
        const redMesh = new THREE.Mesh(MERGED_RED_VESSELS_GEO, MAT_RED_VESSELS);
        (targetHeartMesh as THREE.Mesh).add(redMesh);
      }
    }

    return clone;
  }, [scene, customUniforms]);

  useFrame((_, delta) => {
    if (!heartGroupRef.current) return;

    // Clamp delta time to guard against tab suspension frame spikes
    const dt = Math.min(delta, 0.04);

    // Natural physiological resting human heartbeat: ~67 BPM (1.12 Hz)
    const lenis = getLenis();
    const rawVel = lenis ? lenis.velocity : 0;
    const targetBoost = Math.min(Math.abs(rawVel) * 0.015, 0.20); // max +20% gentle rate boost
    boostRef.current = THREE.MathUtils.lerp(boostRef.current, targetBoost, dt * 3.0);

    const currentRate = 1.12 * (1.0 + boostRef.current);
    // Continuous delta integration ensures 100% smooth monotonic phase flow with zero jumps
    phaseRef.current = (phaseRef.current + dt * currentRate) % 1.0;
    const cycle = phaseRef.current;

    // Authentic two-stage biological Lub-Dub ("dhak-dhak") contraction:
    // 1. Systolic contraction (Lub): firm, realistic muscular contraction
    // 2. Diastolic rebound (Dub): closing of semilunar valves & chamber recoil
    // 3. Diastolic rest: calm anatomical pause
    let pulse = 0;
    if (cycle < 0.22) {
      pulse = Math.sin((cycle / 0.22) * Math.PI) * 0.075;
    } else if (cycle > 0.26 && cycle < 0.44) {
      const tDub = (cycle - 0.26) / 0.18;
      pulse = Math.sin(tDub * Math.PI) * 0.045;
    }

    const isNarrow = typeof window !== "undefined" && window.innerWidth < 768;
    const baseScale = isNarrow ? 2.3 : 3.2; // Perfectly proportioned so camera glides past without clipping
    heartGroupRef.current.scale.set(
      baseScale * (1.0 - pulse * 0.5),
      baseScale * (1.0 + pulse * 0.8),
      baseScale * (1.0 - pulse * 0.4)
    );
    // Subtle, gentle anatomical torsion during contraction
    heartGroupRef.current.rotation.z = -0.15 + pulse * 0.04;
    heartGroupRef.current.rotation.y = 0.35 + pulse * 0.03;

    // Update shader pulse uniform for dynamic systolic bio-luminescence
    customUniforms.uPulse.value = pulse * 12.0;

    MAT_BLUE_VESSELS.emissiveIntensity = 0.38 + pulse * 1.6;
    MAT_RED_VESSELS.emissiveIntensity = 0.38 + pulse * 1.6;
  });

  return (
    <group
      ref={heartGroupRef}
      position={[EYE_TARGET.x - 0.20, -16.0, -34.0]}
      rotation={[0.18, 0.35, -0.15]}
    >
      <primitive object={clonedScene} position={[0.15, -0.05, 0]} />
    </group>
  );
}

function BeatingHeart({ cameraZ, time }: { cameraZ: number; time: number }) {
  return (
    <Suspense fallback={null}>
      <AnatomicalHeart cameraZ={cameraZ} time={time} />
    </Suspense>
  );
}

// ============================================================================
// PHASE 3.5: THE SEQUENTIAL Z-AXIS BLOODSTREAM GALLERY
// Heavy red/dark arterial plasma fog corridor (Z: -95.0 to -186.0 at Y: -54.0)
// Software logos encountered ONE BY ONE in strict order:
// 1. Premiere Pro (Z: -105.0)
// 2. DaVinci Resolve (Z: -119.0)
// 3. Blender 3D (Z: -133.0)
// 4. Houdini FX (Z: -147.0)
// 5. After Effects - THE CLIMAX (Z: -168.0)
// ============================================================================

interface BloodstreamLogoItem {
  id: string;
  name: string;
  tag: string;
  url: string;
  position: [number, number, number];
  scale: [number, number];
  color: string;
  accent: string;
  isClimax?: boolean;
}

const BLOODSTREAM_LOGOS: BloodstreamLogoItem[] = [
  {
    id: "premiere",
    name: "Premiere Pro",
    tag: "NLE TIMELINE ARCHITECTURE // 64-BIT PRECISION",
    url: "/images/logos/premiere.png",
    position: [0.0, -16.0, -43.0],
    scale: [2.8, 2.8],
    color: "#9999ff",
    accent: "#e0d0ff",
  },
  {
    id: "davinci",
    name: "DaVinci Resolve",
    tag: "COLOR SCIENCE // 32-BIT FLOAT YRGB NODAL ENGINE",
    url: "/images/logos/davinci.png",
    position: [0.0, -16.0, -49.0],
    scale: [2.8, 2.8],
    color: "#ff5533",
    accent: "#ffaa33",
  },
  {
    id: "blender",
    name: "Blender 3D",
    tag: "SPATIAL SYNTHESIS // PROCEDURAL GEOMETRY NODES",
    url: "/images/logos/blender.png",
    position: [0.0, -16.0, -55.0],
    scale: [2.8, 2.8],
    color: "#ff8800",
    accent: "#44ddff",
  },
  {
    id: "houdini",
    name: "Houdini FX",
    tag: "PROCEDURAL DYNAMICS // PARTICLE & VOXEL SIMULATION",
    url: "/images/logos/houdini.png",
    position: [0.0, -16.0, -61.0],
    scale: [2.8, 2.8],
    color: "#ff6600",
    accent: "#ffd040",
  },
  {
    id: "aftereffects",
    name: "After Effects",
    tag: "MOTION DESIGN SYSTEM // COMPOSITING & KINETIC LOGIC",
    url: "/images/logos/aftereffects.png",
    position: [0.0, -16.00, -67.0],
    scale: [3.4, 3.4],
    color: "#d29bff",
    accent: "#ffffff",
    isClimax: true,
  },
];

// Arterial endothelial corridor tube wrapping around the bloodstream gallery
function ArteryCorridorTunnel({ time }: { time: number }) {
  const tunnelGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.20, -16.0, -33.2),
      new THREE.Vector3(0.00, -16.0, -43.0),
      new THREE.Vector3(0.00, -16.0, -50.0),
      new THREE.Vector3(0.00, -16.0, -57.0),
      new THREE.Vector3(0.00, -16.0, -64.0),
      new THREE.Vector3(0.05, -16.0, -71.0),
      new THREE.Vector3(0.18, -16.0, -78.0),
      new THREE.Vector3(0.265, -16.0, -88.0),
    ]);
    return new THREE.TubeGeometry(curve, 110, 8.2, 24, false);
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        fogDensity: { value: 0.042 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;
          // Subtle peristaltic arterial dilation
          float ripple = sin(pos.z * 0.45 + uv.y * 6.28) * 0.12;
          pos += normal * ripple;
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        uniform float uTime;

        void main() {
          // Sleek obsidian bio-vascular endothelial wall
          float pulse = sin(uTime * 1.8 - vUv.x * 16.0) * 0.5 + 0.5;
          vec3 cDark = vec3(0.010, 0.007, 0.012);     // Near obsidian bio-tissue
          vec3 cDeep = vec3(0.024, 0.012, 0.022);     // Deep midnight plum endothelium
          vec3 cVein = vec3(0.040, 0.085, 0.190);     // Radiant cyan-cobalt bio-luminescence
          vec3 cGlow = vec3(0.160, 0.024, 0.040);     // Subtle systolic warm pulse

          vec3 base = mix(cDark, cDeep, vUv.y);

          // Subtle bioluminescent vascular lattice running along the corridor
          float vascularGrid = pow(sin(vUv.x * 36.0 + sin(vWorldPos.z * 0.8) * 3.0) * 0.5 + 0.5, 8.0);
          base += cVein * vascularGrid * 0.35;
          base += cGlow * pow(pulse, 4.0) * 0.18;

          // Rushing arterial plasma streamlines & glowing exit surge (eliminates dead black void!)
          float exitSurge = smoothstep(-44.0, -33.2, vWorldPos.z);
          vec3 cArterialRed = vec3(0.65, 0.08, 0.14);
          float speedLines = pow(sin(vWorldPos.z * 1.8 - uTime * 14.0 + vUv.x * 12.0) * 0.5 + 0.5, 6.0);
          base += cArterialRed * exitSurge * 0.75 + vec3(1.0, 0.35, 0.35) * speedLines * exitSurge * 0.9;

          // Muscular striation ridges with sleek specular sheen
          float ridges = sin(vWorldPos.z * 5.0) * 0.05;
          base += vec3(0.015, 0.018, 0.028) * ridges;

          // Rim specular sheen
          float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.8);
          base += vec3(0.08, 0.10, 0.18) * rim * 0.22;

          // Sleek obsidian deep-space fog (#050206)
          float depth = gl_FragCoord.z / gl_FragCoord.w;
          float fogFactor = 1.0 - exp(-0.024 * 0.024 * depth * depth);
          fogFactor = clamp(fogFactor, 0.0, 1.0);
          vec3 fogColor = vec3(0.015, 0.008, 0.018);
          vec3 finalColor = mix(base, fogColor, fogFactor);

          // Smoothly dissolve arterial wall into pitch black obsidian void as it terminates (Z <= -78 to -84)
          if (vWorldPos.z < -78.0) {
            float exitFade = clamp((-vWorldPos.z - 78.0) / 4.0, 0.0, 1.0);
            finalColor = mix(finalColor, vec3(0.0), exitFade);
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      transparent: false,
    });
  }, []);

  useFrame(() => {
    if (material) material.uniforms.uTime.value = time;
  });

  return <mesh geometry={tunnelGeo} material={material} />;
}

// ============================================================================
// PHASE 4: VELOCITY-DRIVEN BLOODSTREAM PARTICLES (SECONDARY PHYSICS)
// Hundreds of erythrocytes (red blood cells) streaming through arterial space.
// Speed and relativistic Z-elongation track live Lenis scroll velocity.
// Settles into organic ambient zero-gravity drift when stationary.
// ============================================================================
function BloodstreamErythrocytes({ time }: { time: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 110;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Organic erythrocyte disc geometry: squashed sphere [1, 1, 0.3] mimicking authentic red blood cells
  const erythrocyteGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.18, 16, 16);
    geo.scale(1, 1, 0.3);
    return geo;
  }, []);
  const erythrocyteMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#e11d48",
      emissive: new THREE.Color("#9f1239"),
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
  }, []);

  // Pre-generate individual particle positions and dynamics
  const particleData = useMemo(() => {
    const data: {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      scale: number;
      rotX: number;
      rotY: number;
      rotZ: number;
      rotVelX: number;
      rotVelY: number;
      rotVelZ: number;
      driftSpeed: number;
      wobbleFreq: number;
      wobbleAmp: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const z = -33.2 - Math.random() * 42.0; // Spans seamlessly from heart exit Z: -33.2 to -75.2
      const angle = Math.random() * Math.PI * 2.0;
      const r = 0.5 + Math.pow(Math.random(), 0.75) * 3.4;
      const x = EYE_TARGET.x + Math.cos(angle) * r;
      const y = -16.0 + Math.sin(angle) * (r * 0.75);

      data.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        scale: 0.24 + Math.random() * 0.22,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotVelX: (Math.random() - 0.5) * 1.5,
        rotVelY: (Math.random() - 0.5) * 1.7,
        rotVelZ: (Math.random() - 0.5) * 1.1,
        driftSpeed: 0.8 + Math.random() * 1.2,
        wobbleFreq: 1.0 + Math.random() * 2.0,
        wobbleAmp: 0.12 + Math.random() * 0.18,
      });
    }
    return data;
  }, []);

  // Initialize instances at their true bloodstream corridor positions (Z <= -36.0, Y = -16.0)
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const p = particleData[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particleData, dummy]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Live Lenis scroll velocity coupling
    const lenis = getLenis();
    const rawVel = lenis ? lenis.velocity : 0;
    const absVel = Math.abs(rawVel);

    // Dynamic flow speed: ambient drift (0.6) + velocity surge
    const flowMultiplier = 0.6 + Math.min(absVel * 0.08, 14.0);
    // Relativistic warp elongation along Z during high-speed travel
    const warpStretchZ = 1.0 + Math.min(absVel * 0.06, 3.2);

    const camZ = state.camera.position.z;
    // Strict corridor visibility: only visible inside the bloodstream corridor (Z: -28 to -88)
    const inCorridor = camZ <= -28.0 && camZ >= -88.0;
    meshRef.current.visible = inCorridor;
    if (!inCorridor) return;

    for (let i = 0; i < count; i++) {
      const p = particleData[i];

      // Stream particles forward relative to camera motion
      p.z += delta * p.driftSpeed * flowMultiplier * 4.5;

      // Recycle particles strictly inside bloodstream corridor (Z: -29 to -68)
      if (p.z > camZ + 6.0) {
        p.z -= 37.0;
      } else if (p.z < -68.0) {
        p.z += 37.0;
      }
      if (p.z < -69.0) {
        p.z = -29.0 - Math.random() * 37.0;
      }

      // Organic fluid wobble in X-Y
      const wobbleX = Math.sin(time * p.wobbleFreq + i) * p.wobbleAmp;
      const wobbleY = Math.cos(time * (p.wobbleFreq * 0.8) + i) * p.wobbleAmp;

      // Part cells away from the central letter fly-through corridor (Z: -64 to -68)
      let offsetX = wobbleX;
      let offsetY = wobbleY;
      if (p.z < -64.0 && p.z > -68.0) {
        const dy = Math.abs(p.baseY - (-16.0));
        if (dy < 1.8) {
          offsetY += (p.baseY >= -16.0 ? 1 : -1) * (1.8 - dy) * 0.85;
        }
      }

      dummy.position.set(p.baseX + offsetX, p.baseY + offsetY, p.z);

      // Tumbling rotation
      p.rotX += p.rotVelX * (1.0 + absVel * 0.02) * delta;
      p.rotY += p.rotVelY * (1.0 + absVel * 0.02) * delta;
      p.rotZ += p.rotVelZ * delta;
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);

      // Smoothly dissolve cell scale to 0 before approaching watch face (Z <= -65 to -69)
      let scaleMult = 1.0;
      if (p.z < -65.0) {
        scaleMult = Math.max(0.0, 1.0 - ((-p.z - 65.0) / 4.0));
      }

      // Scale with velocity warp stretch along Z (base disc squashed via geo.scale)
      dummy.scale.set(p.scale * scaleMult, p.scale * scaleMult, p.scale * warpStretchZ * scaleMult);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[erythrocyteGeo, erythrocyteMat, count]}
      frustumCulled={false}
      visible={false}
    />
  );
}

// Pre-generate crisp canvas textures for logo badge labels (0 CPU geometry overhead)
const BADGE_LABEL_TEXTURES: Record<string, THREE.CanvasTexture> = {};

function getBadgeLabelTexture(text: string): THREE.CanvasTexture {
  if (typeof document === "undefined") return new THREE.CanvasTexture({} as HTMLCanvasElement);
  if (BADGE_LABEL_TEXTURES[text]) return BADGE_LABEL_TEXTURES[text];
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "bold 44px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
    ctx.shadowBlur = 14;
    ctx.fillText(text, 256, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  BADGE_LABEL_TEXTURES[text] = tex;
  return tex;
}

// Pre-warm all badge labels immediately on load for zero mid-scroll canvas allocations
if (typeof document !== "undefined") {
  [
    "PREMIERE PRO",
    "DAVINCI RESOLVE",
    "BLENDER 3D",
    "HOUDINI FX",
    "AFTER EFFECTS",
  ].forEach(getBadgeLabelTexture);
}

// ============================================================================
// HIGH-FIDELITY SOFTWARE LOGO BADGE
// Ultra-sharp 16x anisotropic filtering, true sRGB color fidelity,
// sleek obsidian glass backplate, luminous glowing frame & 3D title.
// ============================================================================
function HighFidelityLogoBadge({
  item,
  time,
}: {
  item: BloodstreamLogoItem;
  time: number;
}) {
  const texture = useTexture(item.url);

  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // Subtle floating levitation
  const floatY = Math.sin(time * 1.2 + item.position[2] * 0.1) * 0.12;

  // Gentle inward perspective tilt so logos directly face the center corridor camera
  const { size } = useThree();
  const isNarrow = size.width < 768 || size.width / size.height < 1.0;
  const isMobilePortrait = size.width < 540 || size.width / size.height < 0.68;

  const tiltY = isMobilePortrait
    ? 0
    : item.position[0] < EYE_TARGET.x - 0.5
      ? 0.22
      : item.position[0] > EYE_TARGET.x + 0.5
        ? -0.22
        : 0;

  // Calibrated scale & positioning ensuring 100% visibility on Samsung Galaxy S23 & desktop
  const baseBadgeScale = isMobilePortrait ? 0.26 : isNarrow ? 0.42 : 0.65;
  const posX = 0.0;

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    const camZ = camera.position.z;
    const itemZ = item.position[2];
    const distZ = camZ - itemZ;

    if (distZ <= 0.3) {
      // Camera passed through the emblem: hide cleanly
      groupRef.current.visible = false;
    } else if (distZ < 1.8) {
      groupRef.current.visible = true;
      // Smooth holographic dissolve as camera passes through
      const alpha = Math.max(0, Math.min(1, (distZ - 0.3) / 1.5));
      // Subtle outward expansion as entering a light portal
      const dynamicScale = baseBadgeScale * (1.0 + (1.0 - alpha) * 0.18);
      groupRef.current.scale.setScalar(dynamicScale);

      // Smoothly fade all materials
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as any;
          if (mat) {
            mat.transparent = true;
            if (child.userData.baseOp === undefined) {
              child.userData.baseOp = mat.opacity !== undefined ? mat.opacity : 1.0;
            }
            mat.opacity = child.userData.baseOp * alpha;
          }
        }
      });
    } else {
      groupRef.current.visible = true;
      groupRef.current.scale.setScalar(baseBadgeScale);
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as any;
          if (mat && child.userData.baseOp !== undefined) {
            mat.opacity = child.userData.baseOp;
          }
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={[posX, item.position[1] + floatY, item.position[2]]}
      rotation={[0, tiltY, 0]}
      scale={[baseBadgeScale, baseBadgeScale, baseBadgeScale]}
    >
      {/* 1. Sleek Obsidian Glass Backplate */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshStandardMaterial
          color="#060205"
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 2. Luminous Cyber Border (Accent Color) */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[3.24, 3.24]} />
        <meshBasicMaterial
          color={item.color}
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* 3. Outer Glowing Rim Frame */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[3.36, 3.36]} />
        <meshBasicMaterial
          color={item.color}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Razor-Sharp High-Fidelity Logo Quad (SRGB, Anisotropic 16x, Unclamped) */}
      <mesh position={[0, 0.15, 0]}>
        <planeGeometry args={[2.3, 2.3]} />
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. Crisp Cybernetic Specification Subtitle (0 Geometry Overhead) */}
      <mesh position={[0, -1.22, 0.02]}>
        <planeGeometry args={[2.5, 0.55]} />
        <meshBasicMaterial
          map={getBadgeLabelTexture(item.name.toUpperCase())}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. Signature Brand Ambient Point Light illuminating arterial walls */}
      <pointLight
        position={[0, 0, 1.4]}
        color={item.color}
        intensity={item.isClimax ? 12.0 : 7.0}
        distance={item.isClimax ? 20 : 14}
      />

      {/* Climax Visual Halos for After Effects */}
      {item.isClimax && (
        <>
          <mesh position={[0, 0, -0.1]} rotation={[0, 0, time * 0.35]}>
            <ringGeometry args={[3.2, 3.8, 48]} />
            <meshBasicMaterial
              color="#d29bff"
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, -0.12]} rotation={[0, 0, -time * 0.25]}>
            <ringGeometry args={[4.2, 4.6, 48]} />
            <meshBasicMaterial
              color="#9933ff"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

function SoftwareBloodstream({ time }: { time: number }) {
  return (
    <group>
      {/* Heavy Red Arterial Vascular Tunnel */}
      <ArteryCorridorTunnel time={time} />

      {/* Sequential Software Gallery with High-Fidelity Badges */}
      {BLOODSTREAM_LOGOS.map((sw) => (
        <Suspense key={sw.id} fallback={null}>
          <HighFidelityLogoBadge item={sw} time={time} />
        </Suspense>
      ))}

      {/* Velocity-Driven Erythrocytes (Red Blood Cells) Particle System */}
      <BloodstreamErythrocytes time={time} />

      {/* PHASE 4.6: STANDALONE COLOSSAL MONOLITH TYPOGRAPHY (Z = -195.0) */}
      <ColossalBloodstreamMonolith time={time} />
    </group>
  );
}

// ============================================================================
// PHASE 4.6: COLOSSAL MONOLITH TYPOGRAPHY & STANDALONE FLY-THROUGH
// Decoupled from the AE logo, relocated down-tunnel to Z = -195.0.
// Massive architectural scale, perfectly flat on X-axis.
// ============================================================================
// PHASE 4.6 & 4.8: STANDALONE COLOSSAL MONOLITH TYPOGRAPHY (Z = -195.0)
// With Visceral Arterial Blood Splatters, Drips, and Droplets ("Khun ki Chitte")
// ============================================================================
function MonolithTextLine({
  text,
  textures,
  offsetY,
}: {
  text: string;
  textures: LineBloodTextures;
  offsetY: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uvsDone = useRef(false);

  // Compute UV mapping once when geometry mounts, zero useFrame overhead
  const onMeshMount = (mesh: THREE.Mesh | null) => {
    meshRef.current = mesh;
    if (!mesh || uvsDone.current) return;
    const geom = mesh.geometry;
    if (!geom || !geom.attributes.position || !geom.attributes.uv) return;

    geom.computeBoundingBox();
    const bb = geom.boundingBox;
    if (!bb) return;

    const sizeX = Math.max(0.001, bb.max.x - bb.min.x);
    const sizeY = Math.max(0.001, bb.max.y - bb.min.y);
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = (x - bb.min.x) / sizeX;
      const v = (y - bb.min.y) / sizeY;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
    uvsDone.current = true;
  };

  return (
    <group position={[0, offsetY, 0]}>
      <Suspense fallback={null}>
        <Center>
          <Text3D
            ref={onMeshMount}
            font="/fonts/bold.json"
            size={0.92}
            height={0.28}
            curveSegments={3}
            bevelEnabled
            bevelThickness={0.04}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={1}
            letterSpacing={0.06}
          >
            {text}
            <meshStandardMaterial
              color="#ececf0"
              map={textures.diffuseMap}
              roughnessMap={textures.roughnessMap}
              bumpMap={textures.bumpMap}
              bumpScale={0.034}
              emissiveMap={textures.emissiveMap}
              emissive="#ffffff"
              emissiveIntensity={1.2}
              roughness={0.28}
              metalness={0.10}
              toneMapped={true}
            />
          </Text3D>
        </Center>
      </Suspense>
    </group>
  );
}

// Visceral 3D Blood Droplets & Tears: Single InstancedMesh (Zero Transmission overhead, 1 Draw Call)
function VisceralBloodDroplets() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const droplets = useMemo(() => {
    let seed = 77123;
    const rnd = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const list: Array<{ x: number; y: number; z: number; rx: number; ry: number; rz: number }> = [];

    // Droplets clinging below Line 1 ("AFTER EFFECTS", Y ~ +0.75, span X: -4.5 to +4.5)
    for (let i = 0; i < 24; i++) {
      const x = (rnd() - 0.5) * 8.4;
      const y = 0.75 - 0.48 - rnd() * 0.45;
      const z = 0.12 + rnd() * 0.28;
      const r = 0.025 + rnd() * 0.045;
      list.push({ x, y, z, rx: r, ry: r * (1.3 + rnd() * 0.8), rz: r * 0.85 });
    }

    // Heavy visceral droplets and drips below Line 2 ("IS IN MY BLOOD.", Y ~ -0.75)
    for (let i = 0; i < 32; i++) {
      const x = rnd() > 0.35 ? 0.6 + rnd() * 3.8 : (rnd() - 0.5) * 8.6;
      const y = -0.75 - 0.48 - rnd() * 0.65;
      const z = 0.12 + rnd() * 0.32;
      const r = 0.032 + rnd() * 0.06;
      list.push({ x, y, z, rx: r, ry: r * (1.4 + rnd() * 1.0), rz: r * 0.85 });
    }

    return list;
  }, []);

  const dropletGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 10), []);
  const dropletMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#420004",
        emissive: new THREE.Color("#1c0002"),
        emissiveIntensity: 0.6,
        roughness: 0.08,
        metalness: 0.15,
        toneMapped: true,
      }),
    []
  );

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < droplets.length; i++) {
      const d = droplets[i];
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(d.rx, d.ry, d.rz);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [droplets, dummy]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[dropletGeo, dropletMat, droplets.length]}
      frustumCulled={false}
    />
  );
}

function ColossalBloodstreamMonolith({ time }: { time: number }) {
  const { size } = useThree();
  const isNarrow = size.width < 768 || size.width / size.height < 1.0;
  const mobileScale = isNarrow
    ? Math.max(0.20, Math.min(0.24, (size.width / size.height) * 0.50))
    : 1.0;

  // Ultra-subtle monolithic breathing pulse
  const subtleScale = (1.0 + Math.sin(time * 0.6) * 0.005) * mobileScale;

  // Authentic procedural arterial blood splatter textures for Line 1 and Line 2
  const monolithTextures: MonolithBloodTextures = useMemo(() => getMonolithBloodTextures(), []);

  return (
    <group position={[EYE_TARGET.x, -16.00, -80.0]} scale={[subtleScale, subtleScale, 1.0]}>
      {/* Line 1: Colossal Monolith Upper Line - AFTER EFFECTS */}
      <MonolithTextLine
        text="AFTER EFFECTS"
        textures={monolithTextures.line1}
        offsetY={0.75}
      />

      {/* Line 2: Colossal Monolith Lower Line - IS IN MY BLOOD. */}
      <MonolithTextLine
        text="IS IN MY BLOOD."
        textures={monolithTextures.line2}
        offsetY={-0.75}
      />

      {/* 3D Physical Suspended Blood Droplets and Viscous Gravity Tears */}
      <VisceralBloodDroplets />

      {/* Frontal Key Fill: calibrated illumination ensuring pristine readability and sharp blood contrast */}
      <pointLight
        position={[0, 0, 8.5]}
        intensity={18.0}
        color="#ffffff"
        distance={26}
      />

      {/* Core Backlight: warm arterial glow flooding between letter gaps (confined before watch) */}
      <pointLight
        position={[0, 0, -3.5]}
        intensity={28.0}
        color="#ff1a4a"
        distance={14}
      />

      {/* Side Rim Backlights: crisp edge specular glints (confined before watch) */}
      <pointLight
        position={[-7.0, 0, -4.0]}
        intensity={24.0}
        color="#c0f0ff"
        distance={14}
      />
      <pointLight
        position={[7.0, 0, -4.0]}
        intensity={24.0}
        color="#c0f0ff"
        distance={14}
      />

      {/* Overhead Rim Light */}
      <pointLight
        position={[0, 4.5, 0.5]}
        intensity={18.0}
        color="#ffffff"
        distance={20}
      />
    </group>
  );
}

// ============================================================================
// CINEMATIC LIGHTING RIG (FULL-SPECTRUM ADAPTIVE)
// ============================================================================
function CinematicLighting() {
  return (
    <>
      <ambientLight intensity={0.04} color="#040103" />
      <directionalLight position={[4.0, 3.5, 4.0]} intensity={4.2} color="#FFA040" />
      <directionalLight position={[-4.0, -2.0, 1.0]} intensity={1.8} color="#4A75A0" />
      <directionalLight
        position={[EYE_TARGET.x + 1.2, EYE_TARGET.y + 2.0, 2.5]}
        intensity={2.8}
        color="#FFFFFF"
      />
      {/* Anatomical Brain illumination rig - balanced cinematic mood */}
      <directionalLight
        position={[EYE_TARGET.x + 2.0, EYE_TARGET.y + 3.0, -9.0]}
        intensity={1.4}
        color="#e6b8aa"
      />
      <directionalLight
        position={[EYE_TARGET.x - 2.5, EYE_TARGET.y - 1.2, -9.0]}
        intensity={0.9}
        color="#8ab0d4"
      />
      {/* Central cortex & hemisphere rim illumination */}
      <pointLight position={[EYE_TARGET.x - 2.8, EYE_TARGET.y + 0.5, -13.0]} intensity={14.0} color="#00f0ff" distance={22} />
      <pointLight position={[EYE_TARGET.x + 2.8, EYE_TARGET.y + 0.5, -13.0]} intensity={16.0} color="#ff7733" distance={22} />
      <pointLight position={[EYE_TARGET.x, EYE_TARGET.y + 3.5, -12.0]} intensity={1.6} color="#ffe2d0" distance={15} />

      {/* Bio-electric Convergence Chiasm illumination at Brainstem Entry (Z: -16.5) */}
      <pointLight position={[EYE_TARGET.x, EYE_TARGET.y + 0.6, -16.5]} intensity={18.0} color="#ffe6a0" distance={18} />

      {/* Phase 3: High-Contrast Anatomical Heart Cavern Studio Illumination */}
      {/* 1. High-CRI Cool White Key Light (Crisp specular glints, pristine anatomical realism) */}
      <pointLight position={[EYE_TARGET.x, -11.5, -31.5]} intensity={14.0} color="#ffffff" distance={26} />

      {/* 2. Vivid Royal Cobalt Blue Accent Light (Illuminates Superior Vena Cava & Coronary Veins) */}
      <pointLight position={[EYE_TARGET.x - 5.0, -13.5, -32.5]} intensity={16.0} color="#1e70d0" distance={25} />

      {/* 3. Warm Arterial Scarlet Rim Light (Highlights Aortic Arch & Right Ventricle) */}
      <pointLight position={[EYE_TARGET.x + 5.0, -14.0, -33.5]} intensity={11.0} color="#ff3344" distance={25} />

      {/* 4. Deep Obsidian Cavern Fill (Maintains high-contrast shadows & dramatic depth) */}
      <pointLight position={[EYE_TARGET.x, -18.5, -36.0]} intensity={3.5} color="#100818" distance={22} />

      {/* Phase 4: Downstream Bio-Vascular Gallery Corridor Illumination */}
      <pointLight position={[EYE_TARGET.x, -16.0, -46.0]} intensity={4.5} color="#1a2035" distance={24} />
      <pointLight position={[EYE_TARGET.x, -16.0, -58.0]} intensity={4.0} color="#221528" distance={24} />
    </>
  );
}

// ============================================================================
// MASTER SCENE CONTENT & CONTINUOUS 3D CAMERA CHOREOGRAPHY
// ============================================================================
interface SceneContentProps {
  scrollRef: React.MutableRefObject<number>;
  onBreachComplete?: () => void;
  onProgressTick?: (p: number) => void;
}

function SceneContent({ scrollRef, onBreachComplete, onProgressTick }: SceneContentProps) {
  const { camera, scene, gl } = useThree();
  const timeRef = useRef(0);
  const breachNotified = useRef(false);
  const dampedScrollRef = useRef(0);

  // Group refs for aggressive 120 FPS distance & frustum culling
  const eyeGroupRef = useRef<THREE.Group>(null);
  const irisTunnelRef = useRef<THREE.Group>(null);
  const neuralGroupRef = useRef<THREE.Group>(null);
  const brainGroupRef = useRef<THREE.Group>(null);
  const spineGroupRef = useRef<THREE.Group>(null);
  const heartGroupRef = useRef<THREE.Group>(null);
  const bloodstreamGroupRef = useRef<THREE.Group>(null);
  const watchGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.background = new THREE.Color("#000000");
    scene.fog = new THREE.FogExp2("#110000", 0.05);

    // Pre-compile all shaders and upload static buffers immediately on mount
    // Temporarily ensure all scene branches are visible so gl.compile touches all materials and lights
    // Guarantees 0ms shader compilation overhead when approaching AE and the Watch Dive
    if (eyeGroupRef.current) eyeGroupRef.current.visible = true;
    if (irisTunnelRef.current) irisTunnelRef.current.visible = true;
    if (neuralGroupRef.current) neuralGroupRef.current.visible = true;
    if (brainGroupRef.current) brainGroupRef.current.visible = true;
    if (spineGroupRef.current) spineGroupRef.current.visible = true;
    if (heartGroupRef.current) heartGroupRef.current.visible = true;
    if (bloodstreamGroupRef.current) bloodstreamGroupRef.current.visible = true;
    if (watchGroupRef.current) watchGroupRef.current.visible = true;

    try {
      gl.compile(scene, camera);
    } catch {
      // safe fallback
    }

    return () => {
      scene.fog = null;
    };
  }, [scene, camera, gl]);

  useFrame((state, delta) => {
    timeRef.current = state.clock.elapsedTime;

    // Phase 4: Frame-rate independent exponential smoothing for 120 FPS buttery motion
    // Smooths out wheel stepping and trackpad flick jitter with zero perceptible latency on slow drags
    const rawP = Math.max(0, Math.min(1, scrollRef.current));
    dampedScrollRef.current = THREE.MathUtils.damp(
      dampedScrollRef.current,
      rawP,
      18.0,
      delta
    );
    const p = THREE.MathUtils.clamp(dampedScrollRef.current, 0, 1);

    // CONTINUOUS 3D CAMERA POSE EVALUATION (Read directly from damped ref - 0 React renders)
    const pose = evalCameraPose(p);

    if (camera instanceof THREE.PerspectiveCamera) {
      // Responsive Mobile Portrait Aspect Compensation (Galaxy S23, iPhone, etc.)
      const aspect = camera.aspect;
      let targetX = pose.x;
      let targetLookX = pose.lookX;
      let targetZ = pose.z;
      let targetFov = pose.fov;

      if (aspect < 1.0) {
        // Compensation factor to maintain horizontal framing
        const aspectComp = Math.max(1.0, 0.92 / Math.max(0.38, aspect));

        // 1. Initial portrait rest and eye approach (p < 0.135):
        if (p < 0.135) {
          const t = Math.min(1.0, Math.max(0, (p - 0.02) / (0.135 - 0.02)));
          let blend = 1.0 - t;
          blend = blend * blend * (3.0 - 2.0 * blend);
          targetZ += (aspectComp - 1.0) * 2.85 * blend;
          targetFov += (aspectComp - 1.0) * 11.5 * blend;
        }

        // 2. Software Bloodstream Gallery (p: 0.58 -> 0.86):
        // Smooth Hermite FOV expansion for portrait aspect framing (0 jump)
        if (p >= 0.58 && p <= 0.86) {
          const tIn = Math.min(1.0, Math.max(0.0, (p - 0.58) / 0.05));
          const tOut = Math.min(1.0, Math.max(0.0, (0.86 - p) / 0.05));
          const blend = (tIn * tIn * (3.0 - 2.0 * tIn)) * (tOut * tOut * (3.0 - 2.0 * tOut));
          targetFov += 8.0 * blend;
        }
      }

      camera.position.set(targetX, pose.y, targetZ);
      camera.lookAt(targetLookX, pose.lookY, pose.lookZ);
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    } else {
      camera.position.set(pose.x, pose.y, pose.z);
      camera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
    }

    // Keep DOM typography and postprocessing synchronously locked to damped progress
    onProgressTick?.(p);

    const camZ = camera.position.z;

    // AGGRESSIVE DISTANCE & FRUSTUM CULLING (120 FPS ARCHITECTURE)
    // 1. Portrait Plane: Visible from start until camera breaches into neural cortex (camZ > -2.0)
    if (eyeGroupRef.current) {
      eyeGroupRef.current.visible = camZ > -2.0;
    }

    // 1b. 3D Iris Tunnel: ONLY visible when camera approaches & enters pupil (camZ <= 0.40 && camZ > -7.5)
    // Completely hidden when viewing portrait from front so no golden spiral ever peeks above!
    if (irisTunnelRef.current) {
      irisTunnelRef.current.visible = camZ <= 0.40 && camZ > -7.5;
    }

    // 2. Neural Pathway: Culled as soon as camera enters cortex (camZ < 0.5 && camZ > -8.4)
    if (neuralGroupRef.current) {
      neuralGroupRef.current.visible = camZ < 0.5 && camZ > -8.4;
    }

    // 3. Main Brain & Internal Hemispheres: Culled before eye approach (camZ < 0.5) or after spine plunge (camZ > -24.0)
    if (brainGroupRef.current) {
      brainGroupRef.current.visible = camZ < 0.5 && camZ > -24.0;
    }

    // 4. Biological Nerve Plexus & Hemisphere Convergence Chiasm:
    // Seamlessly active from brain canyon entry (camZ < -6.5) all the way through cardiac descent (camZ > -33.0).
    if (spineGroupRef.current) {
      spineGroupRef.current.visible = camZ < -6.5 && camZ > -33.0;
    }

    // 5. Beating Heart Cavern: Pre-warmed as soon as camera enters cortex (camZ <= -5.0 && camZ > -48.0)
    // Deep black fog completely obscures it until descent, but GPU keeps all shaders & buffers resident in VRAM!
    if (heartGroupRef.current) {
      heartGroupRef.current.visible = camZ <= -5.0 && camZ > -48.0;
    }

    // 6. Arterial Bloodstream, Logos & Monolith: Pre-warmed during nerve dive (camZ <= -22.0 && camZ > -92.0)
    // Guarantees zero-latency exit from heart into bloodstream!
    if (bloodstreamGroupRef.current) {
      bloodstreamGroupRef.current.visible = camZ <= -22.0 && camZ > -92.0;
    }

    // 7. Luxury Timepiece Dive: ONLY active during horology climax (camZ <= -65.0)
    if (watchGroupRef.current) {
      watchGroupRef.current.visible = camZ <= -65.0;
    }

    // VOLUMETRIC OBSIDIAN BIO-ATMOSPHERE FOG TRANSITION (Crisp contrast, 0 murky red haze)
    if (scene.fog instanceof THREE.FogExp2) {
      if (pose.z > -24.0) {
        scene.fog.color.set("#000000");
        scene.fog.density = 0.036;
      } else if (pose.z > -80.0) {
        const cavernT = THREE.MathUtils.clamp((-pose.z - 24.0) / 12.0, 0, 1);
        // Transition into sleek obsidian deep-space bio void (#050206) with crisp low density (0.024)
        const fogColor = new THREE.Color("#000000").lerp(new THREE.Color("#050206"), cavernT);
        scene.fog.color.copy(fogColor);
        scene.fog.density = THREE.MathUtils.lerp(0.036, 0.024, cavernT);
      } else {
        const watchT = THREE.MathUtils.clamp((-pose.z - 80.0) / 10.0, 0, 1);
        const fogColor = new THREE.Color("#050206").lerp(new THREE.Color("#000000"), watchT);
        scene.fog.color.copy(fogColor);
        scene.fog.density = THREE.MathUtils.lerp(0.024, 0.012, watchT);
      }
    }

    // Terminal breach notification
    if (pose.z <= -107.0 && !breachNotified.current) {
      breachNotified.current = true;
      onBreachComplete?.();
    } else if (pose.z > -10.0 && breachNotified.current) {
      breachNotified.current = false;
    }
  });

  return (
    <>
      <CinematicLighting />

      {/* Phase 1: Portrait & 3D Iris Tunnel */}
      <group ref={eyeGroupRef}>
        <PortraitPlane cameraZ={camera.position.z} />
      </group>
      <group ref={irisTunnelRef}>
        <IrisTunnel time={timeRef.current} />
      </group>

      {/* Phase 2: Neural Pathway routing into Main Brain */}
      <group ref={neuralGroupRef}>
        <NeuralPathway time={timeRef.current} />
      </group>

      {/* Phase 2.5: Main Brain Central Geometry & Hemispheres */}
      <group ref={brainGroupRef}>
        <MainBrainCortex cameraZ={camera.position.z} time={timeRef.current} />
        <LeftEditorLogicHemisphere cameraZ={camera.position.z} />
        <RightArtistCreativityHemisphere time={timeRef.current} />
      </group>

      {/* Phase 3A: Biological Nerve Plexus & Hemisphere Convergence Chiasm */}
      <group ref={spineGroupRef}>
        <HemisphereNeuralConvergence time={timeRef.current} />
        <BiologicalNervePlexus time={timeRef.current} />
      </group>

      {/* Phase 3B & 3C: The Colossal Beating Heart */}
      <group ref={heartGroupRef}>
        <BeatingHeart cameraZ={camera.position.z} time={timeRef.current} />
      </group>

      {/* Phase 3.5: Sequential Software Bloodstream Gallery & Pre-Mounted Monolith */}
      <group ref={bloodstreamGroupRef}>
        <SoftwareBloodstream time={timeRef.current} />
      </group>

      {/* Phase 5: Luxury Timepiece Dive (Z: -72 to -88) */}
      <group ref={watchGroupRef}>
        <LuxuryTimepieceDive scrollRef={scrollRef} />
      </group>
    </>
  );
}

// ============================================================================
// PHASE 4: MACRO CINEMATOGRAPHY (DEPTH OF FIELD POSTPROCESSING)
// Adds dynamic DepthOfField screen-space pass. Dynamically tracks focusDistance
// to the camera's lookAt target. Near-lens elements (like floating erythrocytes
// or neural nodes) heavily blur into creamy cinematic circular bokeh.
// ============================================================================
const DOF_DIR = new THREE.Vector3();
const DOF_TARGET = new THREE.Vector3();

function CinematicPostProcessing({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dofRef = useRef<any>(null);

  useFrame(() => {
    if (!dofRef.current) return;
    const p = scrollRef.current;

    // Upstream (eye, brain, heart, bloodstream, monolith) requires pristine clarity and 120 FPS maximum performance
    // Zero bokeh gathering when outside the macro caliber watch view, and bypassed on mobile for guaranteed 120 FPS
    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || (window.innerWidth / window.innerHeight) < 0.85);
    if (isMobile || p < 0.93) {
      if (dofRef.current.bokehScale !== 0) {
        dofRef.current.bokehScale = 0;
      }
      if (dofRef.current.enabled !== false) {
        dofRef.current.enabled = false;
      }
      return;
    }
    if (dofRef.current.enabled !== true) {
      dofRef.current.enabled = true;
    }

    // Smoothly engage macro caliber depth of field inside the timepiece (p >= 0.93)
    dofRef.current.bokehScale = 2.4;
    camera.getWorldDirection(DOF_DIR);

    if (p >= 0.9420 && p <= 0.9880) {
      // Macro Caliber beat: tack-sharp focus locked directly onto Hero Gold Barrel Gear arbor
      DOF_TARGET.set(-0.135, -15.58, -96.42);
    } else if (p > 0.9880) {
      // Climax typography exit plane
      DOF_TARGET.set(0.265, -16.00, -108.0);
    } else {
      DOF_TARGET.copy(camera.position).addScaledVector(DOF_DIR, 6.0);
    }

    if (dofRef.current.target) {
      dofRef.current.target.copy(DOF_TARGET);
    }
    const dist = dofRef.current.calculateFocusDistance(DOF_TARGET);
    if (dofRef.current.cocMaterial) {
      dofRef.current.cocMaterial.focusDistance = dist;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <DepthOfField
        ref={dofRef}
        target={[-0.135, -15.58, -96.42]}
        focalLength={0.060}
        bokehScale={0}
        width={1024}
        height={1024}
      />
      <Bloom
        mipmapBlur
        intensity={0.45}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.25}
      />
    </EffectComposer>
  );
}

// ============================================================================
// EXPORTED COMPONENT: ANATOMY INTRO SCENE (FULL CANOPY CONTROLLER)
// ============================================================================
export interface AnatomyIntroSceneProps {
  scrollProgress?: number;
  onBreachComplete?: () => void;
  onIntroComplete?: () => void;
  onExplorePortfolio?: () => void;
}

export function AnatomyIntroScene({
  scrollProgress: externalProgress,
  onBreachComplete,
  onIntroComplete: _onIntroComplete,
  onExplorePortfolio: _onExplorePortfolio,
}: AnatomyIntroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<number>(0);
  const [isGenesisActive, setIsGenesisActive] = useState(true);

  // DOM Typography overlay refs (peak during key narrative moments)
  const heroOverlayRef = useRef<HTMLDivElement>(null);
  const brainTitleRef = useRef<HTMLHeadingElement>(null);
  const brainSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heartTitleRef = useRef<HTMLHeadingElement>(null);
  const heartSubtitleRef = useRef<HTMLParagraphElement>(null);
  const watchOverlayRef = useRef<HTMLDivElement>(null);
  const watchTitleRef = useRef<HTMLHeadingElement>(null);
  const watchSubRef = useRef<HTMLParagraphElement>(null);

  const updateDomTypography = (p: number) => {
    const pose = evalCameraPose(p);

    // Step 0: Hero Opening Typography (Pristine framing at rest p in [0.00, 0.06])
    let heroOp = 0.0;
    if (p <= 0.02) {
      heroOp = 1.0;
    } else if (p < 0.06) {
      heroOp = 1.0 - (p - 0.02) / (0.06 - 0.02);
    }
    if (heroOverlayRef.current) {
      heroOverlayRef.current.style.opacity = String(heroOp);
      heroOverlayRef.current.style.visibility = heroOp > 0.01 ? "visible" : "hidden";
    }

    // Step 1: Brain Title Opacity
    let bTitleOp = 0.0;
    if (pose.y >= -5.0 && pose.z <= -9.0 && pose.z >= -16.5) {
      if (pose.z <= -11.0 && pose.z >= -14.5) bTitleOp = 1.0;
      else if (pose.z > -11.0) bTitleOp = (-pose.z - 9.0) / (11.0 - 9.0);
      else bTitleOp = (pose.z - -16.5) / (-14.5 - -16.5);
    }

    // Step 2: Brain Subtitle Opacity
    let bSubOp = 0.0;
    if (pose.y >= -5.0 && pose.z <= -11.0 && pose.z >= -16.0) {
      if (pose.z <= -12.5 && pose.z >= -14.5) bSubOp = 1.0;
      else if (pose.z > -12.5) bSubOp = (-pose.z - 11.0) / (12.5 - 11.0);
      else bSubOp = (pose.z - -16.0) / (-14.5 - -16.0);
    }

    // Step 3: Heart Title Opacity
    let hTitleOp = 0.0;
    if (pose.y <= -12.0 && pose.z <= -24.5 && pose.z >= -35.5) {
      if (pose.z <= -26.5 && pose.z >= -32.5) hTitleOp = 1.0;
      else if (pose.z > -26.5) hTitleOp = (-pose.z - 24.5) / (26.5 - 24.5);
      else hTitleOp = (pose.z - -35.5) / (-32.5 - -35.5);
    }

    // Step 4: Heart Subtitle Opacity
    let hSubOp = 0.0;
    if (pose.y <= -12.0 && pose.z <= -25.5 && pose.z >= -35.0) {
      if (pose.z <= -27.5 && pose.z >= -32.5) hSubOp = 1.0;
      else if (pose.z > -27.5) hSubOp = (-pose.z - 25.5) / (27.5 - 25.5);
      else hSubOp = (pose.z - -35.0) / (-32.5 - -35.0);
    }

    // Step 5: Watch Horology Climax "ALWAYS DELIVER ON TIME." (Photos 2, 3, 4)
    // Synchronized to threshold moment: section label crossfades in right as watch face fills frame
    let wOp = 0.0;
    let wY = 16.0;
    if (p >= 0.942 && p <= 0.998) {
      if (p >= 0.954 && p <= 0.990) {
        wOp = 1.0;
        wY = 0.0;
      } else if (p < 0.954) {
        const t = (p - 0.942) / (0.954 - 0.942);
        wOp = t;
        wY = (1.0 - t) * 16.0;
      } else {
        const t = (p - 0.990) / (0.998 - 0.990);
        wOp = 1.0 - t;
        wY = -t * 16.0;
      }
    }

    if (brainTitleRef.current) brainTitleRef.current.style.opacity = String(bTitleOp);
    if (brainSubtitleRef.current) brainSubtitleRef.current.style.opacity = String(bSubOp);
    if (heartTitleRef.current) heartTitleRef.current.style.opacity = String(hTitleOp);
    if (heartSubtitleRef.current) heartSubtitleRef.current.style.opacity = String(hSubOp);
    if (watchOverlayRef.current) {
      watchOverlayRef.current.style.opacity = String(wOp);
      watchOverlayRef.current.style.transform = `translateY(${wY}px)`;
      watchOverlayRef.current.style.visibility = wOp > 0.01 ? "visible" : "hidden";
    }
  };

  const [renderLoopActive, setRenderLoopActive] = useState(true);

  useEffect(() => {
    let last = getIsGenesisActive();
    const checkGenesis = () => {
      const active = getIsGenesisActive();
      if (active !== last) {
        last = active;
        setIsGenesisActive(active);
        if (containerRef.current) {
          if (!active) {
            containerRef.current.style.opacity = "0";
            containerRef.current.style.visibility = "hidden";
            containerRef.current.style.pointerEvents = "none";
          } else {
            containerRef.current.style.opacity = "1";
            containerRef.current.style.visibility = "visible";
          }
        }
      }
    };
    addFrameListener(checkGenesis);
    return () => removeFrameListener(checkGenesis);
  }, []);

  // Ensure render loop keeps firing smoothly during the 0.6s fade-out so there is zero freeze/glitch
  useEffect(() => {
    if (!isGenesisActive) {
      const timer = setTimeout(() => {
        setRenderLoopActive(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setRenderLoopActive(true);
    }
  }, [isGenesisActive]);

  // STRICT GSAP SCROLLTRIGGER TIED TO LENIS (Zero React State, updates scrollProgressRef & DOM styles directly)
  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: () => "+=" + getGenesisHeight(),
        scrub: true,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;

          // Container remains 100% solid & opaque through the watch and typography climax
          // Only at the very terminal 6000px threshold (p >= 0.998) does it execute a swift clean handoff
          if (containerRef.current) {
            if (self.progress >= 0.998) {
              const fade = Math.max(0, 1.0 - (self.progress - 0.998) / 0.002);
              containerRef.current.style.opacity = String(fade);
              if (fade <= 0.005) {
                containerRef.current.style.display = "none";
                containerRef.current.style.visibility = "hidden";
                containerRef.current.style.pointerEvents = "none";
              } else {
                containerRef.current.style.display = "block";
                containerRef.current.style.visibility = "visible";
              }
            } else {
              containerRef.current.style.display = "block";
              containerRef.current.style.opacity = "1";
              containerRef.current.style.visibility = "visible";
            }
          }
        },
      });

      return () => {
        trigger.kill();
      };
    },
    { scope: containerRef, dependencies: [isGenesisActive] }
  );

  useEffect(() => {
    if (externalProgress !== undefined) {
      const p = Math.max(0, Math.min(1, externalProgress));
      scrollProgressRef.current = p;
      updateDomTypography(p);
    }
  }, [externalProgress]);

  const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || "ontouchstart" in window);

  // Authoritative handoff: Genesis dissolves cleanly into Act 01 at 6000px / terminal progress
  const isPastIntro = !isGenesisActive;

  return (
    <div
      ref={containerRef}
      className="anatomy-intro-wrapper"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
        zIndex: 70,
        pointerEvents: "none",
        display: isPastIntro ? "none" : "block",
        opacity: isPastIntro ? 0 : 1,
        visibility: isPastIntro ? "hidden" : "visible",
      }}
    >
      {/* PURE CINEMATIC WEBGL CANVAS - 120 FPS OPTIMIZED */}
      <Canvas
        frameloop={renderLoopActive ? "always" : "never"}
        className="anatomy-webgl-canvas"
        camera={{ position: [0, 0, 4.35], fov: 45 }}
        gl={{
          antialias: !isMobile,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={isMobile ? [1, 1.1] : [1, 1.75]}
      >
        <SceneContent
          scrollRef={scrollProgressRef}
          onBreachComplete={onBreachComplete}
          onProgressTick={updateDomTypography}
        />
        {/* Environment reflections for desktop; lightweight three-point direct lighting for mobile 120 FPS */}
        {!isMobile ? (
          <Environment resolution={256}>
            {/* Warm Amber/Gold Studio Softbox (Top-Left Key) */}
            <mesh position={[-6, 7, 4]} scale={[8, 10, 1]}>
              <planeGeometry />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
            {/* Crisp High-Contrast Overhead Glare Strip */}
            <mesh position={[0, 9, 0]} scale={[12, 3, 1]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Cool Steel/Cyan Specular Rim Strip (Right-Bottom) */}
            <mesh position={[7, -5, -3]} scale={[6, 8, 1]}>
              <planeGeometry />
              <meshBasicMaterial color="#93c5fd" />
            </mesh>
            {/* Warm Secondary Fill (Front-Right) */}
            <mesh position={[5, 4, 6]} scale={[6, 6, 1]}>
              <planeGeometry />
              <meshBasicMaterial color="#fde68a" />
            </mesh>
          </Environment>
        ) : (
          <>
            <directionalLight position={[-6, 7, 4]} intensity={1.8} color="#fef08a" />
            <directionalLight position={[0, 9, 0]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[7, -5, -3]} intensity={1.5} color="#93c5fd" />
            <ambientLight intensity={0.6} />
          </>
        )}
        {/* Depth of Field Postprocessing: active on desktop, bypassed on mobile for steady 120 FPS */}
        {!isMobile && <CinematicPostProcessing scrollRef={scrollProgressRef} />}
      </Canvas>

      {/* DOM HERO OPENING TYPOGRAPHY OVERLAY: Phase 1 Resting Portrait */}
      <div
        ref={heroOverlayRef}
        className="anatomy-hero-overlay"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "clamp(1.2rem, 3.5vw, 2.5rem) clamp(1rem, 4vw, 3rem)",
          boxSizing: "border-box",
          zIndex: 85,
          pointerEvents: "none",
          transition: "opacity 0.2s ease",
        }}
      >
        {/* Top Header & Branding Block (Framed cleanly ABOVE the circular portrait) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "1400px",
          }}
        >
          {/* Top Telemetry Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "clamp(0.35rem, 1.0vh, 0.85rem)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "9999px",
                padding: "0.35rem 0.85rem",
                backdropFilter: "blur(12px)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#FF5F1F",
                  boxShadow: "0 0 8px #FF5F1F",
                }}
              />
              <span
                style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "clamp(0.65rem, 1.1vw, 0.78rem)",
                  letterSpacing: "0.14em",
                  color: "#e2e8f0",
                  textTransform: "uppercase",
                }}
              >
                00 / GENESIS PROLOGUE
              </span>
            </div>

            <div
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "clamp(0.65rem, 1vw, 0.75rem)",
                letterSpacing: "0.12em",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              SMPTE 00:00:00:00
            </div>
          </div>

          {/* Upper Title (Sitting cleanly in the upper space above the portrait) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "clamp(0.62rem, 1.1vw, 0.78rem)",
                letterSpacing: "0.22em",
                color: "#38bdf8",
                textTransform: "uppercase",
                marginBottom: "0.25rem",
                textShadow: "0 0 12px rgba(56, 189, 248, 0.6)",
              }}
            >
              PORTFOLIO // CRAFT & VISION
            </span>
            <h1
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "clamp(1.65rem, 5.2vw, 3.4rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#ffffff",
                margin: "0 0 0.25rem 0",
                textTransform: "uppercase",
                textShadow: "0 2px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 255, 255, 0.25)",
              }}
            >
              GUNEET BAWEJA
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(0.68rem, 1.2vw, 0.88rem)",
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "rgba(255, 255, 255, 0.72)",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              CINEMATIC VIDEO EDITOR & MOTION DESIGNER
            </p>
          </div>
        </div>

        {/* Lower Call to Action / Scroll Telemetry (Framed cleanly below the circular portrait) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "clamp(0.5rem, 1.5vh, 1.5rem)",
          }}
        >
          <p
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "clamp(0.7rem, 1.2vw, 0.85rem)",
              letterSpacing: "0.18em",
              color: "#ffaa33",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
              textShadow: "0 0 14px rgba(255, 170, 51, 0.6)",
            }}
          >
            THE ARCHITECTURE OF AN EDIT
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 1.2rem",
              background: "rgba(255, 95, 31, 0.08)",
              border: "1px solid rgba(255, 95, 31, 0.35)",
              borderRadius: "9999px",
              boxShadow: "0 0 20px rgba(255, 95, 31, 0.2)",
            }}
          >
            <span
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: "#FF5F1F",
                textTransform: "uppercase",
              }}
            >
              SCROLL TO DIVE
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF5F1F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anatomy-scroll-arrow"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* DOM TYPOGRAPHY OVERLAY: Phase 2 Brain Core Split */}
      <div
        className="anatomy-brain-text-overlay"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 80,
          pointerEvents: "none",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <h1
          ref={brainTitleRef}
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(2rem, 5.2vw, 4.4rem)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#ffffff",
            margin: "0 0 1rem 0",
            textTransform: "uppercase",
            opacity: 0,
            willChange: "opacity, transform",
            transform: "translateZ(0)",
            textShadow:
              "0 0 30px rgba(255, 255, 255, 0.45), 0 0 60px rgba(0, 240, 255, 0.35)",
          }}
        >
          THE ARCHITECTURE OF AN EDIT.
        </h1>

        <p
          ref={brainSubtitleRef}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "clamp(0.9rem, 2vw, 1.35rem)",
            fontWeight: 500,
            letterSpacing: "0.16em",
            color: "#ffb454",
            margin: 0,
            textTransform: "uppercase",
            opacity: 0,
            willChange: "opacity, transform",
            transform: "translateZ(0)",
            textShadow: "0 0 18px rgba(255, 180, 84, 0.6)",
          }}
        >
          Logic dictates the frame. Emotion dictates the cut.
        </p>
      </div>

      {/* DOM TYPOGRAPHY OVERLAY: Phase 3 The Beating Heart */}
      <div
        className="anatomy-heart-text-overlay"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 82,
          pointerEvents: "none",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <h1
          ref={heartTitleRef}
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(2.2rem, 5.5vw, 4.8rem)",
            fontWeight: 700,
            letterSpacing: "0.09em",
            color: "#ffffff",
            margin: "0 0 1.2rem 0",
            textTransform: "uppercase",
            opacity: 0,
            willChange: "opacity, transform",
            transform: "translateZ(0)",
            textShadow:
              "0 0 30px rgba(255, 30, 60, 0.8), 0 0 60px rgba(255, 60, 0, 0.5)",
          }}
        >
          EVERY CUT IS MADE WITH HEART.
        </h1>

        <p
          ref={heartSubtitleRef}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "clamp(0.95rem, 2.2vw, 1.4rem)",
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "#ff8866",
            margin: 0,
            textTransform: "uppercase",
            opacity: 0,
            willChange: "opacity, transform",
            transform: "translateZ(0)",
            textShadow: "0 0 20px rgba(255, 136, 102, 0.7)",
          }}
        >
          CRAFTED FROM PULSE AND INSTINCT.
        </p>
      </div>

      {/* DOM TYPOGRAPHY OVERLAY: Phase 4 Haute Horlogerie Climax (Photos 2, 3, 4) */}
      <div
        ref={watchOverlayRef}
        className="anatomy-watch-text-overlay"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "clamp(1.25rem, 4.5vw, 5.5rem)",
          boxSizing: "border-box",
          zIndex: 88,
          pointerEvents: "none",
          opacity: 0,
          visibility: "hidden",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          maxWidth: "1480px",
          margin: "0 auto",
          background:
            "radial-gradient(ellipse at 15% 85%, rgba(2, 6, 23, 0.72) 0%, rgba(2, 6, 23, 0.35) 45%, transparent 75%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            marginBottom: "0.75rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "32px",
              height: "2px",
              backgroundColor: "#f59e0b",
              boxShadow: "0 0 12px rgba(245, 158, 11, 0.9)",
            }}
          />
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "clamp(0.72rem, 1.2vw, 0.95rem)",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#fbbf24",
              textTransform: "uppercase",
              textShadow: "0 0 14px rgba(245, 158, 11, 0.6)",
            }}
          >
            04 — HOROLOGY & TEMPORAL DISCIPLINE
          </span>
        </div>

        <h1
          ref={watchTitleRef}
          style={{
            fontFamily: "Space Grotesk, Syne, sans-serif",
            fontSize: "clamp(1.65rem, 6.8vw, 5.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.015em",
            lineHeight: 1.05,
            color: "#ffffff",
            margin: "0 0 1.1rem 0",
            textTransform: "uppercase",
            textShadow:
              "0 0 40px rgba(255, 255, 255, 0.4), 0 0 80px rgba(245, 158, 11, 0.25), 0 4px 30px rgba(0, 0, 0, 0.95)",
          }}
        >
          ALWAYS DELIVER ON TIME.
        </h1>

        <p
          ref={watchSubRef}
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(1.0rem, 2.2vw, 1.45rem)",
            fontWeight: 600,
            letterSpacing: "0.10em",
            color: "#f1f5f9",
            margin: "0 0 0.55rem 0",
            textTransform: "uppercase",
            textShadow: "0 2px 20px rgba(0, 0, 0, 0.95)",
          }}
        >
          0 LATE DELIVERIES. 100% PRECISION. CRAFTED TO THE MILLISECOND.
        </p>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "rgba(255, 255, 255, 0.78)",
            margin: 0,
            textShadow: "0 2px 14px rgba(0, 0, 0, 0.95)",
          }}
        >
          Online showcases worthy of the maisons that keep the world's finest time.
        </p>
      </div>
    </div>
  );
}

export default AnatomyIntroScene;
