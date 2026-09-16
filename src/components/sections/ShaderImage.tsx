import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import "../../shaders/register";
import { scrollState } from "../../store/scrollState";
import { ErrorBoundary } from "../global/ErrorBoundary";
import type { DistortionMaterial } from "../../shaders/imageDistortion";

type DistortionMaterialImpl = InstanceType<typeof DistortionMaterial>;

function isWebGLAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function Plane({ src }: { src: string }) {
  const texture = useTexture(src);
  const material = useRef<DistortionMaterialImpl>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!material.current) return;
    material.current.uTime = state.clock.elapsedTime;
    material.current.uVelocity = THREE.MathUtils.damp(
      material.current.uVelocity,
      scrollState.velocity,
      6,
      state.clock.getDelta()
    );
    material.current.uPointer.lerp(
      new THREE.Vector2(scrollState.pointer.x, scrollState.pointer.y),
      0.05
    );
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <distortionMaterial ref={material} uTexture={texture} />
    </mesh>
  );
}

export function ShaderImage({ src, className }: { src: string; className?: string }) {
  const webglSupported = useMemo(() => isWebGLAvailable(), []);

  const fallback = (
    <img
      src={src}
      className={className}
      alt="Real estate showcase"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );

  if (!webglSupported) {
    return fallback;
  }

  return (
    <ErrorBoundary fallback={fallback} name="ShaderImage">
      <Canvas
        className={className}
        dpr={[1, 1.6]}
        orthographic
        camera={{ zoom: 100, position: [0, 0, 5] }}
        gl={{ antialias: true }}
      >
        <Plane src={src} />
      </Canvas>
    </ErrorBoundary>
  );
}
