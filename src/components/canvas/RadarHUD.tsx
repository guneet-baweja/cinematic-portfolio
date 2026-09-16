import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "../../shaders/register";
import { scrollState } from "../../lib/scrollState";
import { HUD_COLOR } from "../../lib/themeState";
import type { HudMaterial } from "../../shaders/hudMaterial";

type HudMaterialImpl = InstanceType<typeof HudMaterial>;

interface Props {
  visible: boolean;
  lite: boolean;
}

/** Smooth continuous circles — the "concentric thin wireframe rings". */
function WireRing({ radius, opacity }: { radius: number; opacity: number }) {
  const line = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: HUD_COLOR, transparent: true, opacity });
    return new THREE.Line(geom, mat);
  }, [radius, opacity]);

  return <primitive object={line} />;
}

/** A ring built from individual rectangular segments with gaps — the "dashed" rings. */
function DashRing({
  radius,
  count,
  dashEvery,
  size,
  speed,
}: {
  radius: number;
  count: number;
  dashEvery: number;
  size: [number, number];
  speed: number;
}) {
  const group = useRef<THREE.Group>(null);
  const materials = useRef<HudMaterialImpl[]>([]);

  const segments = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return {
          visible: i % dashEvery !== 0,
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
          rotation: angle + Math.PI / 2,
        };
      }).filter((s) => s.visible),
    [radius, count, dashEvery]
  );

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.z += delta * speed;
    materials.current.forEach((mat) => {
      if (mat) mat.uTime = state.clock.elapsedTime;
    });
  });

  return (
    <group ref={group}>
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.position} rotation={[0, 0, seg.rotation]}>
          <planeGeometry args={size} />
          <hudMaterial
            ref={(m: HudMaterialImpl | null) => {
              if (m) materials.current[i] = m;
            }}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

export function RadarHUD({ visible, lite }: Props) {
  const group = useRef<THREE.Group>(null);
  const sweepRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current || !visible) return;
    const heroProgress = scrollState.hero.progress;

    // Very slight pointer parallax — this reads as a flat instrument
    // panel, not a tumbling 3D object, so tilt stays minimal.
    if (!lite) {
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        scrollState.pointer.y * 0.08,
        4,
        delta
      );
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        scrollState.pointer.x * 0.1,
        4,
        delta
      );
    }

    const scale = THREE.MathUtils.lerp(1, 0.6, heroProgress);
    group.current.scale.setScalar(scale);
    group.current.position.z = THREE.MathUtils.lerp(0, -1.2, heroProgress);
    group.current.visible = heroProgress < 0.75;

    if (sweepRef.current) sweepRef.current.rotation.z -= delta * (0.5 + heroProgress * 1.2);
  });

  const sweepLine = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.7, 0, 0)]);
    const mat = new THREE.LineBasicMaterial({ color: HUD_COLOR, transparent: true, opacity: 0.55 });
    return new THREE.Line(geom, mat);
  }, []);

  return (
    <group ref={group}>
      {/* smooth concentric rings */}
      <WireRing radius={0.75} opacity={0.5} />
      <WireRing radius={1.35} opacity={0.35} />
      <WireRing radius={2.7} opacity={0.22} />

      {/* spoked dial ring — a low-segment wireframe ring reads as radar spokes */}
      <mesh>
        <ringGeometry args={[2.0, 2.02, 16, 1]} />
        <meshBasicMaterial color={HUD_COLOR} wireframe transparent opacity={0.4} />
      </mesh>

      {/* dashed rotating segment rings, each at its own speed/direction */}
      <DashRing radius={1.05} count={28} dashEvery={4} size={[0.05, 0.14]} speed={0.16} />
      <DashRing radius={1.7} count={40} dashEvery={3} size={[0.045, 0.1]} speed={-0.11} />
      <DashRing radius={2.35} count={56} dashEvery={5} size={[0.035, 0.08]} speed={0.07} />

      {/* radar sweep */}
      <group ref={sweepRef}>
        <primitive object={sweepLine} />
      </group>

      {/* center dot */}
      <mesh>
        <circleGeometry args={[0.035, 24]} />
        <meshBasicMaterial color={HUD_COLOR} />
      </mesh>
    </group>
  );
}
