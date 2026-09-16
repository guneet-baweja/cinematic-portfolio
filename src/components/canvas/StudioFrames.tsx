import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../lib/scrollState";

interface Props {
  accent: THREE.Color;
  visible: boolean;
  lite: boolean;
}

const FRAME_COUNT = 9;
const DEPTH_SPAN = 26;

export function StudioFrames({ accent, visible, lite }: Props) {
  const group = useRef<THREE.Group>(null);

  const frames = useMemo(
    () =>
      Array.from({ length: FRAME_COUNT }, (_, i) => ({
        position: [
          Math.sin(i * 2.1) * 2.6,
          Math.cos(i * 1.4) * 1.5,
          -i * (DEPTH_SPAN / FRAME_COUNT),
        ] as [number, number, number],
        rotation: [0, Math.sin(i) * 0.3, 0] as [number, number, number],
        size: [1.6 + (i % 3) * 0.5, 1.0 + (i % 2) * 0.4] as [number, number],
      })),
    []
  );

  useFrame((_, delta) => {
    if (!group.current || !visible) return;
    const progress = scrollState.showcase.progress;

    // Move the whole scene toward the camera as the section scrolls —
    // cheaper and more stable than animating a real camera rig.
    group.current.position.z = THREE.MathUtils.lerp(0, DEPTH_SPAN * 0.92, progress);
    group.current.rotation.y = THREE.MathUtils.lerp(-0.15, 0.15, progress);

    if (!lite) {
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        scrollState.pointer.y * 0.06,
        4,
        delta
      );
    }
  });

  return (
    <group ref={group}>
      {frames.map((f, i) => (
        <group key={i} position={f.position} rotation={f.rotation}>
          <mesh>
            <planeGeometry args={f.size} />
            <meshBasicMaterial color="#050506" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(...f.size)]} />
            <lineBasicMaterial color={accent} transparent opacity={0.7} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
