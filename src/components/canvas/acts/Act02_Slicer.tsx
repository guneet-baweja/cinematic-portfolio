import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { act03State } from "../../../lib/timeline/gsapChoreography";

/**
 * ACT 02: THE EDITOR ARRIVES
 * --------------------------
 * Features the Editor at his After Effects workstation (/images/editor_workspace.jpg).
 * Holographic timeline curves, floating UI guides, and ambient cyan/tungsten studio lights.
 * A precision vertical laser blade slices across the hero frame with thermal heat glow and sparks.
 * Sliced elements converge into an illuminated 3D timeline track.
 */
export function Act02_Slicer({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const bladeRef = useRef<THREE.Group>(null);
  const leftHalfRef = useRef<THREE.Group>(null);
  const rightHalfRef = useRef<THREE.Group>(null);
  const timelineGroupRef = useRef<THREE.Group>(null);
  const sparksRef = useRef<THREE.Points>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const playheadRef = useRef<THREE.Mesh>(null);

  // Load the user's editor workstation portrait
  const editorTexture = useTexture("/images/editor_workspace.jpg");

  useEffect(() => {
    editorTexture.colorSpace = THREE.SRGBColorSpace;
    editorTexture.minFilter = THREE.LinearMipmapLinearFilter;
    editorTexture.magFilter = THREE.LinearFilter;
    editorTexture.generateMipmaps = true;
  }, [editorTexture]);

  // Card dimensions: 9:16 portrait proportion (width: 2.1, height: 3.73, half-width: 1.05)
  const CARD_W = 2.1;
  const CARD_H = 3.73;
  const HALF_W = CARD_W / 2;

  // Pre-split geometries with normalized 0..0.5 and 0.5..1.0 UV maps for seamless stitching
  const { leftGeom, rightGeom } = useMemo(() => {
    const left = new THREE.PlaneGeometry(HALF_W, CARD_H, 1, 1);
    const uvL = left.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uvL.count; i++) {
      uvL.setX(i, uvL.getX(i) * 0.5);
    }
    uvL.needsUpdate = true;

    const right = new THREE.PlaneGeometry(HALF_W, CARD_H, 1, 1);
    const uvR = right.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uvR.count; i++) {
      uvR.setX(i, 0.5 + uvR.getX(i) * 0.5);
    }
    uvR.needsUpdate = true;

    return { leftGeom: left, rightGeom: right };
  }, [HALF_W, CARD_H]);

  // Timeline track blocks
  const TIMELINE_COUNT = 28;
  const timelineBlocks = useMemo(() => {
    return Array.from({ length: TIMELINE_COUNT }, (_, i) => {
      const u = i / TIMELINE_COUNT;
      const x = (u - 0.5) * 14.0;
      const z = Math.sin(u * Math.PI) * -1.5;
      const y = -2.1 + Math.sin(i * 1.5) * 0.15;
      const isCut = i % 5 === 0;
      return { x, y, z, isCut, width: 0.35 + Math.sin(i) * 0.15 };
    });
  }, []);

  // Sparks particle system
  const { sparkPositions, sparkVelocities } = useMemo(() => {
    const COUNT = 140;
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
      pos[i * 3 + 2] = 0;

      vel[i * 3] = (Math.random() - 0.5) * 4.0;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    return { sparkPositions: pos, sparkVelocities: vel };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Visibility in the 4-act system: Act 02
    const isAct2 = scrollState.act === 2;
    const isAct1End = scrollState.act === 1 && scrollState.actProgress > 0.8;
    const isVisible = isAct2 || isAct1End;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const p = isAct2 ? scrollState.actProgress : 0.0;
    const t = state.clock.elapsedTime;

    // 1. Blade sweep across X
    if (bladeRef.current) {
      bladeRef.current.position.x = act03State.bladeX;
      bladeRef.current.visible = act03State.bladeOpacity > 0;

      const glow = bladeRef.current.children[0] as THREE.Mesh;
      if (glow && glow.material) {
        (glow.material as THREE.MeshBasicMaterial).opacity =
          (0.8 + 0.2 * Math.sin(t * 30.0)) * act03State.bladeOpacity;
      }
    }

    // 2. Slicing collision and inertia separation
    const cutTrigger = p > 0.25;
    const cutProgress = Math.max(0, (p - 0.25) * 1.8);

    if (leftHalfRef.current && rightHalfRef.current) {
      if (cutTrigger) {
        leftHalfRef.current.position.x = -HALF_W / 2 + act03State.leftCutX * 0.8;
        leftHalfRef.current.position.y = act03State.leftCutX * 0.08;
        leftHalfRef.current.rotation.z = act03State.leftCutX * 0.12;
        leftHalfRef.current.rotation.y = -act03State.leftCutX * 0.15;

        rightHalfRef.current.position.x = HALF_W / 2 + act03State.rightCutX * 0.8;
        rightHalfRef.current.position.y = -act03State.rightCutX * 0.06;
        rightHalfRef.current.rotation.z = act03State.rightCutX * 0.10;
        rightHalfRef.current.rotation.y = -act03State.rightCutX * 0.14;
      } else {
        leftHalfRef.current.position.set(-HALF_W / 2, 0, 0);
        leftHalfRef.current.rotation.set(0, 0, 0);
        rightHalfRef.current.position.set(HALF_W / 2, 0, 0);
        rightHalfRef.current.rotation.set(0, 0, 0);
      }

      // Thermal heat glow on cut edge
      const leftMesh = leftHalfRef.current.children[0] as THREE.Mesh;
      const rightMesh = rightHalfRef.current.children[0] as THREE.Mesh;
      const heat = cutTrigger ? Math.max(0, 1.4 - cutProgress * 1.5) : 0;
      if (leftMesh && leftMesh.material) {
        (leftMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = heat;
        (leftMesh.material as THREE.MeshStandardMaterial).emissive.set("#FF5F1F");
      }
      if (rightMesh && rightMesh.material) {
        (rightMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = heat;
        (rightMesh.material as THREE.MeshStandardMaterial).emissive.set("#FF5F1F");
      }
    }

    // Slicing Shockwave Ring
    if (shockwaveRef.current) {
      const waveP = Math.max(0, (p - 0.32) * 3.5);
      const isWaveActive = waveP > 0 && waveP < 1.0;
      shockwaveRef.current.visible = isWaveActive;
      if (isWaveActive) {
        const s = 0.4 + waveP * 6.0;
        shockwaveRef.current.scale.set(s, s, 1);
        (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity =
          (1.0 - waveP) * 0.9;
      }
    }

    // Sparks physics
    if (sparksRef.current) {
      const isSparkActive = cutTrigger && cutProgress < 0.8;
      sparksRef.current.visible = isSparkActive;
      if (isSparkActive) {
        const geom = sparksRef.current.geometry;
        const posAttr = geom.attributes.position as THREE.BufferAttribute;
        const count = sparkPositions.length / 3;
        for (let i = 0; i < count; i++) {
          let x = posAttr.getX(i);
          let y = posAttr.getY(i);
          let z = posAttr.getZ(i);

          x += sparkVelocities[i * 3] * 0.016;
          y += sparkVelocities[i * 3 + 1] * 0.016 - 0.02;
          z += sparkVelocities[i * 3 + 2] * 0.016;

          posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
      }
    }

    // Timeline blocks assembly
    if (timelineGroupRef.current) {
      timelineGroupRef.current.scale.setScalar(act03State.timelineScale);
      timelineGroupRef.current.position.y = -1.2 + act03State.timelineScale * 0.2;

      if (playheadRef.current) {
        const isPlayheadActive = act03State.timelineScale > 0.2;
        playheadRef.current.visible = isPlayheadActive;
        if (isPlayheadActive) {
          playheadRef.current.position.x = -6.0 + p * 12.0;
        }
      }

      timelineGroupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.opacity = THREE.MathUtils.lerp(
            mat.opacity,
            act03State.timelineProgress,
            0.12
          );
        }
      });
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Studio Workstation Accent Point Lights (Cyan + Warm Amber matching user photo) */}
      <pointLight position={[-2.5, 1.5, 1.2]} intensity={14} color="#38bdf8" distance={8} />
      <pointLight position={[2.5, -1.0, 1.2]} intensity={12} color="#f59e0b" distance={8} />

      {/* Laser Slicing Blade Assembly */}
      <group ref={bladeRef} position={[0, 0, 0.08]} visible={false}>
        <mesh>
          <planeGeometry args={[0.03, 5.5]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh>
          <planeGeometry args={[0.12, 5.5]} />
          <meshBasicMaterial
            color="#FF5F1F"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Slicing Shockwave Ring */}
      <mesh ref={shockwaveRef} position={[0, 0, 0.06]} visible={false}>
        <ringGeometry args={[0.05, 0.15, 32]} />
        <meshBasicMaterial
          color="#FF5F1F"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Hero Frame: Left Sliced Half (Editor Workspace) */}
      <group ref={leftHalfRef} position={[-HALF_W / 2, 0, 0]}>
        <mesh geometry={leftGeom}>
          <meshStandardMaterial
            map={editorTexture}
            roughness={0.25}
            metalness={0.15}
            emissive="#ffffff"
            emissiveMap={editorTexture}
            emissiveIntensity={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(HALF_W, CARD_H)]} />
          <lineBasicMaterial color="#FF5F1F" transparent opacity={0.65} />
        </lineSegments>
      </group>

      {/* Hero Frame: Right Sliced Half (Editor Workspace) */}
      <group ref={rightHalfRef} position={[HALF_W / 2, 0, 0]}>
        <mesh geometry={rightGeom}>
          <meshStandardMaterial
            map={editorTexture}
            roughness={0.25}
            metalness={0.15}
            emissive="#ffffff"
            emissiveMap={editorTexture}
            emissiveIntensity={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(HALF_W, CARD_H)]} />
          <lineBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </lineSegments>
      </group>

      {/* Floating Holographic Studio HUD Brackets */}
      <group position={[0, 0, 0.05]}>
        {/* Top Header Plate */}
        <mesh position={[0, CARD_H / 2 + 0.18, 0]}>
          <planeGeometry args={[CARD_W * 0.95, 0.025]} />
          <meshBasicMaterial color="#FF5F1F" transparent opacity={0.8} />
        </mesh>
        {/* Bottom Footer Plate */}
        <mesh position={[0, -CARD_H / 2 - 0.18, 0]}>
          <planeGeometry args={[CARD_W * 0.95, 0.025]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Cut Sparks */}
      <points ref={sparksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#FF5F1F"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Futuristic 3D Timeline Track Ribbon */}
      <group ref={timelineGroupRef} scale={0.001}>
        <mesh position={[0, -2.1, 0]}>
          <boxGeometry args={[15.0, 0.04, 0.04]} />
          <meshBasicMaterial color="#FF5F1F" />
        </mesh>

        <mesh ref={playheadRef} position={[0, -2.1, 0.08]} visible={false}>
          <boxGeometry args={[0.04, 0.6, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {timelineBlocks.map((blk, idx) => (
          <mesh key={idx} position={[blk.x, blk.y, blk.z]}>
            <boxGeometry args={[blk.width, 0.35, 0.08]} />
            <meshStandardMaterial
              color={blk.isCut ? "#FF5F1F" : "#1a1f2c"}
              emissive={blk.isCut ? "#FF5F1F" : "#000000"}
              emissiveIntensity={blk.isCut ? 0.8 : 0.0}
              roughness={0.4}
              transparent
              opacity={0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
