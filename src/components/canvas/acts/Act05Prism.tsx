import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";

/**
 * Act05Prism (ACT 05: THE PRISM)
 * ------------------------------
 * Physical glass prism utilizing Drei's MeshTransmissionMaterial:
 * - High thickness (1.4), transmission: 1, IOR: 1.52 (optical crown glass).
 * - Procedural HDR Environment & luminous background particles for physical refraction.
 * - Scroll velocity drives dynamic chromatic aberration spikes (spectral RGB dispersion glitch).
 * - Eases smoothly back to slow, elegant idle rotation upon scroll stop.
 */
export function Act05Prism({
  active: _active,
  isMobile,
}: {
  active?: boolean;
  isMobile?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const prismMeshRef = useRef<THREE.Mesh>(null);
  const transmissionMatRef = useRef<any>(null);
  const physMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const edgesMatRef = useRef<THREE.LineBasicMaterial>(null);
  const particleGroupRef = useRef<THREE.Points>(null);
  const particleMatRef = useRef<THREE.PointsMaterial>(null);

  const mobileCheck =
    isMobile ??
    (typeof window !== "undefined" && window.innerWidth < 768);

  // Dynamic values tracked smoothly across frames
  const currentRotY = useRef(0);
  const currentRotZ = useRef(0);
  const currentAberration = useRef(0.15);
  const currentDistortion = useRef(0.2);

  // Background Particles for visible physical refraction (optimized count on mobile)
  const PARTICLE_COUNT = mobileCheck ? 60 : 240;

  const particleData = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const seeds = new Float32Array(PARTICLE_COUNT);

    const cAccent = new THREE.Color("#FF5F1F");
    const cCyan = new THREE.Color("#38bdf8");
    const cWhite = new THREE.Color("#ffffff");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2.4 + Math.random() * 5.0;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5.0;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius - 1.5; // positioned behind & around prism

      const colChoice = i % 3 === 0 ? cAccent : i % 3 === 1 ? cCyan : cWhite;
      cols[i * 3] = colChoice.r;
      cols[i * 3 + 1] = colChoice.g;
      cols[i * 3 + 2] = colChoice.b;

      seeds[i] = Math.random() * 50;
    }

    return { pos, cols, seeds };
  }, [PARTICLE_COUNT]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const isAct6 = scrollState.act === 6;
    const isAct5End = scrollState.act === 5 && scrollState.actProgress > 0.8;
    const isVisible = isAct6 || isAct5End;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }

    const p = isAct6 ? scrollState.actProgress : 0.0;

    // Optical blossom & dissolution exit envelope for Act 6 -> Act 7
    const exitP = Math.max(0, Math.min(1, (p - 0.70) / 0.30));
    const smoothExit = exitP * exitP * (3.0 - 2.0 * exitP);
    const alpha = 1.0 - smoothExit;

    if (alpha <= 0.001) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const vel = scrollState.velocity;
    const absVel = Math.abs(vel);
    const t = state.clock.elapsedTime;

    // 1. Scroll-Velocity Tied Chromatic Aberration & Distortion (Phase 6 Physical Response)
    // Optical dispersion increases dramatically as the camera dives into the optical core
    const targetAberration = 0.15 + Math.min(1.1, scrollState.physics.distortion * 3.5) + smoothExit * 1.5;
    currentAberration.current = THREE.MathUtils.lerp(
      currentAberration.current,
      targetAberration,
      Math.min(1, delta * 10)
    );

    const targetDistortion = 0.15 + Math.min(0.5, scrollState.physics.distortion * 1.8) + smoothExit * 0.4;
    currentDistortion.current = THREE.MathUtils.lerp(
      currentDistortion.current,
      targetDistortion,
      Math.min(1, delta * 8)
    );

    if (!mobileCheck && transmissionMatRef.current) {
      transmissionMatRef.current.chromaticAberration = currentAberration.current;
      transmissionMatRef.current.distortion = currentDistortion.current;
      transmissionMatRef.current.temporalDistortion = 0.1 + Math.min(0.3, absVel * 0.3);
      transmissionMatRef.current.transmission = Math.max(0, alpha);
    }

    if (physMatRef.current) {
      physMatRef.current.opacity = 0.85 * alpha;
      physMatRef.current.transmission = 0.9 * alpha;
    }

    if (edgesMatRef.current) {
      edgesMatRef.current.opacity = 0.5 * alpha;
    }

    if (particleMatRef.current) {
      particleMatRef.current.opacity = 0.85 * alpha;
    }

    // 2. Velocity-Responsive Rotation & Optical Aperture Expansion
    if (prismMeshRef.current) {
      // Deterministic base rotation directly from actProgress
      const baseRotY = p * Math.PI * 3.0 + Math.sin(t * 0.4) * 0.08;
      const baseRotZ = Math.sin(t * 0.8) * 0.06;

      // Dynamic velocity momentum decays naturally to 0 upon stop
      const targetMomentumY = scrollState.velocityIntensity * 0.65;
      const targetMomentumZ = scrollState.velocityIntensity * 0.30;
      currentRotY.current = THREE.MathUtils.lerp(
        currentRotY.current,
        targetMomentumY,
        Math.min(1, delta * 8)
      );
      currentRotZ.current = THREE.MathUtils.lerp(
        currentRotZ.current,
        targetMomentumZ,
        Math.min(1, delta * 8)
      );

      prismMeshRef.current.rotation.y = baseRotY + currentRotY.current;
      prismMeshRef.current.rotation.z = baseRotZ + currentRotZ.current;
      prismMeshRef.current.rotation.x =
        Math.sin(t * 0.6) * 0.08 + scrollState.pointer.y * 0.2;

      // Optical blossom: scale expands outwards as camera approaches
      const bloomScale = 1.0 + smoothExit * 1.6;
      const s = (1.0 + 0.03 * Math.sin(t * 2.5) + Math.min(0.08, absVel * 0.08)) * bloomScale;
      prismMeshRef.current.scale.set(s, s, s);
    }

    // 3. Orbiting Particles & Light Rays scattering forward toward camera
    if (particleGroupRef.current) {
      const speedMul = scrollState.physics.particleSpeedMultiplier;
      particleGroupRef.current.rotation.y = t * 0.12 * speedMul + scrollState.velocityIntensity * 0.35;
      particleGroupRef.current.position.z = smoothExit * 3.0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Procedural HDR Environment for Physical Light Refraction (Zero Network Overhead) */}
      <Environment resolution={256}>
        {/* Neon-Orange Key Light Plane */}
        <mesh position={[5, 4, -6]} scale={[6, 8, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#FF5F1F" />
        </mesh>
        {/* Cool Cyan Rim Light Plane */}
        <mesh position={[-6, -3, -5]} scale={[5, 6, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Stark White Overhead Glare Strip */}
        <mesh position={[0, 7, -4]} scale={[10, 2, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </Environment>

      {/* Floating Background Particles (Bent and Split by the Glass Prism) */}
      <points ref={particleGroupRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleData.cols, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={particleMatRef}
          size={0.06}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3-Sided Equilateral Optical Glass Prism */}
      <mesh ref={prismMeshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 3.2, 3, 1]} />

        {mobileCheck ? (
          /* Lightweight Physical Material for Mobile GPUs (Zero FBO Offscreen Passes) */
          <meshPhysicalMaterial
            ref={physMatRef}
            roughness={0.1}
            transmission={0.9}
            thickness={0.5}
            transparent
            opacity={0.85}
            color="#ffffff"
            emissive="#FF5F1F"
            emissiveIntensity={0.08}
            ior={1.5}
          />
        ) : (
          /* Heavy Optical Glass Physics Transmission Material for Desktop */
          <MeshTransmissionMaterial
            ref={transmissionMatRef}
            transmission={1}
            thickness={1.4}
            roughness={0.04}
            ior={1.52}
            chromaticAberration={0.15}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.3}
            temporalDistortion={0.1}
            attenuationDistance={0.9}
            attenuationColor="#FF5F1F"
            color="#ffffff"
            samples={6}
            resolution={512}
          />
        )}
      </mesh>

      {/* Precision Structural Outer Frame Edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.CylinderGeometry(1.5, 1.5, 3.2, 3, 1)]} />
        <lineBasicMaterial
          ref={edgesMatRef}
          color="#FF5F1F"
          transparent
          opacity={0.5}
          linewidth={1.5}
        />
      </lineSegments>
    </group>
  );
}

export { Act05Prism as Act05_Prism };
