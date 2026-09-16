import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { scrollState } from "../../store/scrollState";
import { useMotionContext } from "../../lib/MotionContext";
import { ErrorBoundary } from "../global/ErrorBoundary";
import { getIsGenesisActive, addFrameListener, removeFrameListener } from "../../lib/lenis";
import "../../shaders/register";

// Act 03: The Continuous Film Shutter Tunnel into Work Showcase
import { Act08_TheFilm } from "./acts";

function isWebGLAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Master Camera Director (Phase 2: Single-Authority Camera Physics Engine)
 * ------------------------------------------------------------------------
 * Sole controller of camera trajectory, focal aim, and physical response.
 * - Base Transform: Deterministic narrative trajectory from SceneResolver
 * - Secondary Physical Response: Velocity momentum offset that naturally decays to 0
 * - Parallax: Smooth pointer parallax offset
 * - Jump Detection: Instantly snaps on arbitrary progress scrub (> 0.12 delta)
 */
function MasterCameraDirector() {
  const { camera } = useThree();

  if (typeof window !== "undefined") {
    (window as any).__debugCamera = camera;
  }

  // Mutable refs for zero allocation at 60fps
  const currentPos = useRef(new THREE.Vector3(0, 0, 6));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const basePos = useRef(new THREE.Vector3(0, 0, 6));
  const baseLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const velocityOffset = useRef(new THREE.Vector3(0, 0, 0));
  const velocityRotOffset = useRef(new THREE.Vector3(0, 0, 0));
  const pointerOffset = useRef(new THREE.Vector3(0, 0, 0));
  const lastProgress = useRef(0);
  const baseFov = 45;

  useFrame((_, delta) => {
    const act = scrollState.act;
    const masterP = scrollState.progress;
    const px = scrollState.pointer.x * 0.4;
    const py = scrollState.pointer.y * 0.3;

    // 1. Consume Deterministic Base Position & LookAt directly from SceneResolver
    const [bx, by, bz] = scrollState.resolved.cameraBasePos;
    const [lx, ly, lz] = scrollState.resolved.cameraBaseLookAt;
    basePos.current.set(bx, by, bz);
    baseLookAt.current.set(lx, ly, lz);

    // 2. Secondary Physical Camera Response (Phase 6: Bounded, Damped, Non-Cumulative)
    const [mx, my, mz] = scrollState.physics.cameraMomentum;
    const [rx, ry, rz] = scrollState.physics.cameraRotationOffset;
    const rumble = scrollState.physics.cameraRumble;

    // Bounded damping factor (prevents overshoot or numerical instability on tab switch)
    const dampFactor = Math.min(1.0, delta * 12.0);
    velocityOffset.current.x = THREE.MathUtils.lerp(velocityOffset.current.x, mx, dampFactor);
    velocityOffset.current.y = THREE.MathUtils.lerp(velocityOffset.current.y, my, dampFactor);
    velocityOffset.current.z = THREE.MathUtils.lerp(velocityOffset.current.z, mz, dampFactor);

    velocityRotOffset.current.x = THREE.MathUtils.lerp(velocityRotOffset.current.x, rx, dampFactor);
    velocityRotOffset.current.y = THREE.MathUtils.lerp(velocityRotOffset.current.y, ry, dampFactor);
    velocityRotOffset.current.z = THREE.MathUtils.lerp(velocityRotOffset.current.z, rz, dampFactor);

    // Pointer parallax damping
    const targetPx = (act === 2 || act === 9) ? px * 1.5 : px;
    const targetPy = (act === 2 || act === 9) ? py * 1.2 : py;
    pointerOffset.current.x = THREE.MathUtils.lerp(pointerOffset.current.x, targetPx, Math.min(1, delta * 6));
    pointerOffset.current.y = THREE.MathUtils.lerp(pointerOffset.current.y, targetPy, Math.min(1, delta * 6));

    // 3. Steadicam Camera Tracking with Jump Protection (Apple-Level Motion Quality)
    const jumpDistance = Math.abs(masterP - lastProgress.current);
    if (jumpDistance > 0.08) {
      currentPos.current.copy(basePos.current);
      currentLookAt.current.copy(baseLookAt.current);
      velocityOffset.current.set(0, 0, 0);
      velocityRotOffset.current.set(0, 0, 0);
    } else {
      // Steadicam cinematic tracking: physical mass filter eliminating discrete wheel micro-stutter
      const camDamp = Math.min(1.0, delta * 14.0);
      currentPos.current.lerp(basePos.current, camDamp);
      currentLookAt.current.lerp(baseLookAt.current, camDamp);
    }
    lastProgress.current = masterP;

    // Category C: Organic Ambient Steadicam Breathing (Never frozen)
    const [dx, dy, dz] = scrollState.ambient.cameraDrift;
    const [dPitch, dRoll] = scrollState.ambient.cameraTiltDrift;

    // 4. Apply Final Camera Transform
    // basePos (Cat A) + pointerOffset + velocityOffset (Cat B) + ambientDrift (Cat C) = finalCameraPosition
    // (Strictly non-cumulative: zero runaway drift, zero accumulation)
    camera.position.x = currentPos.current.x + pointerOffset.current.x + velocityOffset.current.x + dx;
    camera.position.y = currentPos.current.y + pointerOffset.current.y + velocityOffset.current.y + dy + rumble;
    camera.position.z = currentPos.current.z + velocityOffset.current.z + dz;

    // Reset base orientation to authoritative lookAt target
    camera.lookAt(currentLookAt.current);

    // Micro camera movement: pitch, yaw, roll (Cat B) + cranial tilt drift (Cat C) + rumble
    camera.rotation.x += velocityRotOffset.current.x + dPitch + rumble * 0.5;
    camera.rotation.y += velocityRotOffset.current.y;
    camera.rotation.z += velocityRotOffset.current.z + dRoll;

    // Dynamic FOV breath: wide-angle hyperspeed expansion during tunnel flight, settling cleanly to 45 for cinema
    if (camera instanceof THREE.PerspectiveCamera) {
      const tunnelFovBonus = masterP < 0.68 ? Math.sin((masterP / 0.68) * Math.PI) * 14.0 : 0;
      const targetFov = baseFov + scrollState.physics.fovOffset + tunnelFovBonus;
      if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dampFactor);
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}

/**
 * Atmospheric Scene Fog (Phase 6: Dynamic Atmospheric Response)
 * Thickens subtly during high-speed travel, relaxes to gentle ambient depth at rest.
 */
function AtmosphericFog() {
  const fogRef = useRef<THREE.FogExp2>(null);
  useFrame((_, delta) => {
    if (fogRef.current) {
      const targetDensity = 0.014 + scrollState.physics.fogDensityOffset;
      fogRef.current.density = THREE.MathUtils.lerp(
        fogRef.current.density,
        targetDensity,
        Math.min(1.0, delta * 8.0)
      );
    }
  });
  return <fogExp2 ref={fogRef} attach="fog" args={["#050608", 0.014]} />;
}

/**
 * Living Projector & Ambient Lighting (Category C: Light Breathing)
 * Dynamically tracks camera depth along the extended tunnel flight.
 */
function LivingSceneLighting() {
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    const shimmer = scrollState.ambient.lightBreathing;
    const camZ = camera.position.z;

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.5 * shimmer;
    }
    if (keyLightRef.current) {
      keyLightRef.current.position.set(3.5, 4.0, camZ + 3.0);
      keyLightRef.current.intensity = 40 * shimmer;
    }
    if (rimLightRef.current) {
      rimLightRef.current.position.set(-3.5, -3.0, camZ - 6.0);
      rimLightRef.current.intensity = 24 * shimmer;
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.5} />
      <pointLight ref={keyLightRef} position={[3.5, 4, 3]} intensity={40} color="#ffffff" />
      <pointLight ref={rimLightRef} position={[-3.5, -3, -6]} intensity={24} color="#FF5F1F" />
    </>
  );
}

