import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { quinticSmooth } from "../../../lib/motion/appleCurves";
import { getIsGenesisActive } from "../../../lib/lenis";

const POSTERS = [
  "/images/real-estate-poster.jpg",
  "/images/saas-poster.jpg",
  "/images/embassy-poster.jpg",
  "/images/taj-hotel-poster.jpg",
  "/images/harrdy-sandhu-poster.jpg",
  "/images/bennett-night-poster.jpg",
  "/images/client-work-poster.jpg",
  "/images/github-launch-poster.jpg",
];

// Preload Act 01 exhibition textures for zero-stutter handoff
useTexture.preload(POSTERS);

interface GalleryCardItem {
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  scale: number;
  textureIdx: number;
  isAccent: boolean;
  side: "left" | "right";
  floatSpeed: number;
  floatAmp: number;
  seed: number;
}

/**
 * MemoryVault (Act 01: The Memory Vault)
 * --------------------------------------
 * Curated 3D Exhibition Gallery Corridor (Z = 0 down to -145).
 * - Exact 16:9 cinematic aspect ratio (no image distortion or stretching).
 * - Flanking left & right gallery tiers angled inward toward camera flight path.
 * - Center corridor is kept crystal clear for HUD and narrative focus.
 * - Subtle, elegant zero-gravity floating breathing physics.
 * - Aggressive GPU frustum culling and smooth optical depth fading.
 */
