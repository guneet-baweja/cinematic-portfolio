import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { genesisState } from "../../../lib/timeline/genesisChoreography";
import { scrollState } from "../../../store/scrollState";
import "../../../shaders/genesisShaders";

const BRAND_PATHS = [
  "/assets/genesis/brands/after-effects.svg",
  "/assets/genesis/brands/premiere-pro.svg",
  "/assets/genesis/brands/davinci-resolve.svg",
  "/assets/genesis/brands/blender.svg",
  "/assets/genesis/brands/houdini.svg",
];

const MEMORY_TEXTURE_PATHS = [
  "/images/taj-hotel-poster.jpg",
  "/images/harrdy-sandhu-poster.jpg",
  "/images/bennett-night-poster.jpg",
];

/**
 * ACT G: GENESIS (Cinematic Prologue Sequence)
 * --------------------------------------------
 * 1. 2.5D Parallax Portrait with Depth Displacement & Fresnel Rim
 * 2. Push into eye + GLSL Iris Aperture Wipe
 * 3. POV inside Mind (INTELLIGENCE & CREATIVITY synapses)
 * 4. Nerve Conduit Descent
 * 5. Beating Heart with Projecting Work Memory Clips
 * 6. Bloodstream Tunnel with Floating Software Brand Marks
 * 7. Chronograph Watch with "ALWAYS DELIVER ON TIME." Engraving
 * 8. Iris Close to Pure Black Handoff into Act 00 Frame 0000
 */