/**
 * Ambient Dust Field (Category C: Living Atmospheric Particles)
 * Drifts continuously on gentle air currents in 3D camera space.
 * Continues 100% independently of user scrolling.
 */
function AmbientDustField({ isMobile }: { isMobile?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = isMobile ? 50 : 120;

  const { positions, seeds, basePos } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const base = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 16;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      s[i] = Math.random() * 100;
    }
    return { positions: pos, seeds: s, basePos: base };
  }, [COUNT]);

  useFrame(({ camera }) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const t = scrollState.ambient.clockTime;
    const camZ = camera.position.z;

    for (let i = 0; i < COUNT; i++) {
      const seed = seeds[i];
      // Subtle continuous Brownian/sine air current float
      const px = basePos[i * 3] + Math.sin(t * 0.4 + seed) * 0.6;
      const py = basePos[i * 3 + 1] + Math.cos(t * 0.35 + seed) * 0.4;
      // Cycle gently around camera depth
      const zRel = ((basePos[i * 3 + 2] + t * 0.2 + seed) % 18) - 9;
      const pz = camZ + zRel;

      posAttr.setXYZ(i, px, py, pz);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#FF5F1F"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Continuous 3D Universe with Isolated Suspense Boundaries
 * Stable mounting prevents asset unload/reload cycles and eliminates blackouts.
 * Each act manages its own Three.js group visibility in useFrame for maximum GPU efficiency.
 */
function ContinuousFilmScene({ isMobile }: { isMobile?: boolean }) {
  return (
    <>
      <MasterCameraDirector />
      <AtmosphericFog />
      <LivingSceneLighting />
      <AmbientDustField isMobile={isMobile} />

      {/* Act 03: The Continuous Film Shutter Tunnel into Work Showcase */}
      <Suspense fallback={null}>
        <Act08_TheFilm active={true} isMobile={isMobile} />
      </Suspense>
    </>
  );
}

/**
 * Dynamic Screen-Space Optical Polish (Phase 6: Bounded Physical Shader Response)
 * Intentionally amplifies chromatic aberration and bloom flares during high-speed velocity bursts.
 * Smoothly decays to clean filmic baseline when scrolling stops.
 */
function DynamicBloom() {
  const bloomRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (bloomRef.current) {
      // Optical anamorphic flash at Act 2 -> Act 3 threshold (master progress ~0.680)
      const p = scrollState.progress;
      const distToThreshold = Math.abs(p - 0.680);
      const opticalStreak = distToThreshold < 0.025
        ? Math.sin((1.0 - distToThreshold / 0.025) * Math.PI) * 0.85
        : 0.0;

      const targetIntensity = 0.7 + scrollState.physics.bloomBoost + opticalStreak;
      bloomRef.current.intensity = THREE.MathUtils.lerp(
        bloomRef.current.intensity,
        targetIntensity,
        Math.min(1.0, delta * 10.0)
      );
    }
  });

  return (
    <Bloom
      ref={bloomRef}
      intensity={0.7}
      luminanceThreshold={0.2}
      luminanceSmoothing={0.35}
      mipmapBlur
    />
  );
}

