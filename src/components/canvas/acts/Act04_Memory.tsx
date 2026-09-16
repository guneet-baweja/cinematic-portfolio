import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { act05State } from "../../../lib/timeline/gsapChoreography";

interface OrbitMemory {
  radius: number;
  angle: number;
  speed: number;
  y: number;
  scale: number;
}

/**
 * ACT 04: MEMORY
 * --------------
 * Dark atmospheric chamber with a human silhouette at the center.
 * Hundreds of glowing memories orbit like a delicate constellation.
 * Everything starts in cold monochrome.
 * A single memory approaches the camera and ignites with vivid warm color (#FF5F1F),
 * which blooms outwards and restores emotion to the entire universe.
 */
export function Act04_Memory({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const heroMemoryRef = useRef<THREE.Mesh>(null);
  const instancedMemoriesRef = useRef<THREE.InstancedMesh>(null);
  const colorWaveRef = useRef<THREE.Mesh>(null);
  const heartRef = useRef<THREE.Mesh>(null);
  const tendrilRef = useRef<THREE.LineSegments>(null);

  const COUNT = 120;

  // Emotional connection tendril geometry
  const tendrilGeom = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0.8, 0.2, -1.0),
    ]);
  }, []);

  useEffect(() => {
    return () => {
      tendrilGeom.dispose();
    };
  }, [tendrilGeom]);

  const memories = useMemo<OrbitMemory[]>(() => {
    const list: OrbitMemory[] = [];
    for (let i = 0; i < COUNT; i++) {
      list.push({
        radius: 1.4 + Math.random() * 3.2,
        angle: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.4,
        y: (Math.random() - 0.5) * 2.8,
        scale: 0.04 + Math.random() * 0.07,
      });
    }
    return list;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!groupRef.current) return;


    const isAct5 = scrollState.act === 5;
    const isAct4End = scrollState.act === 4 && scrollState.actProgress > 0.8;
    const isAct6Start = scrollState.act === 6 && scrollState.actProgress < 0.2;
    const isVisible = isAct5 || isAct4End || isAct6Start;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const p = isAct5 ? scrollState.actProgress : isAct6Start ? 1.0 : 0.0;
    const t = state.clock.elapsedTime;

    // 1. Orbiting Constellation (Choreographed by GSAP act05Timeline)
    if (instancedMemoriesRef.current) {
      const colorSpreadProgress = act05State.colorBloom; // 0 to 1 color bloom from GSAP timeline

      for (let i = 0; i < COUNT; i++) {
        const m = memories[i];
        const curAngle = m.angle + t * m.speed * 0.5;
        const x = Math.cos(curAngle) * m.radius;
        const z = Math.sin(curAngle) * m.radius;
        const y = m.y + Math.sin(t + i) * 0.1;

        // Text-safe zone exclusion: dampen orbs directly in front of the center headline/subtext plane
        const isCenterTextZone = Math.abs(x) < 1.4 && Math.abs(y) < 0.8 && z > 0.5;
        const textZoneDamp = isCenterTextZone ? 0.25 : 1.0;

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(m.scale * (1 + 0.2 * Math.sin(t * 2 + i)) * textZoneDamp);
        dummy.updateMatrix();
        instancedMemoriesRef.current.setMatrixAt(i, dummy.matrix);

        // Transition from monochrome grey to luminous orange/warm hues
        const distFromHero = Math.sqrt(x * x + y * y + z * z);
        const hasColor = distFromHero < colorSpreadProgress * 4.5;

        if (hasColor) {
          dummyColor.set("#FF5F1F").lerp(new THREE.Color("#f59e0b"), (i % 5) * 0.2);
        } else {
          // Monochrome silver-grey
          dummyColor.setRGB(0.5, 0.55, 0.6);
        }
        instancedMemoriesRef.current.setColorAt(i, dummyColor);
      }
      instancedMemoriesRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMemoriesRef.current.instanceColor) {
        instancedMemoriesRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 2. Hero Memory: advances directly toward camera, ignites in orange
    if (heroMemoryRef.current) {
      // Moves from [0.8, 0.2, -1.0] towards [0, 0, 3.2]
      const approach = Math.min(1.0, Math.max(0, (p - 0.2) * 2.2));
      const hX = THREE.MathUtils.lerp(0.8, 0.0, approach);
      const hY = THREE.MathUtils.lerp(0.2, 0.0, approach);
      const hZ = THREE.MathUtils.lerp(-1.0, 3.0, approach);
      heroMemoryRef.current.position.set(hX, hY, hZ);

      const s = THREE.MathUtils.lerp(0.12, 0.35, approach);
      heroMemoryRef.current.scale.setScalar(s);

      const mat = heroMemoryRef.current.material as THREE.MeshStandardMaterial;
      if (p > 0.45) {
        const heat = Math.min(1, (p - 0.45) * 4.0);
        mat.color.setRGB(0.5, 0.5, 0.5).lerp(new THREE.Color("#FF5F1F"), heat);
        mat.emissive.set("#FF5F1F");
        mat.emissiveIntensity = heat * 2.5;
      } else {
        mat.color.setRGB(0.4, 0.42, 0.45);
        mat.emissiveIntensity = 0.1;
      }

      // Emotional Connection Tendril Update
      if (tendrilRef.current) {
        const isTendrilActive = p > 0.3 && p < 0.85;
        tendrilRef.current.visible = isTendrilActive;
        if (isTendrilActive) {
          const posAttr = tendrilGeom.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, 0, 0.05, 0); // heart position
          posAttr.setXYZ(1, hX, hY, hZ); // hero memory position
          posAttr.needsUpdate = true;
          const tMat = tendrilRef.current.material as THREE.LineBasicMaterial;
          tMat.opacity = Math.min(0.85, (p - 0.3) * 3.0);
        }
      }

      // Heart Core Pulse
      if (heartRef.current) {
        const heartP = Math.min(1, Math.max(0, (p - 0.35) * 3.0));
        const pulse = 1.0 + 0.35 * Math.sin(t * 10.0) * heartP;
        heartRef.current.scale.setScalar(pulse);
        const hMat = heartRef.current.material as THREE.MeshBasicMaterial;
        hMat.opacity = heartP * (0.6 + 0.4 * Math.sin(t * 10.0));
      }
    }

    // 3. Expanding Color Wave
    if (colorWaveRef.current) {
      const waveProgress = Math.max(0, (p - 0.52) * 2.0);
      colorWaveRef.current.visible = waveProgress > 0 && waveProgress < 1;
      const waveRadius = waveProgress * 6.0;
      colorWaveRef.current.scale.set(waveRadius, waveRadius, waveRadius);
      const wMat = colorWaveRef.current.material as THREE.MeshBasicMaterial;
      wMat.opacity = Math.max(0, (1.0 - waveProgress) * 0.4);
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Central Human Silhouette */}
      <group position={[0, -0.6, 0]}>
        {/* Head */}
        <mesh position={[0, 1.35, 0]}>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial color="#050608" roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.3, 0.22, 1.3, 32]} />
          <meshStandardMaterial color="#050608" roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Pulsing Emotional Heart Core */}
        <mesh ref={heartRef} position={[0, 0.65, 0.15]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#FF5F1F" transparent opacity={0} />
        </mesh>
      </group>

      {/* Luminous Emotional Tendril */}
      <lineSegments ref={tendrilRef} geometry={tendrilGeom} visible={false}>
        <lineBasicMaterial color="#FF5F1F" transparent opacity={0} linewidth={2} />
      </lineSegments>

      {/* Orbiting Constellation of Memories */}
      <instancedMesh
        ref={instancedMemoriesRef}
        args={[new THREE.SphereGeometry(1, 16, 16), undefined as any, COUNT]}
      >
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </instancedMesh>

      {/* Hero Emotional Memory */}
      <mesh ref={heroMemoryRef} position={[0.8, 0.2, -1.0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial roughness={0.2} metalness={0.4} />
      </mesh>

      {/* Radial Color Bloom Wave Sphere */}
      <mesh ref={colorWaveRef} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#FF5F1F"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