export function ActGenesis({ active }: { active: boolean }) {
  const masterGroupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Textures
  const portraitTex = useTexture("/assets/genesis/portrait-cutout.png");
  const depthTex = useTexture("/assets/genesis/portrait-depth.png");
  const brandTexs = useTexture(BRAND_PATHS);
  const memoryTexs = useTexture(MEMORY_TEXTURE_PATHS);

  useEffect(() => {
    portraitTex.colorSpace = THREE.SRGBColorSpace;
    depthTex.colorSpace = THREE.NoColorSpace;
    brandTexs.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
    memoryTexs.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  }, [portraitTex, depthTex, brandTexs, memoryTexs]);

  // Refs for animated elements
  const portraitMeshRef = useRef<THREE.Mesh>(null);
  const portraitMatRef = useRef<any>(null);
  const apertureRef = useRef<THREE.Mesh>(null);
  const apertureMatRef = useRef<any>(null);

  // Mind Refs
  const mindGroupRef = useRef<THREE.Group>(null);
  const synapseLinesRef = useRef<THREE.LineSegments>(null);

  // Heart Refs
  const heartGroupRef = useRef<THREE.Group>(null);
  const heartMeshRef = useRef<THREE.Mesh>(null);

  // Bloodstream Refs
  const streamGroupRef = useRef<THREE.Group>(null);
  const brandMeshRefs = useRef<(THREE.Group | null)[]>([]);

  // Watch Refs
  const watchGroupRef = useRef<THREE.Group>(null);
  const secondHandRef = useRef<THREE.Mesh>(null);
  const engravingGroupRef = useRef<THREE.Group>(null);

  // 1. Synapse Curve Geometry between Intelligence (left) and Creativity (right)
  const synapseCurves = useMemo(() => {
    const list: THREE.Vector3[] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const p0 = new THREE.Vector3(-1.8, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.0);
      const p3 = new THREE.Vector3(1.8, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.0);
      const p1 = new THREE.Vector3(-0.6, (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 1.5);
      const p2 = new THREE.Vector3(0.6, (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 1.5);

      const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
      const pts = curve.getPoints(24);
      for (let j = 0; j < pts.length - 1; j++) {
        list.push(pts[j], pts[j + 1]);
      }
    }
    return list;
  }, []);

  const synapseGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(synapseCurves);
    return geom;
  }, [synapseCurves]);

  // 2. Ambient Floating Dust Particles for Portrait Beat
  const dustPositions = useMemo(() => {
    const count = 180;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 6.0;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3.0 + 1.0;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!masterGroupRef.current) return;

    if (!active) {
      masterGroupRef.current.visible = false;
      return;
    }
    masterGroupRef.current.visible = true;

    const t = state.clock.elapsedTime;
    const pointer = scrollState.pointer;

    // -------------------------------------------------------------
    // 3.1 & 3.2: PORTRAIT PARALLAX & EYE ZOOM
    // -------------------------------------------------------------
    if (portraitMatRef.current) {
      portraitMatRef.current.uTime = t;
      portraitMatRef.current.uOpacity = genesisState.portraitOpacity;
      portraitMatRef.current.uPointer.set(pointer.x * 0.8, pointer.y * 0.8);
    }
    if (portraitMeshRef.current) {
      portraitMeshRef.current.visible = genesisState.portraitOpacity > 0.005;
      // Subtle idle rotation (+- 4 deg)
      portraitMeshRef.current.rotation.y = pointer.x * 0.07 + Math.sin(t * 0.8) * 0.015;
      portraitMeshRef.current.rotation.x = -pointer.y * 0.06 + Math.cos(t * 0.7) * 0.012;
    }

    // Iris Aperture Wipe in front of camera
    if (apertureMatRef.current && apertureRef.current) {
      apertureRef.current.visible = genesisState.irisApertureOpen > 0.01 && genesisState.irisApertureOpen < 0.99;
      apertureMatRef.current.uProgress = genesisState.irisApertureOpen;
      apertureMatRef.current.uAspect = viewport.aspect;
    }

    // -------------------------------------------------------------
    // 3.3: MIND & SYNAPSES
    // -------------------------------------------------------------
    if (mindGroupRef.current) {
      mindGroupRef.current.visible = genesisState.mindOpacity > 0.01;
      // Gentle floating drift
      mindGroupRef.current.position.y = Math.sin(t * 1.5) * 0.08;
    }

    // -------------------------------------------------------------
    // 3.5: BEATING HEART & VIDEO MEMORY PROJECTIONS
    // -------------------------------------------------------------
    if (heartGroupRef.current) {
      heartGroupRef.current.visible = genesisState.heartOpacity > 0.01;
      const pulse = 1.0 + Math.sin(t * 4.5) * 0.08 + (Math.sin(t * 9.0) > 0.7 ? 0.06 : 0.0);
      heartGroupRef.current.scale.setScalar(genesisState.heartScale * pulse);
    }

    // -------------------------------------------------------------
    // 3.6: BLOODSTREAM & SOFTWARE BRAND CELLS
    // -------------------------------------------------------------
    if (streamGroupRef.current) {
      streamGroupRef.current.visible = genesisState.bloodstreamOpacity > 0.01;
      // Animate the 5 software brand mark cells
      const bp = genesisState.brandProgress; // 0 to 5
      brandMeshRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        // Staggered passage along Z axis: each mark appears and floats past
        const offset = idx * 1.0;
        const localZ = (bp - offset) * 3.5 - 4.0;
        ref.position.z = localZ;
        ref.position.x = Math.sin(idx * 1.8 + t) * 1.2;
        ref.position.y = Math.cos(idx * 1.5 + t) * 0.8;
        ref.rotation.y = t * 0.8 + idx;
        ref.rotation.x = Math.sin(t * 0.6 + idx) * 0.4;
      });
    }

    // -------------------------------------------------------------
    // 3.7: CHRONOGRAPH WATCH & ENGRAVING
    // -------------------------------------------------------------
    if (watchGroupRef.current) {
      watchGroupRef.current.visible = genesisState.watchOpacity > 0.01;
      watchGroupRef.current.scale.setScalar(genesisState.watchScale);
      watchGroupRef.current.position.z = genesisState.watchZ;
      // Gentle wrist angle
      watchGroupRef.current.rotation.x = -0.15 + Math.sin(t * 0.8) * 0.03;
      watchGroupRef.current.rotation.y = 0.2 + pointer.x * 0.05;

      // Orange second hand continuous tick
      if (secondHandRef.current) {
        secondHandRef.current.rotation.z = -t * 1.8;
      }
    }
  });

  return (
    <group ref={masterGroupRef}>
      {/* =========================================================
          BEAT 3.1 & 3.2: 2.5D PARALLAX PORTRAIT & EYE APERTURE
          ========================================================= */}
      <mesh ref={portraitMeshRef} position={[0, 0, 0]}>
        <planeGeometry args={[3.6, 3.6, 128, 128]} />
        <portrait25DMaterial
          ref={portraitMatRef}
          uTexture={portraitTex}
          uDepthMap={depthTex}
          uDisplacementScale={0.38}
          uRimColor={new THREE.Color("#FF5F1F")}
          uRimIntensity={1.4}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ambient Cosmic Dust Motes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#FF5F1F"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Iris Aperture Wipe Curtain */}
      <mesh ref={apertureRef} position={[0, 0, 2.5]}>
        <planeGeometry args={[8, 8]} />
        <irisApertureMaterial
          ref={apertureMatRef}
          uColor={new THREE.Color("#050608")}
          uRimColor={new THREE.Color("#FF5F1F")}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* =========================================================
          BEAT 3.3: INSIDE THE MIND (INTELLIGENCE & CREATIVITY)
          ========================================================= */}
      <group ref={mindGroupRef} position={[0, 0, -2.0]}>
        {/* Left Hemisphere: INTELLIGENCE */}
        <group position={[-1.8, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.65, 32, 32]} />
            <meshStandardMaterial
              color="#0d1b2a"
              emissive="#1b4965"
              emissiveIntensity={0.8}
              roughness={0.2}
              wireframe
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.55, 24, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
          </mesh>
        </group>

        {/* Right Hemisphere: CREATIVITY */}
        <group position={[1.8, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.65, 32, 32]} />
            <meshStandardMaterial
              color="#2a0d0d"
              emissive="#FF5F1F"
              emissiveIntensity={0.9}
              roughness={0.2}
              wireframe
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.55, 24, 24]} />
            <meshBasicMaterial color="#FF5F1F" transparent opacity={0.4} />
          </mesh>
        </group>

        {/* Firing Synapse Connections */}
        <lineSegments ref={synapseLinesRef} geometry={synapseGeom}>
          <lineBasicMaterial
            color="#FF5F1F"
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {/* =========================================================
          BEAT 3.5: THE HEART & VIDEO MEMORY CLIPS
          ========================================================= */}
      <group ref={heartGroupRef} position={[0, 0, -0.5]}>
        {/* Stylized Glowing Organic Heart Mesh */}
        <mesh ref={heartMeshRef}>
          <dodecahedronGeometry args={[0.85, 2]} />
          <meshStandardMaterial
            color="#400505"
            emissive="#FF4500"
            emissiveIntensity={1.2}
            roughness={0.3}
            metalness={0.5}
            wireframe
          />
        </mesh>
        <pointLight position={[0, 0, 0]} color="#FF4500" intensity={15} distance={6} />

        {/* 3 Projected Video Memory Panels Orbiting Heart */}
        {MEMORY_TEXTURE_PATHS.map((_, i) => {
          const angle = (i / 3) * Math.PI * 2;
          const x = Math.cos(angle) * 1.8;
          const y = Math.sin(angle) * 1.0;
          return (
            <group key={i} position={[x, y, (i - 1) * 0.4]} rotation={[0, -angle * 0.5, 0]}>
              <mesh>
                <planeGeometry args={[1.2, 0.68]} />
                <meshStandardMaterial
                  map={memoryTexs[i]}
                  emissive="#ffffff"
                  emissiveIntensity={0.2}
                  roughness={0.3}
                />
              </mesh>
              <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(1.2, 0.68)]} />
                <lineBasicMaterial color="#FF5F1F" linewidth={2} />
              </lineSegments>
            </group>
          );
        })}
      </group>

      {/* =========================================================
          BEAT 3.6: BLOODSTREAM & SOFTWARE BRAND CELLS
          ========================================================= */}
      <group ref={streamGroupRef} position={[0, 0, 0]}>
        {/* Ambient Red Stream Glow */}
        <pointLight position={[0, 0, -2]} color="#ff2200" intensity={20} distance={8} />

        {/* 5 Software Brand Mark Planes floating like cells */}
        {BRAND_PATHS.map((_, i) => (
          <group
            key={i}
            ref={(el) => {
              brandMeshRefs.current[i] = el;
            }}
            position={[0, 0, -10]}
          >
            <mesh>
              <planeGeometry args={[0.9, 0.9]} />
              <meshStandardMaterial
                map={brandTexs[i]}
                transparent
                emissive="#ffffff"
                emissiveIntensity={0.35}
                roughness={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Soft Glowing Outer Halo */}
            <mesh scale={[1.15, 1.15, 1]}>
              <planeGeometry args={[0.9, 0.9]} />
              <meshBasicMaterial
                color="#FF5F1F"
                transparent
                opacity={0.25}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================
          BEAT 3.7: CHRONOGRAPH WATCH & ENGRAVING
          ========================================================= */}
      <group ref={watchGroupRef} position={[0, 0, 0]}>
        {/* Outer Titanium Casing / Bezel */}
        <mesh>
          <ringGeometry args={[1.35, 1.6, 64]} />
          <meshStandardMaterial
            color="#22242a"
            metalness={0.9}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[1.35, 64]} />
          <meshStandardMaterial
            color="#08090c"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        {/* 12 Hour Ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = Math.sin(angle) * 1.15;
          const y = Math.cos(angle) * 1.15;
          return (
            <mesh key={i} position={[x, y, 0.01]} rotation={[0, 0, -angle]}>
              <planeGeometry args={[0.04, i % 3 === 0 ? 0.16 : 0.08]} />
              <meshBasicMaterial color={i === 0 ? "#FF5F1F" : "#ffffff"} />
            </mesh>
          );
        })}

        {/* Sub-Dials */}
        <mesh position={[-0.45, 0, 0.01]}>
          <ringGeometry args={[0.26, 0.28, 32]} />
          <meshBasicMaterial color="#444b58" />
        </mesh>
        <mesh position={[0.45, 0, 0.01]}>
          <ringGeometry args={[0.26, 0.28, 32]} />
          <meshBasicMaterial color="#444b58" />
        </mesh>

        {/* Hour and Minute Hands */}
        <mesh position={[0, 0.25, 0.02]} rotation={[0, 0, 0.8]}>
          <planeGeometry args={[0.06, 0.6]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.35, 0.03]} rotation={[0, 0, -1.2]}>
          <planeGeometry args={[0.04, 0.8]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} />
        </mesh>

        {/* Thin Orange Chronograph Second Hand */}
        <mesh ref={secondHandRef} position={[0, 0, 0.04]}>
          <planeGeometry args={[0.02, 1.1]} />
          <meshBasicMaterial color="#FF4500" />
        </mesh>

        {/* Central Crown Jewel */}
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[0.06, 24]} />
          <meshBasicMaterial color="#FF4500" />
        </mesh>

        {/* Dial Engraving Plate ("ALWAYS DELIVER ON TIME.") */}
        <group ref={engravingGroupRef} position={[0, -0.65, 0.02]}>
          <mesh>
            <planeGeometry args={[1.5, 0.22]} />
            <meshBasicMaterial color="#111318" transparent opacity={0.8} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(1.5, 0.22)]} />
            <lineBasicMaterial color="#FF5F1F" transparent opacity={0.6} />
          </lineSegments>
        </group>
      </group>
    </group>
  );
}