export function MemoryVault({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const textures = useTexture(POSTERS);

  useEffect(() => {
    textures.forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });
  }, [textures]);

  const COUNT_PER_SIDE = 13;

  // 1. Staged Exhibition Gallery Corridor
  const items = useMemo<GalleryCardItem[]>(() => {
    const list: GalleryCardItem[] = [];

    for (let i = 0; i < COUNT_PER_SIDE; i++) {
      const z = -6.0 - i * 10.4; // Distributed from Z = -6 to Z = -135

      // Angular Corridor Scaling: Proportional expansion with depth ensures all gallery cards
      // strictly flank the camera's perimeter (70% - 90% horizontal off-center), leaving the entire
      // central 65% of the viewport 100% crystal clear for narrative typography!
      const depth = i * 10.4;
      const lateralSpread = 6.2 + depth * 0.42;
      const leftX = -lateralSpread;
      const leftY = i % 2 === 0 ? 1.25 : -1.05;
      list.push({
        basePos: new THREE.Vector3(leftX, leftY, z),
        baseRot: new THREE.Euler(0, 0.36, 0), // Angled inward to face oncoming viewer
        scale: 1.0,
        textureIdx: i % POSTERS.length,
        isAccent: i % 3 === 0,
        side: "left",
        floatSpeed: 0.8 + (i % 4) * 0.25,
        floatAmp: 0.12,
        seed: i * 3.7,
      });

      // Right Tier (Angled outward with depth)
      const rightX = lateralSpread;
      const rightY = i % 2 === 0 ? -1.05 : 1.25;
      list.push({
        basePos: new THREE.Vector3(rightX, rightY, z - 5.2), // Staggered slightly along Z
        baseRot: new THREE.Euler(0, -0.36, 0), // Angled inward to face oncoming viewer
        scale: 1.0,
        textureIdx: (i + 4) % POSTERS.length,
        isAccent: (i + 1) % 3 === 0,
        side: "right",
        floatSpeed: 0.75 + (i % 4) * 0.3,
        floatAmp: 0.12,
        seed: i * 5.1 + 10,
      });
    }

    return list;
  }, []);

  // 2. Cosmic Memory Embers (320 floating particles)
  const EMBER_COUNT = 320;
  const { emberPositions, emberSpeeds } = useMemo(() => {
    const pos = new Float32Array(EMBER_COUNT * 3);
    const speeds = new Float32Array(EMBER_COUNT);
    for (let i = 0; i < EMBER_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = 5 - Math.random() * 150;
      speeds[i] = 0.5 + Math.random() * 1.2;
    }
    return { emberPositions: pos, emberSpeeds: speeds };
  }, []);

  const embersRef = useRef<THREE.Points>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Strict Gate: Never render or display Act 01 cards while Genesis prologue is running
    if (getIsGenesisActive()) {
      groupRef.current.visible = false;
      return;
    }

    // Visibility envelope for Act 01 (and handoff into Act 02)
    const isAct1 = scrollState.act === 1;
    const isAct2Start = scrollState.act === 2 && scrollState.actProgress < 0.2;
    const isVisible = isAct1 || isAct2Start;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const t = state.clock.elapsedTime;
    const cameraZ = camera.position.z;

    // 3. Float Physics & Optical Distance Fading
    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const item = items[idx];

      const distanceAhead = cameraZ - item.basePos.z;

      // Culling Rule 1: Behind camera
      if (distanceAhead < 0.6) {
        card.visible = false;
        return;
      }

      // Culling Rule 2: Beyond render horizon (> 46 units ahead)
      if (distanceAhead > 46) {
        card.visible = false;
        return;
      }

      card.visible = true;

      // Optical Depth Fade (Smooth fade between 46 and 24 units)
      let opacity = 1.0;
      if (distanceAhead > 24) {
        const rawFade = Math.max(0, Math.min(1, (distanceAhead - 24) / 22));
        opacity = 1.0 - quinticSmooth(rawFade);
      }

      // Apply opacity to poster mesh
      const posterMesh = card.children[0] as THREE.Mesh;
      if (posterMesh && posterMesh.material) {
        const mat = posterMesh.material as THREE.MeshStandardMaterial;
        mat.opacity = opacity * 0.96;
      }

      // Apply opacity to border frame
      const borderLine = card.children[2] as THREE.LineSegments;
      if (borderLine && borderLine.material) {
        const bMat = borderLine.material as THREE.LineBasicMaterial;
        bMat.opacity = opacity * (item.isAccent ? 0.85 : 0.4);
      }

      // Organic weightless breathing float
      card.position.y =
        item.basePos.y + Math.sin(t * item.floatSpeed + item.seed) * item.floatAmp;
      card.position.x =
        item.basePos.x + Math.cos(t * (item.floatSpeed * 0.6) + item.seed) * 0.04;

      // Gentle subtle tilt response
      card.rotation.z = Math.sin(t * 0.7 + item.seed) * 0.02;
    });

    // 4. Ambient Embers Turbulence
    if (embersRef.current) {
      const geom = embersRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const speedMul = scrollState.physics.particleSpeedMultiplier;

      for (let i = 0; i < EMBER_COUNT; i++) {
        const baseY = emberPositions[i * 3 + 1];
        const y = baseY + Math.sin(t * (emberSpeeds[i] * speedMul * 0.8) + i) * 0.3;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Ambient Cosmic Memory Embers */}
      <points ref={embersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#FF5F1F"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Flanking Gallery Monolith Cards (True 16:9 aspect ratio: 2.4 x 1.35) */}
      {items.map((item, idx) => (
        <group
          key={idx}
          ref={(el) => {
            cardRefs.current[idx] = el;
          }}
          position={item.basePos}
          rotation={item.baseRot}
          scale={[item.scale, item.scale, 1]}
        >
          {/* 1. True 16:9 Video Poster Plane */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[2.4, 1.35]} />
            <meshStandardMaterial
              map={textures[item.textureIdx]}
              roughness={0.25}
              metalness={0.12}
              emissive="#ffffff"
              emissiveMap={textures[item.textureIdx]}
              emissiveIntensity={0.28}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 2. Obsidian Glass Backplate */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.46, 1.41]} />
            <meshStandardMaterial
              color="#090a0f"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* 3. Sleek Neon Accent Border */}
          <lineSegments position={[0, 0, 0.02]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.46, 1.41)]} />
            <lineBasicMaterial
              color={item.isAccent ? "#FF5F1F" : "#3b4252"}
              transparent
              opacity={0}
            />
          </lineSegments>

          {/* 4. Subtle Top/Bottom Horizon Accent Bar */}
          <mesh position={[0, -0.71, 0.02]}>
            <planeGeometry args={[1.2, 0.02]} />
            <meshBasicMaterial
              color={item.isAccent ? "#FF5F1F" : "#5a6578"}
              transparent
              opacity={item.isAccent ? 0.8 : 0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
