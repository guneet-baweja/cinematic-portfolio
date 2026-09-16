import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { act08State } from "../../../lib/timeline/gsapChoreography";

/**
 * ACT 07: THE IMPOSSIBLE EDIT
 * ---------------------------
 * A cinematic physical environment:
 * - Glass falls, shatters on forward scroll, reconstructs on reverse scroll
 * - Character walks, jumps, and suspends in mid-air when scrolling stops
 * - Gravity ceases; studio props float upwards
 * - The room's architectural walls physically hinge and fold inward (spatial origami)
 *   compressing 3D reality into a single 2D film frame.
 */
export function Act07_ImpossibleRoom({ active }: { active: boolean }) {
  const roomGroupRef = useRef<THREE.Group>(null);
  const tumblerRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Group>(null);
  const floatingPropsRef = useRef<THREE.Group>(null);

  // Architectural folding wall refs
  const leftWallRef = useRef<THREE.Group>(null);
  const rightWallRef = useRef<THREE.Group>(null);
  const ceilingRef = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.Group>(null);
  const flatFrameBorderRef = useRef<THREE.LineSegments>(null);

  // Floating studio props (clapperboard, camera, lens case)
  const PROPS_COUNT = 8;
  const propsInitial = useMemo(() => {
    return Array.from({ length: PROPS_COUNT }, () => ({
      x: (Math.random() - 0.5) * 4.0,
      y: -1.2 + Math.random() * 0.4,
      z: (Math.random() - 0.5) * 3.5,
      rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
    }));
  }, []);

  useFrame((state) => {
    if (!roomGroupRef.current) return;

    const isAct8 = scrollState.act === 8;
    const isAct7End = scrollState.act === 7 && scrollState.actProgress > 0.8;
    const isAct9Start = scrollState.act === 9 && scrollState.actProgress < 0.2;
    const isVisible = isAct8 || isAct7End || isAct9Start;

    if (!isVisible) {
      roomGroupRef.current.visible = false;
      return;
    }
    roomGroupRef.current.visible = true;

    const p = isAct8 ? scrollState.actProgress : isAct9Start ? 1.0 : 0.0;
    const t = state.clock.elapsedTime;

    // 1. Tumbler Falling & Reconstructing (Choreographed by GSAP act08Timeline)
    if (tumblerRef.current) {
      tumblerRef.current.position.y = act08State.tumblerY;
      tumblerRef.current.rotation.z = act08State.tumblerRotZ;

      const shards = tumblerRef.current.children;
      shards.forEach((sh, idx) => {
        if (act08State.shardScatter > 0.01) {
          const scatter = act08State.shardScatter * 1.8;
          sh.position.x = (idx % 2 === 0 ? 1 : -1) * scatter * 0.35;
          sh.position.z = (idx > 1 ? 1 : -1) * scatter * 0.35;
        } else {
          sh.position.set(0, 0, 0);
        }
      });
    }

    // 2. Character Walking & Mid-Air Suspension (Choreographed by GSAP act08Timeline)
    if (characterRef.current) {
      characterRef.current.position.z = act08State.characterZ;
      characterRef.current.position.y = -1.2 + act08State.jumpElevation + Math.abs(Math.sin(p * 12.0)) * (1.0 - act08State.jumpElevation) * 0.06;
    }

    // 3. Zero Gravity floating props (Choreographed by GSAP act08Timeline)
    if (floatingPropsRef.current) {
      const antiGrav = act08State.gravityInversion;
      floatingPropsRef.current.children.forEach((mesh, idx) => {
        const init = propsInitial[idx];
        mesh.position.y = init.y + antiGrav * (1.6 + idx * 0.25) + Math.sin(t * 1.5 + idx) * 0.12;
        mesh.rotation.x = init.rotAxis.x * antiGrav * Math.PI * 2.0 + Math.sin(t * 0.8 + idx) * 0.1;
        mesh.rotation.y = init.rotAxis.y * antiGrav * Math.PI * 2.0 + Math.cos(t * 0.8 + idx) * 0.1;
        mesh.rotation.z = init.rotAxis.z * antiGrav * Math.PI;
      });
    }

    // 4. Architectural Origami Room Fold (Choreographed by GSAP act08Timeline)
    // The 4 walls hinge 90 degrees inward, collapsing 3D space into a flat 2D film frame!
    const fold = act08State.wallFoldAngle;
    if (fold > 0.01) {

      if (leftWallRef.current) {
        leftWallRef.current.rotation.y = fold * (Math.PI / 2);
      }
      if (rightWallRef.current) {
        rightWallRef.current.rotation.y = -fold * (Math.PI / 2);
      }
      if (ceilingRef.current) {
        ceilingRef.current.rotation.x = fold * (Math.PI / 2);
      }
      if (floorRef.current) {
        floorRef.current.rotation.x = -fold * (Math.PI / 2);
      }

      // Compression into flat frame
      if (flatFrameBorderRef.current) {
        flatFrameBorderRef.current.visible = true;
        const bMat = flatFrameBorderRef.current.material as THREE.LineBasicMaterial;
        bMat.opacity = fold * 0.95;
      }

      const scaleZ = Math.max(0.001, 1.0 - fold * 0.999);
      roomGroupRef.current.scale.set(1.0 - fold * 0.15, 1.0 - fold * 0.15, scaleZ);
    } else {
      if (leftWallRef.current) leftWallRef.current.rotation.y = 0;
      if (rightWallRef.current) rightWallRef.current.rotation.y = 0;
      if (ceilingRef.current) ceilingRef.current.rotation.x = 0;
      if (floorRef.current) floorRef.current.rotation.x = 0;
      if (flatFrameBorderRef.current) flatFrameBorderRef.current.visible = false;
      roomGroupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={roomGroupRef} visible={active}>
      {/* 1. Left Folding Wall (hinged at x = -3.0) */}
      <group position={[-3.0, 0, 0]}>
        <group ref={leftWallRef}>
          <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[6.0, 4.0]} />
            <meshStandardMaterial
              color="#0f131a"
              roughness={0.8}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(6.0, 4.0)]} />
            <lineBasicMaterial color="#FF5F1F" transparent opacity={0.35} />
          </lineSegments>
        </group>
      </group>

      {/* 2. Right Folding Wall (hinged at x = 3.0) */}
      <group position={[3.0, 0, 0]}>
        <group ref={rightWallRef}>
          <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[6.0, 4.0]} />
            <meshStandardMaterial
              color="#0f131a"
              roughness={0.8}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(6.0, 4.0)]} />
            <lineBasicMaterial color="#FF5F1F" transparent opacity={0.35} />
          </lineSegments>
        </group>
      </group>

      {/* 3. Ceiling Folding Panel (hinged at y = 2.0) */}
      <group position={[0, 2.0, 0]}>
        <group ref={ceilingRef}>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6.0, 6.0]} />
            <meshStandardMaterial
              color="#0c0e14"
              roughness={0.8}
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(6.0, 6.0)]} />
            <lineBasicMaterial color="#383e4a" transparent opacity={0.4} />
          </lineSegments>
        </group>
      </group>

      {/* 4. Floor Folding Panel (hinged at y = -2.0) */}
      <group position={[0, -2.0, 0]}>
        <group ref={floorRef}>
          <gridHelper args={[6.0, 12, "#FF5F1F", "#22252a"]} />
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6.0, 6.0]} />
            <meshStandardMaterial
              color="#090c12"
              roughness={0.9}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>

      {/* 5. Back Wall */}
      <mesh position={[0, 0, -3.0]}>
        <planeGeometry args={[6.0, 4.0]} />
        <meshStandardMaterial color="#080a0f" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 6. The Resulting Compressed 2D Film Frame (Appears at climax of fold) */}
      <lineSegments ref={flatFrameBorderRef} position={[0, 0, -2.95]} visible={false}>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.77 * 3.2, 1.0 * 3.2)]} />
        <lineBasicMaterial color="#FF5F1F" transparent opacity={0} linewidth={2} />
      </lineSegments>

      {/* Falling / Reconstructing Tumbler */}
      <group ref={tumblerRef} position={[0, 0.8, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.1, 0.45, 12]} />
          <meshPhysicalMaterial
            color="#93c5fd"
            transmission={0.9}
            roughness={0.1}
            ior={1.5}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh position={[0.06, 0, 0]}>
          <coneGeometry args={[0.08, 0.15, 4]} />
          <meshPhysicalMaterial color="#93c5fd" transmission={0.8} roughness={0.1} />
        </mesh>
        <mesh position={[-0.06, 0, 0]}>
          <coneGeometry args={[0.07, 0.12, 4]} />
          <meshPhysicalMaterial color="#93c5fd" transmission={0.8} roughness={0.1} />
        </mesh>
      </group>

      {/* Walking / Jumping Suspended Character Figure */}
      <group ref={characterRef} position={[0, -1.2, -2.0]}>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 0.9, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>

      {/* Floating Anti-Gravity Studio Props */}
      <group ref={floatingPropsRef}>
        {propsInitial.map((pr, idx) => (
          <mesh key={idx} position={[pr.x, pr.y, pr.z]}>
            <boxGeometry args={[0.3, 0.2, 0.25]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? "#FF5F1F" : "#3b4252"}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