function DynamicPostprocessing() {
  const aberrationRef = useRef<any>(null);
  const currentOffset = useRef(new THREE.Vector2(0.0008, 0.0006));

  useFrame((_, delta) => {
    const p = scrollState.progress;
    const distToThreshold = Math.abs(p - 0.680);
    const opticalSplit = distToThreshold < 0.025
      ? Math.sin((1.0 - distToThreshold / 0.025) * Math.PI) * 0.0028
      : 0.0;

    const targetDispersion = scrollState.physics.chromaticAberration + opticalSplit;
    const targetX = targetDispersion;
    const targetY = targetDispersion * 0.75;

    currentOffset.current.x = THREE.MathUtils.lerp(currentOffset.current.x, targetX, Math.min(1.0, delta * 12.0));
    currentOffset.current.y = THREE.MathUtils.lerp(currentOffset.current.y, targetY, Math.min(1.0, delta * 12.0));

    if (aberrationRef.current && aberrationRef.current.offset) {
      aberrationRef.current.offset.set(currentOffset.current.x, currentOffset.current.y);
    }
  });

  return (
    <ChromaticAberration
      ref={aberrationRef}
      offset={[0.0008, 0.0006]}
      radialModulation={false}
      modulationOffset={0}
    />
  );
}

export function SceneCanvas() {
  const { lite, isMobile } = useMotionContext();
  const webglSupported = useMemo(() => isWebGLAvailable(), []);
  const [isGenesis, setIsGenesis] = useState(() => getIsGenesisActive());

  useEffect(() => {
    let last = getIsGenesisActive();
    const check = () => {
      const active = getIsGenesisActive();
      if (active !== last) {
        last = active;
        setIsGenesis(active);
      }
    };
    addFrameListener(check);
    return () => removeFrameListener(check);
  }, []);

  if (!webglSupported) {
    return null;
  }

  const isMobileDevice = isMobile || (typeof window !== "undefined" && (window.innerWidth < 768 || "ontouchstart" in window));
  const shouldDowngrade = lite || isMobileDevice;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#050608",
      }}
    >
      <ErrorBoundary name="SceneCanvas">
        <Canvas
          frameloop={isGenesis ? "never" : "always"}
          dpr={shouldDowngrade ? [1, 1.1] : [1, 1.75]}
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{
            antialias: !shouldDowngrade,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <color attach="background" args={["#050608"]} />

          <ContinuousFilmScene isMobile={shouldDowngrade} />

          {!shouldDowngrade && (
            <EffectComposer multisampling={0}>
              <DynamicBloom />
              <DynamicPostprocessing />
              <Noise opacity={0.025} />
              <Vignette eskil={false} offset={0.3} darkness={0.92} />
            </EffectComposer>
          )}
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
