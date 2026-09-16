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
 * Act08Tunnel (ACT 08: THE FILM / HYPERSPEED SHUTTER TUNNEL)
 * -----------------------------------------------------------
 * High-performance InstancedMesh tunnel along a deep negative Z curve.
 * - Exact Z-axis clipping & frustum culling: instances smoothly collapse to 0 before intersecting camera near plane.
 * - Pure black scene fog eliminates distant pop-in.
 * - Scroll-velocity driven Z-axis motion blur stretching (hyperspeed warp).
 * - Border emissive intensity spikes to neon warp speed during fast scroll.
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
  const finalHeroFrameRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  const mobileCheck =
    isMobile ??
    (size.width < 768 || (typeof window !== "undefined" && window.innerWidth < 768));
  const INSTANCE_COUNT = mobileCheck ? 90 : 280;

  // 1. Precalculate 3 Interwoven Helical Film Strip Streams along Z-axis
  const instances = useMemo<TunnelInstanceData[]>(() => {
    const list: TunnelInstanceData[] = [];

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const u = i / INSTANCE_COUNT;
      // Massive Z-axis range from 2.0 down to -245 units deep
      const z = 2.0 - u * 247;

      // 3 Interlaced Helical Streams (Inner, Mid, Outer)
      const streamIndex = i % 3;
      let radius: number;
      let angleOffset: number;

      if (streamIndex === 0) {
        // Inner stream: passes closely along the flight corridor
        radius = 1.75 + Math.sin(u * Math.PI * 8) * 0.35;
        angleOffset = 0;
      } else if (streamIndex === 1) {
        // Mid stream: core corkscrew film ribbon
        radius = 2.50 + Math.cos(u * Math.PI * 6) * 0.45;
        angleOffset = (Math.PI * 2) / 3;
      } else {
        // Outer stream: grand architectural framing ribbon
        radius = 3.35 + Math.sin(u * Math.PI * 10) * 0.55;
        angleOffset = (Math.PI * 4) / 3;
      }

      const angle = u * Math.PI * 16 + angleOffset;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.72);

      const basePos = new THREE.Vector3(x, y, z);
      
      // Calculate rotation so each film frame banks and faces inwards toward flight axis
      const lookTarget = new THREE.Vector3(x * 0.15, y * 0.15, z - 8.0);
      const m = new THREE.Matrix4();
      m.lookAt(basePos, lookTarget, new THREE.Vector3(0, 1, 0));
      const baseRot = new THREE.Euler().setFromRotationMatrix(m);

      list.push({
        basePos,
        baseRot,
        baseScale: new THREE.Vector3(2.1, 1.22, 0.08),
        isAccent: i % 3 === 0,
      });
    }

    return list;
  }, [INSTANCE_COUNT]);

  // Pre-allocate matrix manipulation objects (zero allocation inside useFrame)
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);

  // Initialize Instance Colors once on mount
  useEffect(() => {
    if (!bordersMeshRef.current || !framesMeshRef.current) return;

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const item = instances[i];
      if (!item) continue;
      if (item.isAccent) {
        dummyColor.set("#FF5F1F"); // Signature neon kinetic amber
      } else {
        dummyColor.setRGB(0.2, 0.65, 0.95); // High-contrast anamorphic cyan
      }
      bordersMeshRef.current.setColorAt(i, dummyColor);

      // Celluloid film body tint
      dummyColor.setRGB(0.08, 0.12, 0.18);
      framesMeshRef.current.setColorAt(i, dummyColor);
    }

    if (bordersMeshRef.current.instanceColor) {
      bordersMeshRef.current.instanceColor.needsUpdate = true;
    }
    if (framesMeshRef.current.instanceColor) {
      framesMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances, dummyColor, INSTANCE_COUNT]);

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

    // MasterCameraDirector is the sole authority over camera transform.
    // Read camera.position.z for depth culling and near-plane clipping.
    const camZ = camera.position.z;

    // 3. Velocity-Driven Hyperspeed Z-Stretching & Light Streaks (Phase 6 Physical Response)
    const zStretch = scrollState.physics.tunnelStretch;
    const zThickness = (0.05 + Math.min(1.2, absVel * 1.5)) * zStretch;

    // Border Material Emissive Warp Glow (vivid 1.2 baseline, boosts to 2.5 on velocity)
    if (bordersMeshRef.current && bordersMeshRef.current.material) {
      const mat = bordersMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (1.2 + Math.min(1.4, absVel * 2.2)) * scrollState.physics.lightStreakIntensity;
    }

    // 4. Mathematical Depth Fading & Near-Plane Clipping Prevention
    if (framesMeshRef.current && bordersMeshRef.current) {
      for (let i = 0; i < INSTANCE_COUNT; i++) {
        const item = instances[i];
        if (!item) continue;
        const distanceAhead = camZ - item.basePos.z;

        // A. Critical Near-Plane Culling: smooth cubic collapse as camera passes through
        let clipFactor = 1.0;
        if (distanceAhead < 1.0) {
          clipFactor = 0.0;
        } else if (distanceAhead < 4.5) {
          const norm = (distanceAhead - 1.0) / 3.5;
          clipFactor = norm * norm;
        }

        // B. Far Horizon Fade (mapped with atmospheric depth fog)
        let farFactor = 1.0;
        if (distanceAhead > 115.0) {
          farFactor = 0.0;
        } else if (distanceAhead > 75.0) {
          farFactor = Math.max(0, 1.0 - (distanceAhead - 75.0) / 40.0);
        }

        // C. Climax Expansion: As progress reaches the work arrival (p > 0.88), frames part gracefully outwards
        let climaxBlackout = 1.0;
        let lateralPart = 0.0;
        if (p > 0.88) {
          const exitT = (p - 0.88) / 0.12;
          climaxBlackout = Math.max(0.15, 1.0 - exitT * 0.7);
          lateralPart = Math.pow(exitT, 2.0) * (item.basePos.x >= 0 ? 4.5 : -4.5);
        }

        const scaleMul = clipFactor * farFactor * climaxBlackout;

        if (scaleMul <= 0.0001) {
          dummy.position.set(0, 0, 1000); // place culled instances far off-screen
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          framesMeshRef.current.setMatrixAt(i, dummy.matrix);
          bordersMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        // Apply position with subtle tunnel harmonic drift + lateral parting at climax
        const driftX = Math.sin(t * 1.2 + i * 0.1) * 0.08;
        const driftY = Math.cos(t * 1.5 + i * 0.1) * 0.08;
        dummy.position.set(
          item.basePos.x + driftX + lateralPart,
          item.basePos.y + driftY,
          item.basePos.z
        );

        // Apply rotation
        dummy.rotation.copy(item.baseRot);
        dummy.rotation.z += t * 0.15 + scrollState.velocityIntensity * 0.12;

        // Apply scale with motion blur stretching
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

    // 5. Grand Gateway Portal: Luminous frame opening at the tunnel exit to usher in the Work Archive
    if (finalHeroFrameRef.current) {
      const isGateway = p > 0.82;
      finalHeroFrameRef.current.visible = isGateway;
      if (isGateway) {
        const gatewayP = Math.min(1.0, (p - 0.82) / 0.12);
        finalHeroFrameRef.current.position.set(0, 0, camZ - 9.0);
        const s = 1.8 + gatewayP * 0.8;
        finalHeroFrameRef.current.scale.set(s * 1.77, s, 1);
        finalHeroFrameRef.current.rotation.z = Math.sin(t * 0.5) * 0.015;

        const border = finalHeroFrameRef.current.children[1] as THREE.LineSegments;
        if (border && border.material) {
          (border.material as THREE.LineBasicMaterial).opacity = Math.min(1.0, gatewayP * 1.5);
        }
      }
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Soft Depth Horizon Fog */}
      <fogExp2 attach="fog" args={["#000000", 0.009]} />

      {/* 1. Inner Celluloid Film Cells Instanced Mesh */}
      <instancedMesh
        key={`frames-${INSTANCE_COUNT}`}
        ref={framesMeshRef}
        args={[new THREE.BoxGeometry(2.1, 1.22, 0.08), undefined as any, INSTANCE_COUNT]}
      >
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.6}
          emissive="#0d1b2a"
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      {/* 2. Glowing Precision Frame Borders Instanced Mesh */}
      <instancedMesh
        key={`borders-${INSTANCE_COUNT}`}
        ref={bordersMeshRef}
        args={[new THREE.BoxGeometry(2.14, 1.26, 0.1), undefined as any, INSTANCE_COUNT]}
      >
        <meshStandardMaterial
          color="#FF5F1F"
          emissive="#FF5F1F"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </instancedMesh>

      {/* 3. The Climax Solitary Frame: "Then suddenly: silence. One frame remains." */}
      <group ref={finalHeroFrameRef} visible={false}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
          <lineBasicMaterial color="#FF5F1F" transparent opacity={0} linewidth={2} />
        </lineSegments>
      </group>
    </group>
  );
}

export { Act08Tunnel as Act08_TheFilm };
