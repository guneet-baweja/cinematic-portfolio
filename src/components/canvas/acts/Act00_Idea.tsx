import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { act01State } from "../../../lib/timeline/gsapChoreography";

/**
 * ACT 00: THE IDEA
 * ----------------
 * Starts in absolute darkness.
 * A microscopic white particle appears and pulses.
 * Expands into a 16:9 film frame.
 * Multiplies into dozens then hundreds of frames forming a monolithic structure.
 * Driven strictly by scroll progress in Act 0.
 */
export function Act00_Idea({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const primaryFrameRef = useRef<THREE.LineSegments>(null);
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  const COUNT = 160;

  // Precompute instance transformation matrices for the architectural frame lattice
  const { matrices } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < COUNT; i++) {
      const radius = 2.5 + Math.random() * 7.0;
      const angle = (i / COUNT) * Math.PI * 8.0;
      const y = (Math.random() - 0.5) * 8.0;
      dummy.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      dummy.rotation.set(
        Math.sin(i * 0.1) * 0.3,
        angle + Math.PI / 2,
        Math.cos(i * 0.1) * 0.2
      );
      const s = 0.4 + Math.random() * 0.6;
      dummy.scale.set(s * 1.77, s, 1);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
    }
    return { matrices: mats };
  }, []);

  // Initialize instances
  const hasInit = useRef(false);
  if (instancedRef.current && !hasInit.current) {
    for (let i = 0; i < COUNT; i++) {
      instancedRef.current.setMatrixAt(i, matrices[i]);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
    hasInit.current = true;
  }

  // Frame edge geometry (16:9 aspect ratio)
  const frameGeometry = useMemo(() => {
    const w = 1.77 * 0.5;
    const h = 1.0 * 0.5;
    const pts = [
      new THREE.Vector3(-w, -h, 0),
      new THREE.Vector3(w, -h, 0),
      new THREE.Vector3(w, -h, 0),
      new THREE.Vector3(w, h, 0),
      new THREE.Vector3(w, h, 0),
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(-w, -h, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  // Dispose custom raw BufferGeometry on unmount
  useEffect(() => {
    return () => {
      frameGeometry.dispose();
    };
  }, [frameGeometry]);


  useFrame((state) => {
    if (!groupRef.current) return;

    // Calculate visibility envelope for Act 01
    const isAct1 = scrollState.act === 1;
    const isTransitionTo2 = scrollState.act === 2 && scrollState.actProgress < 0.3;
    const isVisible = isAct1 || isTransitionTo2;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const p = isAct1 ? scrollState.actProgress : 1.0;
    const t = state.clock.elapsedTime;

    // 1. Genesis Particle Pulse (Choreographed by GSAP act01Timeline)
    if (particleRef.current) {
      const particleScale = act01State.particleScale * (1.0 + 0.25 * Math.sin(t * 8.0));
      particleRef.current.scale.setScalar(p < 0.7 ? particleScale : 0.0001);
      const mat = particleRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = p < 0.05 ? 0.4 + 0.6 * Math.sin(t * 4.0) : act01State.particleOpacity;
    }

    // 2. Primary 16:9 Film Frame Expansion (Choreographed by GSAP act01Timeline)
    if (primaryFrameRef.current) {
      const s = act01State.frameScale;
      primaryFrameRef.current.scale.set(s, s, s);
      const mat = primaryFrameRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = act01State.frameOpacity;
      primaryFrameRef.current.rotation.z = Math.sin(t * 0.5) * 0.03;
    }

    // 3. Multiplication into Monolithic Lattice (Choreographed by GSAP act01Timeline)
    if (instancedRef.current) {
      instancedRef.current.scale.setScalar(act01State.latticeScale);
      const mat = instancedRef.current.material as THREE.LineBasicMaterial;
      // Fade gracefully when entering Act 02
      const exitFade = isAct1 ? 1.0 : Math.max(0, 1.0 - scrollState.actProgress / 0.3);
      mat.opacity = act01State.latticeOpacity * exitFade;

      // Deterministic rotation from GSAP timeline + bounded ambient wobble + velocity momentum
      instancedRef.current.rotation.y =
        act01State.latticeRotY + Math.sin(t * 0.35) * 0.06 + scrollState.velocity * 0.15;
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Genesis microscopic core particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent />
      </mesh>

      {/* Primary Expanding 16:9 Frame */}
      <lineSegments ref={primaryFrameRef} geometry={frameGeometry}>
        <lineBasicMaterial color="#FF5F1F" transparent linewidth={2} />
      </lineSegments>

      {/* Multiplied Instanced Frames */}
      <instancedMesh
        ref={instancedRef}
        args={[frameGeometry, undefined as any, COUNT]}
      >
        <lineBasicMaterial color="#d0d5dd" transparent opacity={0} />
      </instancedMesh>
    </group>
  );
}
