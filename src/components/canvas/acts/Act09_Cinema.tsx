import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { act10State } from "../../../lib/timeline/gsapChoreography";

/**
 * ACT 09: THE CINEMA
 * ------------------
 * Recursive multi-tier pullback:
 * Screen → Futuristic Cinema Auditorium → Floating Room → Video Frame → Void Loop.
 * Seamlessly loops back to the microscopic genesis point from Act 00.
 */
export function Act09_Cinema({ active }: { active: boolean }) {
  const masterGroupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const cinemaSeatsRef = useRef<THREE.Group>(null);
  const floatingCubeRef = useRef<THREE.Group>(null);
  const metaFrameRef = useRef<THREE.LineSegments>(null);
  const loopParticleRef = useRef<THREE.Mesh>(null);

  const screenTex = useTexture("/images/client-work-poster.jpg");

  useEffect(() => {
    screenTex.colorSpace = THREE.SRGBColorSpace;
  }, [screenTex]);


  const coneRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!masterGroupRef.current) return;

    const isAct3Cinema = scrollState.act === 3 && scrollState.actProgress > 0.60;
    const isVisible = isAct3Cinema;

    if (!isVisible) {
      masterGroupRef.current.visible = false;
      return;
    }
    masterGroupRef.current.visible = true;

    const p = Math.max(0, Math.min(1, (scrollState.actProgress - 0.60) / 0.40));
    const t = state.clock.elapsedTime;

    // Camera pullback emulation driven by GSAP act10Timeline: scale master group from 1.0 down to 0.002
    masterGroupRef.current.scale.setScalar(act10State.masterScale);

    // Subtle rotation choreographed by GSAP
    masterGroupRef.current.rotation.y = act10State.rotationY;
    masterGroupRef.current.rotation.x = act10State.rotationX;

    // Living screen emissive glow + projector light beam shimmer (Category C Ambient)
    if (screenRef.current && screenRef.current.material) {
      const ambientScreenFlicker = 1.0 + 0.06 * Math.sin(t * 6.0);
      (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        act10State.screenEmissive * ambientScreenFlicker;
    }

    if (coneRef.current && coneRef.current.material) {
      const ambientBeamFlicker = 0.05 + 0.02 * Math.sin(t * 14.0) + 0.015 * Math.cos(t * 3.5);
      (coneRef.current.material as THREE.MeshBasicMaterial).opacity = ambientBeamFlicker;
    }

    // Meta film frame opacity
    if (metaFrameRef.current && metaFrameRef.current.material) {
      (metaFrameRef.current.material as THREE.LineBasicMaterial).opacity = act10State.metaFrameOpacity;
    }

    // Loop particle appears at the very end (p > 0.85)
    if (loopParticleRef.current) {
      loopParticleRef.current.visible = p > 0.85;
      if (p > 0.85) {
        const pulse = 1.0 + 0.3 * Math.sin(t * 8.0);
        loopParticleRef.current.scale.setScalar(pulse * act10State.loopParticleScale);
      }
    }
  });

  return (
    <group ref={masterGroupRef} visible={active}>
      {/* 1. Cinema Screen */}
      <mesh ref={screenRef} position={[0, 1.5, -4]}>
        <planeGeometry args={[1.77 * 3.5, 1.0 * 3.5]} />
        <meshStandardMaterial
          map={screenTex}
          roughness={0.2}
          emissive="#ffffff"
          emissiveMap={screenTex}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Projection Light Cone from projector to screen */}
      <mesh ref={coneRef} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2.5, 8.0, 32, 1, true]} />
        <meshBasicMaterial
          color="#FF5F1F"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Auditorium Terraced Seats */}
      <group ref={cinemaSeatsRef} position={[0, -0.6, 0]}>
        {[-1.5, -0.8, -0.1, 0.6, 1.3].map((z, rowIdx) => (
          <group key={rowIdx} position={[0, rowIdx * 0.3, z]}>
            {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x, seatIdx) => (
              <mesh key={seatIdx} position={[x, 0, 0]}>
                <boxGeometry args={[0.6, 0.5, 0.4]} />
                <meshStandardMaterial color="#0c0e14" roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 3. Floating Architectural Room Envelope */}
      <group ref={floatingCubeRef}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(10.0, 7.0, 12.0)]} />
          <lineBasicMaterial color="#FF5F1F" transparent opacity={0.4} />
        </lineSegments>
      </group>

      {/* 4. Meta Film Frame enclosing the room */}
      <lineSegments ref={metaFrameRef} scale={[12.0, 7.0, 1]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.77, 1.0)]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.8} linewidth={2} />
      </lineSegments>

      {/* 5. Genesis Loop Particle (re-emerging at the center of the void) */}
      <mesh ref={loopParticleRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
