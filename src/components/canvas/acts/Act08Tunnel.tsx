import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";

interface TunnelInstanceData {
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  baseScale: THREE.Vector3;
  isAccent: boolean;
}

/**
 * Act08Tunnel (ACT 03: THE FILM / LUMINOUS SHUTTER TUNNEL)
 * -----------------------------------------------------------
 * High-performance, award-winning InstancedMesh tunnel along a deep Z curve.
 * - Continuous luminous guidance rings along the flight corridor (zero black voids).
 * - Vivid dual-color anamorphic celluloid frames (amber #FF5F1F & electric cyan #38bdf8).
 * - Extended view horizon & smooth near-plane fading so the scene is always rich and alive.
 * - 120 FPS optimized with zero allocations in useFrame.
 */
export function Act08Tunnel({
  active,
  isMobile,
}: {
  active: boolean;
  isMobile?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const framesMeshRef = useRef<THREE.InstancedMesh>(null);
  const bordersMeshRef = useRef<THREE.InstancedMesh>(null);
  const ringsMeshRef = useRef<THREE.InstancedMesh>(null);
  const finalHeroFrameRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  const mobileCheck =
    isMobile ??
    (size.width < 768 || (typeof window !== "undefined" && window.innerWidth < 768));
  const INSTANCE_COUNT = mobileCheck ? 150 : 320;
  const RING_COUNT = mobileCheck ? 28 : 50;

  // 1. Precalculate 3 Interwoven Helical Film Strip Streams along Z-axis
  const instances = useMemo<TunnelInstanceData[]>(() => {
    const list: TunnelInstanceData[] = [];

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const u = i / INSTANCE_COUNT;
      // Continuous Z-axis range from 6.0 down to -255 units deep
      const z = 6.0 - u * 260;

      // 3 Interlaced Helical Streams (Inner, Mid, Outer)
      const streamIndex = i % 3;
      let radius: number;
      let angleOffset: number;

      if (streamIndex === 0) {
        radius = 2.0 + Math.sin(u * Math.PI * 8) * 0.4;
        angleOffset = 0;
      } else if (streamIndex === 1) {
        radius = 2.8 + Math.cos(u * Math.PI * 6) * 0.5;
        angleOffset = (Math.PI * 2) / 3;
      } else {
        radius = 3.6 + Math.sin(u * Math.PI * 10) * 0.6;
        angleOffset = (Math.PI * 4) / 3;
      }

      const angle = u * Math.PI * 18 + angleOffset;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.72);

      const basePos = new THREE.Vector3(x, y, z);

      // Rotation faces towards flight axis
      const lookTarget = new THREE.Vector3(x * 0.1, y * 0.1, z - 10.0);
      const m = new THREE.Matrix4();
      m.lookAt(basePos, lookTarget, new THREE.Vector3(0, 1, 0));
      const baseRot = new THREE.Euler().setFromRotationMatrix(m);

      list.push({
        basePos,
        baseRot,
        baseScale: new THREE.Vector3(2.2, 1.3, 0.08),
        isAccent: i % 3 === 0,
      });
    }

    return list;
  }, [INSTANCE_COUNT]);

  // Pre-allocate matrix manipulation objects
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);

  // Initialize Instance Colors and Rings once on mount
  useEffect(() => {
    if (!bordersMeshRef.current || !framesMeshRef.current) return;

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const item = instances[i];
      if (!item) continue;
      if (item.isAccent) {
        dummyColor.set("#FF5F1F"); // Signature neon kinetic amber
      } else {
        dummyColor.setRGB(0.22, 0.75, 1.0); // Anamorphic electric cyan
      }
      bordersMeshRef.current.setColorAt(i, dummyColor);

      // Celluloid film body tint: rich dark glass with subtle blue-amber luminosity
      dummyColor.setRGB(0.08, 0.12, 0.2);
      framesMeshRef.current.setColorAt(i, dummyColor);
    }

    if (bordersMeshRef.current.instanceColor) {
      bordersMeshRef.current.instanceColor.needsUpdate = true;
    }
    if (framesMeshRef.current.instanceColor) {
      framesMeshRef.current.instanceColor.needsUpdate = true;
    }

    // Initialize glowing tunnel guide rings
    if (ringsMeshRef.current) {
      for (let r = 0; r < RING_COUNT; r++) {
        const u = r / RING_COUNT;
        const rZ = 8.0 - u * 270;
        dummy.position.set(0, 0, rZ);
        dummy.rotation.set(0, 0, u * Math.PI);
        const radiusScale = 3.8 + Math.sin(u * Math.PI * 4) * 0.5;
        dummy.scale.set(radiusScale, radiusScale * 0.75, 1);
        dummy.updateMatrix();
        ringsMeshRef.current.setMatrixAt(r, dummy.matrix);

        dummyColor.set(r % 2 === 0 ? "#FF5F1F" : "#38bdf8");
        ringsMeshRef.current.setColorAt(r, dummyColor);
      }
      ringsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (ringsMeshRef.current.instanceColor) {
        ringsMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [instances, dummy, dummyColor, INSTANCE_COUNT, RING_COUNT]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const isAct3 = scrollState.act === 3;
    if (!isAct3) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const p = scrollState.actProgress;
    const vel = scrollState.velocity;
    const absVel = Math.abs(vel);
    const t = state.clock.elapsedTime;
    const camZ = camera.position.z;

    // Velocity-driven motion blur thickness
    const zThickness = Math.max(0.08, (0.08 + Math.min(1.0, absVel * 1.2)));

    // Emissive intensity responsive to scroll speed
    if (bordersMeshRef.current && bordersMeshRef.current.material) {
      const mat = bordersMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.4 + Math.min(1.8, absVel * 2.0);
    }

    // Mathematical Depth Fading & Near-Plane Clipping Prevention
    if (framesMeshRef.current && bordersMeshRef.current) {
      for (let i = 0; i < INSTANCE_COUNT; i++) {
        const item = instances[i];
        if (!item) continue;
        const distanceAhead = camZ - item.basePos.z;

        // Near-plane culling: smooth cubic dissolve
        let clipFactor = 1.0;
        if (distanceAhead < 0.8) {
          clipFactor = 0.0;
        } else if (distanceAhead < 3.8) {
          const norm = (distanceAhead - 0.8) / 3.0;
          clipFactor = norm * norm;
        }

        // Extended far horizon fade (keeps tunnel deep and glowing, never pitch black)
        let farFactor = 1.0;
        if (distanceAhead > 220.0) {
          farFactor = 0.0;
        } else if (distanceAhead > 150.0) {
          farFactor = Math.max(0, 1.0 - (distanceAhead - 150.0) / 70.0);
        }

        // At terminal arrival (p > 0.90), frames gently part laterally for the grand reveal
        let lateralPart = 0.0;
        if (p > 0.90) {
          const exitT = (p - 0.90) / 0.10;
          lateralPart = Math.pow(exitT, 2.0) * (item.basePos.x >= 0 ? 3.5 : -3.5);
        }

        const scaleMul = clipFactor * farFactor;

        if (scaleMul <= 0.0001) {
          dummy.position.set(0, 0, 1000);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          framesMeshRef.current.setMatrixAt(i, dummy.matrix);
          bordersMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        const driftX = Math.sin(t * 1.2 + i * 0.1) * 0.06;
        const driftY = Math.cos(t * 1.5 + i * 0.1) * 0.06;
        dummy.position.set(
          item.basePos.x + driftX + lateralPart,
          item.basePos.y + driftY,
          item.basePos.z
        );

        dummy.rotation.copy(item.baseRot);
        dummy.rotation.z += t * 0.12 + absVel * 0.08;

        dummy.scale.set(
          item.baseScale.x * scaleMul,
          item.baseScale.y * scaleMul,
          zThickness * scaleMul
        );

        dummy.updateMatrix();
        framesMeshRef.current.setMatrixAt(i, dummy.matrix);
        bordersMeshRef.current.setMatrixAt(i, dummy.matrix);
      }

      framesMeshRef.current.instanceMatrix.needsUpdate = true;
      bordersMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Grand Portal Gate at climax (p > 0.78)
    if (finalHeroFrameRef.current) {
      const isGateway = p > 0.78;
      finalHeroFrameRef.current.visible = isGateway;
      if (isGateway) {
        const gatewayP = Math.min(1.0, (p - 0.78) / 0.20);
        finalHeroFrameRef.current.position.set(0, 0, camZ - 8.5);
        const s = 1.9 + gatewayP * 0.9;
        finalHeroFrameRef.current.scale.set(s * 1.77, s, 1);
        finalHeroFrameRef.current.rotation.z = Math.sin(t * 0.4) * 0.015;
      }
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Soft atmospheric depth fog (tinted navy-black, keeps neon colors vivid) */}
      <fogExp2 attach="fog" args={["#060810", 0.005]} />

      {/* Atmospheric Point Lights tracking flight */}
      <pointLight position={[0, 1.5, camera.position.z + 1.0]} intensity={25} color="#FF5F1F" distance={45} />
      <pointLight position={[0, -1.5, camera.position.z - 8.0]} intensity={30} color="#38bdf8" distance={55} />

      {/* 1. Luminous Cylindrical Tunnel Guide Rings (Eliminates empty black screens) */}
      <instancedMesh
        key={`rings-${RING_COUNT}`}
        ref={ringsMeshRef}
        args={[new THREE.TorusGeometry(1, 0.018, 8, 36), undefined as any, RING_COUNT]}
      >
        <meshBasicMaterial transparent opacity={0.45} />
      </instancedMesh>

      {/* 2. Inner Celluloid Film Cells Instanced Mesh */}
      <instancedMesh
        key={`frames-${INSTANCE_COUNT}`}
        ref={framesMeshRef}
        args={[new THREE.BoxGeometry(2.2, 1.3, 0.08), undefined as any, INSTANCE_COUNT]}
      >
        <meshStandardMaterial
          roughness={0.15}
          metalness={0.8}
          emissive="#0d1b2a"
          emissiveIntensity={0.85}
          transparent
          opacity={0.88}
        />
      </instancedMesh>

      {/* 3. Glowing Precision Frame Borders Instanced Mesh */}
      <instancedMesh
        key={`borders-${INSTANCE_COUNT}`}
        ref={bordersMeshRef}
        args={[new THREE.BoxGeometry(2.24, 1.34, 0.1), undefined as any, INSTANCE_COUNT]}
      >
        <meshStandardMaterial
          color="#FF5F1F"
          emissive="#FF5F1F"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </instancedMesh>

      {/* 4. Grand Arrival Climax Portal */}
      <group ref={finalHeroFrameRef} visible={false}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
          <lineBasicMaterial color="#FF5F1F" transparent opacity={0.9} linewidth={2} />
        </lineSegments>
      </group>
    </group>
  );
}

export { Act08Tunnel as Act08_TheFilm };
