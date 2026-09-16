import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================================================
// LUXURY TIMEPIECE DIVE - REVOLUTIONARY REDEFINITION (120 FPS STRICT)
// ----------------------------------------------------------------------------
// 1. Photo 1: Frontal Hero Rolex Datejust standing on glossy mirror floor,
//    fluted bezel, dark sunburst dial, applied luminous batons, cyclops date,
//    draped oyster bracelet, mirror reflection, warm studio bokeh.
// 2. Photos 2, 3, 4: Macro Horological Caliber dive with golden sunray gears,
//    pulsing balance wheel with blued spiral hairspring, synthetic ruby jewels
//    in gold chatons, blued steel screws, and Côtes de Genève bridges.
// ============================================================================

export interface LuxuryTimepieceDiveProps {
  scrollP?: number;
  scrollRef?: React.MutableRefObject<number>;
}

// Corridor alignment constants
const CENTER_X = 0.265;
const CENTER_Y = -16.00;
const WATCH_BASE_Z = -94.0;
const FLOOR_Y = CENTER_Y - 2.85;

// Shared dummy for instancing matrix computation
const DUMMY = new THREE.Object3D();

// ============================================================================
// PROCEDURAL LUXURY HOROLOGICAL TEXTURES (120 FPS NATIVE)
// ============================================================================
function createRadialBrushTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(256, 256);
  const d = imgData.data;
  const cx = 128, cy = 128;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      // Subtle high-frequency radial lines + subtle concentric ring grooves
      const radialFreq = Math.sin(angle * 120.0) * 0.5 + 0.5;
      const ringFreq = Math.sin(r * 2.2) * 0.5 + 0.5;
      const val = radialFreq * 0.7 + ringFreq * 0.3;
      const idx = (y * 256 + x) * 4;
      d[idx + 0] = Math.floor(128 + (val - 0.5) * 42);
      d[idx + 1] = Math.floor(128 + (val - 0.5) * 42);
      d[idx + 2] = 250;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createCotesDeGeneveTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(256, 256);
  const d = imgData.data;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const stripe = (x % 32) / 32;
      const wave = Math.sin(stripe * Math.PI) * (1.0 - Math.abs((y % 16) / 8 - 1.0) * 0.15);
      const idx = (y * 256 + x) * 4;
      d[idx + 0] = Math.floor(128 + wave * 32);
      d[idx + 1] = 128;
      d[idx + 2] = 245;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createPerlageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, 256, 256);
  const spacing = 18;
  for (let y = 0; y <= 256 + spacing; y += spacing) {
    const row = Math.floor(y / spacing);
    const xOffset = (row % 2) * (spacing * 0.5);
    for (let x = -spacing; x <= 256 + spacing; x += spacing) {
      const px = x + xOffset;
      const grad = ctx.createRadialGradient(px, y, 0, px, y, spacing * 0.7);
      grad.addColorStop(0, "rgba(203, 213, 225, 0.45)");
      grad.addColorStop(0.5, "rgba(148, 163, 184, 0.25)");
      grad.addColorStop(0.85, "rgba(71, 85, 105, 0.12)");
      grad.addColorStop(1, "rgba(30, 41, 59, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, y, spacing * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

const TEX_RADIAL_BRUSH = typeof document !== "undefined" ? createRadialBrushTexture() : null;
const TEX_COTES_GENEVE = typeof document !== "undefined" ? createCotesDeGeneveTexture() : null;
const TEX_PERLAGE = typeof document !== "undefined" ? createPerlageTexture() : null;

// ============================================================================
// STRICT SINGLETON PBR MATERIALS (LUMINOUS WARMTH & SPECULAR GLEAM)
// ============================================================================
// 1. 904L High-Polish Oystersteel / Rhodium Pinions
const MAT_STEEL_POLISHED = new THREE.MeshStandardMaterial({
  color: "#f8fafc",
  metalness: 0.96,
  roughness: 0.12,
  envMapIntensity: 2.4,
});

// 2. Brushed Movement Bridges / Côtes de Genève (Glashütte Rhodium Finish)
const MAT_STEEL_BRUSHED = new THREE.MeshStandardMaterial({
  color: "#cbd5e1",
  metalness: 0.90,
  roughness: 0.24,
  normalMap: TEX_COTES_GENEVE,
  normalScale: new THREE.Vector2(0.45, 0.45),
  envMapIntensity: 1.8,
});

// 3. 18K Yellow Gold (Warm, rich luster with anisotropic radial sunray sheen)
const MAT_GOLD_RICH = new THREE.MeshStandardMaterial({
  color: "#f59e0b",
  metalness: 0.93,
  roughness: 0.20,
  normalMap: TEX_RADIAL_BRUSH,
  normalScale: new THREE.Vector2(0.40, 0.40),
  envMapIntensity: 2.2,
});

// 4. Polished 18K Yellow Gold (Anglage Bevels, Chatons & Balance Rim)
const MAT_GOLD_POLISHED = new THREE.MeshStandardMaterial({
  color: "#fbbf24",
  metalness: 0.97,
  roughness: 0.08,
  envMapIntensity: 2.6,
});

// 5. Flame-Blued Steel (Screws, Hairspring & Escape Wheel)
const MAT_BLUED_STEEL = new THREE.MeshStandardMaterial({
  color: "#1d4ed8",
  metalness: 0.92,
  roughness: 0.12,
  emissive: new THREE.Color("#1e3a8a"),
  emissiveIntensity: 0.25,
  envMapIntensity: 2.2,
});

// 6. Synthetic Cabochon Ruby Pivot Jewels
const MAT_RUBY = new THREE.MeshPhysicalMaterial({
  color: "#e11d48",
  emissive: new THREE.Color("#be123c"),
  emissiveIntensity: 0.60,
  roughness: 0.06,
  metalness: 0.1,
  transmission: 0.60,
  ior: 1.76,
  thickness: 0.30,
});

// 7. Movement Mainplate Chassis with Engine-Turned Perlage Graining
const MAT_MAINPLATE = new THREE.MeshStandardMaterial({
  color: "#1e293b",
  metalness: 0.85,
  roughness: 0.30,
  map: TEX_PERLAGE,
  envMapIntensity: 1.4,
});

// 8. Deep Sunburst Anthracite Dial Face (Deep, pitch-rich black/slate, Photo 1)
const MAT_DIAL = new THREE.MeshStandardMaterial({
  color: "#050810",
  metalness: 0.85,
  roughness: 0.22,
});

// 8. Super-LumiNova Luminous Inlay
const MAT_LUME = new THREE.MeshStandardMaterial({
  color: "#f0fdf4",
  emissive: new THREE.Color("#86efac"),
  emissiveIntensity: 0.16,
  roughness: 0.22,
});

// 9. Clear Sapphire Crystal with AR Coating
const MAT_SAPPHIRE = new THREE.MeshPhysicalMaterial({
  transparent: true,
  opacity: 0.12,
  color: "#ffffff",
  roughness: 0.02,
  metalness: 0.04,
  clearcoat: 1.0,
  clearcoatRoughness: 0.02,
});

// 10. Glossy Mirror Stage Floor
const MAT_MIRROR_FLOOR = new THREE.MeshStandardMaterial({
  color: "#020409",
  metalness: 0.96,
  roughness: 0.08,
});

// ============================================================================
// SUB-COMPONENT: ROLEX SIGNATURE FLUTED BEZEL (64 INSTANCED FACETS)
// ============================================================================
function FlutedBezel({ radius = 3.65, count = 64 }: { radius?: number; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const facetGeo = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.04, 0.12, 0.45, 3);
    geom.rotateX(Math.PI / 2);
    return geom;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      DUMMY.position.set(x, y, 0.08);
      DUMMY.rotation.set(0, 0, angle + Math.PI / 2);
      DUMMY.scale.set(1, 1, 1);
      DUMMY.updateMatrix();
      meshRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [radius, count]);

  return (
    <group>
      {/* Base Bezel Ring */}
      <mesh position={[0, 0, 0.04]} material={MAT_STEEL_POLISHED}>
        <torusGeometry args={[radius, 0.16, 16, 64]} />
      </mesh>
      {/* 64 Instanced Fluted Triangular Facets */}
      <instancedMesh
        ref={meshRef}
        args={[facetGeo, MAT_STEEL_POLISHED, count]}
        frustumCulled={false}
      />
    </group>
  );
}

// ============================================================================
// SUB-COMPONENT: APPLIED BATON HOUR MARKERS & RAILWAY TRACK
// ============================================================================
function WatchDialFace({
  hourHandRef,
  minuteHandRef,
  secondsHandRef,
  dialCenterRef,
  sapphireRef,
}: {
  hourHandRef: React.RefObject<THREE.Group | null>;
  minuteHandRef: React.RefObject<THREE.Group | null>;
  secondsHandRef: React.RefObject<THREE.Group | null>;
  dialCenterRef?: React.RefObject<THREE.Group | null>;
  sapphireRef?: React.RefObject<THREE.Mesh | null>;
}) {
  const markerMeshRef = useRef<THREE.InstancedMesh>(null);
  const lumeMeshRef = useRef<THREE.InstancedMesh>(null);
  const trackMeshRef = useRef<THREE.InstancedMesh>(null);

  const markerGeo = useMemo(() => new THREE.BoxGeometry(0.12, 0.65, 0.06), []);
  const lumeGeo = useMemo(() => new THREE.BoxGeometry(0.06, 0.46, 0.07), []);
  const tickGeo = useMemo(() => new THREE.BoxGeometry(0.02, 0.12, 0.01), []);

  useEffect(() => {
    if (!markerMeshRef.current || !lumeMeshRef.current) return;
    const R = 2.65;
    let idx = 0;
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue; // Date window at 3

      const angle = (i / 12) * Math.PI * 2;
      const x = Math.sin(angle) * R;
      const y = Math.cos(angle) * R;

      DUMMY.position.set(x, y, 0.02);
      DUMMY.rotation.set(0, 0, -angle);
      DUMMY.scale.set(i === 0 ? 1.4 : 1.0, 1.0, 1.0);
      DUMMY.updateMatrix();
      markerMeshRef.current.setMatrixAt(idx, DUMMY.matrix);

      DUMMY.position.set(x, y, 0.04);
      DUMMY.updateMatrix();
      lumeMeshRef.current.setMatrixAt(idx, DUMMY.matrix);

      idx++;
    }
    markerMeshRef.current.instanceMatrix.needsUpdate = true;
    lumeMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!trackMeshRef.current) return;
    const R = 3.12;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const x = Math.sin(angle) * R;
      const y = Math.cos(angle) * R;
      DUMMY.position.set(x, y, 0.01);
      DUMMY.rotation.set(0, 0, -angle);
      DUMMY.scale.set(1, i % 5 === 0 ? 1.6 : 1.0, 1);
      DUMMY.updateMatrix();
      trackMeshRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    trackMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      {/* 1. Outer Chapter Ring */}
      <mesh material={MAT_DIAL}>
        <ringGeometry args={[1.5, 3.45, 64]} />
      </mesh>

      {/* 2. Central Sunburst Disc (Opens during dive into movement) */}
      <group ref={dialCenterRef} position={[0, 0, 0.01]}>
        <mesh material={MAT_DIAL}>
          <circleGeometry args={[1.56, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.01]} material={MAT_DIAL}>
          <ringGeometry args={[0.35, 1.54, 48]} />
        </mesh>
      </group>

      {/* 3. Instanced Steel Baton Marker Frames */}
      <instancedMesh
        ref={markerMeshRef}
        args={[markerGeo, MAT_STEEL_POLISHED, 11]}
        frustumCulled={false}
      />

      {/* 4. Instanced Super-LumiNova Inserts */}
      <instancedMesh
        ref={lumeMeshRef}
        args={[lumeGeo, MAT_LUME, 11]}
        frustumCulled={false}
      />

      {/* 5. Instanced Minute Track Tick Marks */}
      <instancedMesh
        ref={trackMeshRef}
        args={[tickGeo, MAT_STEEL_POLISHED, 60]}
        frustumCulled={false}
      />

      {/* 6. Date Window at 3 o'clock */}
      <group position={[2.45, 0, 0.03]}>
        <mesh material={MAT_STEEL_POLISHED}>
          <boxGeometry args={[0.72, 0.58, 0.04]} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.56, 0.44]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.38, 0.28]} />
          <meshBasicMaterial color="#0b0f19" />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <sphereGeometry args={[0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.35}
            roughness={0.02}
            clearcoat={1.0}
            color="#ffffff"
          />
        </mesh>
      </group>

      {/* 7. Central Cannon Pinion Collar */}
      <mesh position={[0, 0, 0.08]} material={MAT_GOLD_POLISHED}>
        <torusGeometry args={[0.22, 0.05, 16, 32]} />
      </mesh>

      {/* 8. Faceted Hour Hand */}
      <group ref={hourHandRef} position={[0, 0, 0.10]}>
        <mesh position={[0, 0.95, 0]} material={MAT_STEEL_POLISHED}>
          <boxGeometry args={[0.18, 1.9, 0.04]} />
        </mesh>
        <mesh position={[0, 1.05, 0.01]} material={MAT_LUME}>
          <boxGeometry args={[0.08, 1.35, 0.04]} />
        </mesh>
      </group>

      {/* 9. Faceted Minute Hand */}
      <group ref={minuteHandRef} position={[0, 0, 0.14]}>
        <mesh position={[0, 1.35, 0]} material={MAT_STEEL_POLISHED}>
          <boxGeometry args={[0.13, 2.7, 0.04]} />
        </mesh>
        <mesh position={[0, 1.45, 0.01]} material={MAT_LUME}>
          <boxGeometry args={[0.06, 1.95, 0.04]} />
        </mesh>
      </group>

      {/* 10. Needle Seconds Hand */}
      <group ref={secondsHandRef} position={[0, 0, 0.18]}>
        <mesh position={[0, 1.45, 0]} material={MAT_BLUED_STEEL}>
          <boxGeometry args={[0.035, 3.1, 0.02]} />
        </mesh>
        <mesh position={[0, -0.65, 0]} material={MAT_BLUED_STEEL}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
        </mesh>
        <mesh position={[0, 0, 0]} material={MAT_GOLD_POLISHED}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
        </mesh>
      </group>

      {/* 11. Sapphire Crystal Face (Correctly facing camera along Z) */}
      <mesh ref={sapphireRef} position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.55, 3.55, 0.04, 64]} />
        <primitive object={MAT_SAPPHIRE} attach="material" />
      </mesh>
    </group>
  );
}

// ============================================================================
// SUB-COMPONENT: ROLEX OYSTER CASE & DRAPED BRACELET LINKS (PHOTO 1)
// ============================================================================
function WatchCaseAndBracelet() {
  const braceletLinkRef = useRef<THREE.InstancedMesh>(null);
  const centerLinkRef = useRef<THREE.InstancedMesh>(null);

  const outerLinkGeo = useMemo(() => new THREE.BoxGeometry(0.55, 0.38, 0.22), []);
  const centerLinkGeo = useMemo(() => new THREE.BoxGeometry(0.72, 0.38, 0.24), []);

  useEffect(() => {
    if (!braceletLinkRef.current || !centerLinkRef.current) return;

    let instanceIdx = 0;

    // Top Bracelet: curves backward and up
    const topCount = 8;
    for (let i = 0; i < topCount; i++) {
      const t = (i + 1) / topCount;
      const y = 3.7 + i * 0.42;
      const z = -Math.pow(t, 1.6) * 2.8;
      const angleX = t * 0.55;

      DUMMY.position.set(-0.85, y, z);
      DUMMY.rotation.set(angleX, 0, 0);
      DUMMY.scale.set(1, 1, 1);
      DUMMY.updateMatrix();
      braceletLinkRef.current.setMatrixAt(instanceIdx * 2, DUMMY.matrix);

      DUMMY.position.set(0.85, y, z);
      DUMMY.updateMatrix();
      braceletLinkRef.current.setMatrixAt(instanceIdx * 2 + 1, DUMMY.matrix);

      DUMMY.position.set(0, y, z + 0.01);
      DUMMY.updateMatrix();
      centerLinkRef.current.setMatrixAt(instanceIdx, DUMMY.matrix);

      instanceIdx++;
    }

    // Bottom Bracelet: curves downward to meet the reflective floor
    const botCount = 10;
    for (let i = 0; i < botCount; i++) {
      const t = (i + 1) / botCount;
      const y = -3.7 - i * 0.42;
      const z = -Math.pow(t, 1.4) * 2.2;
      const angleX = -t * 0.65;

      DUMMY.position.set(-0.85, y, z);
      DUMMY.rotation.set(angleX, 0, 0);
      DUMMY.scale.set(1, 1, 1);
      DUMMY.updateMatrix();
      braceletLinkRef.current.setMatrixAt(instanceIdx * 2, DUMMY.matrix);

      DUMMY.position.set(0.85, y, z);
      DUMMY.updateMatrix();
      braceletLinkRef.current.setMatrixAt(instanceIdx * 2 + 1, DUMMY.matrix);

      DUMMY.position.set(0, y, z + 0.01);
      DUMMY.updateMatrix();
      centerLinkRef.current.setMatrixAt(instanceIdx, DUMMY.matrix);

      instanceIdx++;
    }

    braceletLinkRef.current.instanceMatrix.needsUpdate = true;
    centerLinkRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      {/* 0. Exhibition Caseback Rim (Permits deep movement light transmission) */}
      <mesh position={[0, 0, -0.32]} material={MAT_STEEL_BRUSHED}>
        <ringGeometry args={[2.2, 3.85, 64]} />
      </mesh>

      {/* 1. Oyster Case Middle Body */}
      <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} material={MAT_STEEL_POLISHED}>
        <cylinderGeometry args={[3.85, 4.05, 0.42, 64]} />
      </mesh>

      {/* 2. Sculpted Upper Lugs */}
      <mesh position={[-1.75, 3.8, -0.1]} rotation={[0, 0, 0.22]} material={MAT_STEEL_POLISHED}>
        <boxGeometry args={[0.55, 1.4, 0.42]} />
      </mesh>
      <mesh position={[1.75, 3.8, -0.1]} rotation={[0, 0, -0.22]} material={MAT_STEEL_POLISHED}>
        <boxGeometry args={[0.55, 1.4, 0.42]} />
      </mesh>

      {/* 3. Sculpted Lower Lugs */}
      <mesh position={[-1.75, -3.8, -0.1]} rotation={[0, 0, -0.22]} material={MAT_STEEL_POLISHED}>
        <boxGeometry args={[0.55, 1.4, 0.42]} />
      </mesh>
      <mesh position={[1.75, -3.8, -0.1]} rotation={[0, 0, 0.22]} material={MAT_STEEL_POLISHED}>
        <boxGeometry args={[0.55, 1.4, 0.42]} />
      </mesh>

      {/* 4. Screw-Down Winding Crown at 3 o'clock */}
      <group position={[4.15, 0, 0]}>
        <mesh position={[-0.2, 0.45, 0]} material={MAT_STEEL_POLISHED}>
          <boxGeometry args={[0.4, 0.45, 0.35]} />
        </mesh>
        <mesh position={[-0.2, -0.45, 0]} material={MAT_STEEL_POLISHED}>
          <boxGeometry args={[0.4, 0.45, 0.35]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={MAT_STEEL_POLISHED}>
          <cylinderGeometry args={[0.44, 0.44, 0.42, 24]} />
        </mesh>
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT_STEEL_POLISHED}>
          <sphereGeometry args={[0.43, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        <mesh position={[0.42, 0, 0]} material={MAT_GOLD_POLISHED}>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 12]} />
        </mesh>
      </group>

      {/* 5. Instanced Outer Brushed Bracelet Links */}
      <instancedMesh
        ref={braceletLinkRef}
        args={[outerLinkGeo, MAT_STEEL_BRUSHED, 36]}
        frustumCulled={false}
      />

      {/* 6. Instanced Center Polished Bracelet Links */}
      <instancedMesh
        ref={centerLinkRef}
        args={[centerLinkGeo, MAT_STEEL_POLISHED, 18]}
        frustumCulled={false}
      />
    </group>
  );
}

// ============================================================================
// SUB-COMPONENT: MACRO HOROLOGY CALIBER GEAR WHEEL (HIGH-DENSITY SWISS HOROLOGY)
// ============================================================================
interface CaliberGearProps {
  radius: number;
  teethCount: number;
  thickness?: number;
  materialType?: "gold" | "steel" | "blued";
  spokesCount?: number;
  innerHoleRadius?: number;
  hasRuby?: boolean;
}

function CaliberGear({
  radius,
  teethCount,
  thickness = 0.12,
  materialType = "gold",
  spokesCount = 5,
  innerHoleRadius = 0.22,
  hasRuby = true,
}: CaliberGearProps) {
  // Fine, delicate cycloidal tooth scale matching authentic Swiss watch calibers
  const toothWidth = ((Math.PI * 2 * radius) / teethCount) * 0.52;
  const toothDepth = radius * (teethCount > 60 ? 0.055 : 0.075);
  const spokeLen = Math.max(0.1, radius - 0.16 - innerHoleRadius);

  // Authentic beveled cycloidal tooth profile with gentle curvature
  const toothGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const halfBase = toothWidth * 0.48;
    const halfTip = toothWidth * 0.22;
    shape.moveTo(0, -halfBase);
    shape.lineTo(toothDepth * 0.65, -halfTip);
    shape.quadraticCurveTo(toothDepth, 0, toothDepth * 0.65, halfTip);
    shape.lineTo(0, halfBase);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: Math.min(0.008, toothWidth * 0.12),
      bevelThickness: Math.min(0.008, thickness * 0.12),
    });
    geo.center();
    return geo;
  }, [toothWidth, toothDepth, thickness]);

  // Elegant chamfered watch spokes with anglage bevels
  const spokeGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const halfW = Math.min(0.045, toothWidth * 0.9);
    shape.moveTo(0, -halfW * 1.2);
    shape.lineTo(spokeLen, -halfW * 0.8);
    shape.lineTo(spokeLen, halfW * 0.8);
    shape.lineTo(0, halfW * 1.2);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness * 0.85,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
    geo.center();
    return geo;
  }, [spokeLen, thickness, toothWidth]);

  const mat =
    materialType === "gold"
      ? MAT_GOLD_RICH
      : materialType === "steel"
      ? MAT_STEEL_POLISHED
      : MAT_BLUED_STEEL;

  const teethRef = useRef<THREE.InstancedMesh>(null);
  const spokesRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!teethRef.current) return;
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const x = Math.cos(angle) * (radius + toothDepth * 0.46);
      const y = Math.sin(angle) * (radius + toothDepth * 0.46);
      DUMMY.position.set(x, y, 0);
      DUMMY.rotation.set(0, 0, angle);
      DUMMY.scale.set(1, 1, 1);
      DUMMY.updateMatrix();
      teethRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    teethRef.current.instanceMatrix.needsUpdate = true;
  }, [teethCount, radius, toothDepth]);

  useEffect(() => {
    if (!spokesRef.current) return;
    for (let i = 0; i < spokesCount; i++) {
      const angle = (i / spokesCount) * Math.PI * 2;
      const midR = innerHoleRadius + spokeLen * 0.5;
      const sx = Math.cos(angle) * midR;
      const sy = Math.sin(angle) * midR;
      DUMMY.position.set(sx, sy, 0);
      DUMMY.rotation.set(0, 0, angle);
      DUMMY.scale.set(1, 1, 1);
      DUMMY.updateMatrix();
      spokesRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    spokesRef.current.instanceMatrix.needsUpdate = true;
  }, [spokesCount, innerHoleRadius, spokeLen]);

  return (
    <group>
      {/* Outer Rim Ring with Radial Sheen */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[radius, radius, thickness, 64, 1, false]} />
      </mesh>

      {/* Front & Back Mirror-Polished Rim Bevels (Anglage) */}
      <mesh position={[0, 0, thickness * 0.51]} material={materialType === "gold" ? MAT_GOLD_POLISHED : MAT_STEEL_POLISHED}>
        <ringGeometry args={[radius * 0.88, radius, 64]} />
      </mesh>
      <mesh position={[0, 0, -thickness * 0.51]} rotation={[0, Math.PI, 0]} material={materialType === "gold" ? MAT_GOLD_POLISHED : MAT_STEEL_POLISHED}>
        <ringGeometry args={[radius * 0.88, radius, 64]} />
      </mesh>

      {/* Recessed Sunray Webbing Ring */}
      <mesh position={[0, 0, 0]} material={mat}>
        <ringGeometry args={[innerHoleRadius + 0.10, radius * 0.88, 48]} />
      </mesh>

      {/* Instanced Beveled Cycloidal Gear Teeth */}
      <instancedMesh
        ref={teethRef}
        args={[toothGeo, mat, teethCount]}
        frustumCulled={false}
      />

      {/* Instanced Beveled Spokes */}
      <instancedMesh
        ref={spokesRef}
        args={[spokeGeo, mat, spokesCount]}
        frustumCulled={false}
      />

      {/* Center Hub Collar with Bevel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[innerHoleRadius + 0.11, innerHoleRadius + 0.13, thickness * 1.25, 24]} />
      </mesh>

      {/* Steel Arbor Shaft */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT_STEEL_POLISHED}>
        <cylinderGeometry args={[0.055, 0.055, thickness * 2.2, 16]} />
      </mesh>

      {/* Inset Synthetic Ruby Bearing in Polished Gold Chaton with 3 Blued Micro-Screws */}
      {hasRuby && (
        <group position={[0, 0, thickness * 0.76]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT_GOLD_POLISHED}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
          </mesh>
          <mesh position={[0, 0, 0.015]} material={MAT_RUBY}>
            <sphereGeometry args={[0.095, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
          </mesh>
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((rad, idx) => (
            <mesh
              key={idx}
              position={[Math.cos(rad) * 0.24, Math.sin(rad) * 0.24, 0.015]}
              rotation={[Math.PI / 2, 0, 0]}
              material={MAT_BLUED_STEEL}
            >
              <cylinderGeometry args={[0.03, 0.03, 0.03, 10]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ============================================================================
// SUB-COMPONENT: SCULPTED 18K GOLD SWISS BALANCE BRIDGE (COQ DE BALANCIER)
// ============================================================================
function SculptedBalanceBridge() {
  const bridgeGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.25, -0.15);
    shape.lineTo(-0.75, 0.05);
    shape.quadraticCurveTo(-0.55, -0.05, -0.45, -0.32);
    shape.absarc(-0.64, -0.45, 0.26, Math.PI * 0.25, Math.PI * 1.75, false);
    shape.quadraticCurveTo(-0.95, -0.55, -1.25, -0.35);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
  }, []);

  return (
    <group position={[0, 0, -0.05]}>
      {/* 18K Gold Sculpted Bridge with Anglage Chamfers */}
      <mesh geometry={bridgeGeo} material={MAT_GOLD_RICH} />
      {/* Front Polished Chamfer Accent Ring */}
      <mesh position={[-0.64, -0.45, 0.09]} material={MAT_GOLD_POLISHED}>
        <ringGeometry args={[0.16, 0.22, 32]} />
      </mesh>
      {/* Two Flame-Blued Steel Mounting Screws at Foot */}
      <mesh position={[-1.15, -0.22, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={MAT_BLUED_STEEL}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
      </mesh>
      <mesh position={[-1.02, -0.14, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={MAT_BLUED_STEEL}>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 12]} />
      </mesh>
      {/* Center Shock-Protection Chaton & Ruby Cabochon */}
      <mesh position={[-0.64, -0.45, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={MAT_GOLD_POLISHED}>
        <cylinderGeometry args={[0.13, 0.13, 0.05, 16]} />
      </mesh>
      <mesh position={[-0.64, -0.45, 0.11]} material={MAT_RUBY}>
        <sphereGeometry args={[0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
      </mesh>
      {/* Micro Regulator Pointer */}
      <mesh position={[-0.50, -0.36, 0.09]} rotation={[0, 0, -0.65]} material={MAT_STEEL_POLISHED}>
        <boxGeometry args={[0.20, 0.022, 0.018]} />
      </mesh>
    </group>
  );
}

// ============================================================================
// SUB-COMPONENT: MACRO HOROLOGY CALIBER ASSEMBLY (AUTHENTIC SWISS GEAR TRAIN)
// Perfectly proportioned & nested inside the watch case (Z: -2.50)
// ============================================================================
function MacroHorologyCaliber({
  barrelRef,
  centerWheelRef,
  thirdWheelRef,
  fourthWheelRef,
  balanceWheelRef,
  escapeWheelRef,
}: {
  barrelRef: React.RefObject<THREE.Group | null>;
  centerWheelRef: React.RefObject<THREE.Group | null>;
  thirdWheelRef: React.RefObject<THREE.Group | null>;
  fourthWheelRef: React.RefObject<THREE.Group | null>;
  balanceWheelRef: React.RefObject<THREE.Group | null>;
  escapeWheelRef: React.RefObject<THREE.Group | null>;
}) {
  const hairspringCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 5.5;
    const steps = turns * 28;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const theta = t * turns * Math.PI * 2;
      const r = 0.045 + t * (0.52 - 0.045);
      pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  return (
    <group position={[0, 0.20, -2.50]}>
      {/* 1. Hero 18K Gold Mainspring Barrel Wheel (Left-center hero focal point, occupies 35-45% of width) */}
      <group ref={barrelRef} position={[-0.40, 0.22, 0.08]}>
        <CaliberGear
          radius={0.96}
          teethCount={88}
          thickness={0.14}
          materialType="gold"
          spokesCount={5}
          innerHoleRadius={0.24}
          hasRuby={true}
        />
      </group>

      {/* 2. Center Driving Wheel (High-Polish Rhodium / Steel, intermeshing with barrel) */}
      <group ref={centerWheelRef} position={[0.68, 0.30, -0.04]}>
        <CaliberGear
          radius={0.70}
          teethCount={68}
          thickness={0.12}
          materialType="steel"
          spokesCount={5}
          innerHoleRadius={0.18}
          hasRuby={true}
        />
      </group>

      {/* 3. Third Pinion Wheel (Steel, middle depth layer) */}
      <group ref={thirdWheelRef} position={[0.82, -0.40, -0.14]}>
        <CaliberGear
          radius={0.52}
          teethCount={52}
          thickness={0.10}
          materialType="steel"
          spokesCount={4}
          innerHoleRadius={0.14}
          hasRuby={true}
        />
      </group>

      {/* 4. Fourth Seconds Wheel (Gilded Gold) */}
      <group ref={fourthWheelRef} position={[0.24, -0.52, -0.22]}>
        <CaliberGear
          radius={0.42}
          teethCount={44}
          thickness={0.09}
          materialType="gold"
          spokesCount={4}
          innerHoleRadius={0.12}
          hasRuby={true}
        />
      </group>

      {/* 5. Sculpted 18K Gold Balance Bridge (Curving gracefully over balance wheel) */}
      <SculptedBalanceBridge />

      {/* 6. Master Balance Wheel Assembly & Coiled Hairspring */}
      <group position={[-0.64, -0.45, -0.15]}>
        <group ref={balanceWheelRef}>
          {/* Polished Gold Balance Rim */}
          <mesh material={MAT_GOLD_POLISHED}>
            <torusGeometry args={[0.65, 0.040, 16, 48]} />
          </mesh>

          {/* 3 Chamfered Gold Spokes */}
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, idx) => (
            <mesh
              key={idx}
              position={[Math.cos(ang) * 0.32, Math.sin(ang) * 0.32, 0]}
              rotation={[0, 0, ang]}
              material={MAT_GOLD_POLISHED}
            >
              <boxGeometry args={[0.65, 0.048, 0.024]} />
            </mesh>
          ))}

          {/* 16 Gold Balance Weight Screws on Rim */}
          {Array.from({ length: 16 }).map((_, i) => {
            const rad = (i / 16) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(rad) * 0.70, Math.sin(rad) * 0.70, 0]}
                rotation={[0, 0, rad + Math.PI / 2]}
                material={MAT_GOLD_POLISHED}
              >
                <cylinderGeometry args={[0.024, 0.024, 0.05, 8]} />
              </mesh>
            );
          })}

          {/* Flame-Blued Spiral Hairspring */}
          <group position={[0, 0, 0.06]}>
            <mesh material={MAT_BLUED_STEEL}>
              <tubeGeometry args={[hairspringCurve, 100, 0.008, 6, false]} />
            </mesh>
          </group>

          {/* Steel Balance Staff Arbor & Ruby Pivot */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT_STEEL_POLISHED}>
            <cylinderGeometry args={[0.045, 0.045, 0.25, 16]} />
          </mesh>
          <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={MAT_GOLD_POLISHED}>
            <cylinderGeometry args={[0.11, 0.11, 0.05, 16]} />
          </mesh>
          <mesh position={[0, 0, 0.14]} material={MAT_RUBY}>
            <sphereGeometry args={[0.065, 14, 14]} />
          </mesh>
        </group>
      </group>

      {/* 7. Escape Wheel (Flame-Blued Steel) */}
      <group ref={escapeWheelRef} position={[-0.12, -0.70, -0.26]}>
        <CaliberGear
          radius={0.34}
          teethCount={18}
          thickness={0.07}
          materialType="blued"
          spokesCount={3}
          innerHoleRadius={0.09}
          hasRuby={true}
        />
      </group>

      {/* 8. Secondary Transmission Wheel (Polished Steel) */}
      <group position={[-0.92, 0.44, -0.16]}>
        <CaliberGear
          radius={0.56}
          teethCount={56}
          thickness={0.10}
          materialType="steel"
          spokesCount={4}
          innerHoleRadius={0.14}
          hasRuby={true}
        />
      </group>

      {/* 9. Caliber Movement Mainplate with Perlage Finish */}
      <mesh position={[0, 0, -0.38]} rotation={[Math.PI / 2, 0, 0]} material={MAT_MAINPLATE}>
        <cylinderGeometry args={[2.05, 2.05, 0.08, 64]} />
      </mesh>
      {/* Decorative Beveled Chassis Ring encircling mainplate perimeter */}
      <mesh position={[0, 0, -0.34]} material={MAT_STEEL_BRUSHED}>
        <torusGeometry args={[2.0, 0.06, 16, 64]} />
      </mesh>
      {/* 8 Perimeter Flame-Blued Steel Screws */}
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(ang) * 1.88, Math.sin(ang) * 1.88, -0.33]}
            rotation={[Math.PI / 2, 0, 0]}
            material={MAT_BLUED_STEEL}
          >
            <cylinderGeometry args={[0.055, 0.055, 0.04, 12]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================================
// SUB-COMPONENT: WARM LUXURY STUDIO BOKEH PARTICLES (PHOTO 1 BACKGROUND)
// ============================================================================
function WarmStudioBokeh() {
  const bokehGeo = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const count = 48;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = CENTER_Y + (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = WATCH_BASE_Z - 6.0 - Math.random() * 24.0;
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  const bokehMat = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 230, 160, 0.85)");
    grad.addColorStop(0.4, "rgba(245, 158, 11, 0.45)");
    grad.addColorStop(1, "rgba(217, 119, 6, 0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.PointsMaterial({
      size: 1.4,
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: "#fde68a",
    });
  }, []);

  return <points geometry={bokehGeo} material={bokehMat} />;
}

// ============================================================================
// MAIN COMPONENT: LUXURY TIMEPIECE DIVE
// ============================================================================
export function LuxuryTimepieceDive({ scrollP, scrollRef }: LuxuryTimepieceDiveProps) {
  const { size } = useThree();
  const isNarrow = size.width < 768 || size.width / size.height < 1.0;
  const watchScale = isNarrow ? 0.46 : 0.62;

  const watchAssemblyRef = useRef<THREE.Group>(null);
  const hourHandRef = useRef<THREE.Group>(null);
  const minuteHandRef = useRef<THREE.Group>(null);
  const secondsHandRef = useRef<THREE.Group>(null);
  const dialCenterRef = useRef<THREE.Group>(null);
  const sapphireRef = useRef<THREE.Mesh>(null);

  const barrelRef = useRef<THREE.Group>(null);
  const centerWheelRef = useRef<THREE.Group>(null);
  const thirdWheelRef = useRef<THREE.Group>(null);
  const fourthWheelRef = useRef<THREE.Group>(null);
  const balanceWheelRef = useRef<THREE.Group>(null);
  const escapeWheelRef = useRef<THREE.Group>(null);

  const reflHourHandRef = useRef<THREE.Group>(null);
  const reflMinuteHandRef = useRef<THREE.Group>(null);
  const reflSecondsHandRef = useRef<THREE.Group>(null);
  const caliberGroupRef = useRef<THREE.Group>(null);

  const stageFloorRef = useRef<THREE.Mesh>(null);
  const reflGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const rawP = scrollRef ? scrollRef.current : (scrollP ?? 0);
    const p = Math.max(0, Math.min(1, rawP));

    // Smooth transition as camera pushes through dial face into movement
    const distToWatch = state.camera.position.z - WATCH_BASE_Z;
    const isInterior = distToWatch <= 0.35 || p >= 0.940;

    if (watchAssemblyRef.current) {
      if (isInterior) {
        // Camera has passed into interior caliber: hide exterior dial, hands, and bezel completely
        watchAssemblyRef.current.visible = false;
      } else {
        watchAssemblyRef.current.visible = true;
        // Strict 0.62 scale: zero artificial ballooning or hand blow-up
        watchAssemblyRef.current.scale.set(0.62, 0.62, 0.62);
      }
    }

    if (stageFloorRef.current) {
      stageFloorRef.current.visible = !isInterior;
    }

    if (reflGroupRef.current) {
      reflGroupRef.current.visible = !isInterior;
    }

    // Dial center aperture iris opening reveals ticking caliber directly beneath
    if (dialCenterRef.current) {
      const iris = THREE.MathUtils.clamp((distToWatch - 0.35) / 2.0, 0, 1);
      dialCenterRef.current.scale.set(iris, iris, 1);
      dialCenterRef.current.visible = iris > 0.01;
    }

    // Hands gracefully part outward away from lens center as camera pushes in
    if (hourHandRef.current && minuteHandRef.current && secondsHandRef.current) {
      const partT = THREE.MathUtils.clamp((2.0 - distToWatch) / 1.6, 0, 1);
      const partEase = partT * partT;
      hourHandRef.current.position.y = partEase * 2.8;
      minuteHandRef.current.position.y = -partEase * 2.8;
      secondsHandRef.current.position.x = partEase * 3.2;
    }

    if (sapphireRef.current) {
      sapphireRef.current.visible = distToWatch > 0.6;
    }

    // Caliber visibility - permanently active through push-in and macro horology view
    if (caliberGroupRef.current) {
      caliberGroupRef.current.visible = true;
    }

    // Independent continuous horological gear kinetics
    const idleTime = state.clock.elapsedTime;
    const idleRot = idleTime * 0.35;
    const scrollRot = p * Math.PI * 18;
    const baseAngle = scrollRot + idleRot;

    if (barrelRef.current) barrelRef.current.rotation.z = baseAngle * 0.8;
    if (centerWheelRef.current) centerWheelRef.current.rotation.z = -baseAngle * 1.2;
    if (thirdWheelRef.current) thirdWheelRef.current.rotation.z = baseAngle * 2.1;
    if (fourthWheelRef.current) fourthWheelRef.current.rotation.z = -baseAngle * 4.2;
    if (escapeWheelRef.current) escapeWheelRef.current.rotation.z = baseAngle * 8.4;

    // Harmonic balance wheel oscillation (4Hz: 8 beats/sec, continuously alive)
    if (balanceWheelRef.current) {
      const osc = Math.sin(idleTime * 18.0 + p * 24.0) * 0.95;
      balanceWheelRef.current.rotation.z = osc;
    }

    // Continuous sweeping watch hands
    const minuteAngle = p * Math.PI * 28 + idleTime * 0.15;
    const hourAngle = minuteAngle / 12;
    const secondsAngle = p * Math.PI * 120 + idleTime * 3.2;

    if (minuteHandRef.current) minuteHandRef.current.rotation.z = -minuteAngle;
    if (hourHandRef.current) hourHandRef.current.rotation.z = -hourAngle;
    if (secondsHandRef.current) secondsHandRef.current.rotation.z = -secondsAngle;

    if (reflMinuteHandRef.current) reflMinuteHandRef.current.rotation.z = minuteAngle;
    if (reflHourHandRef.current) reflHourHandRef.current.rotation.z = hourAngle;
    if (reflSecondsHandRef.current) reflSecondsHandRef.current.rotation.z = secondsAngle;
  });

  return (
    <group position={[CENTER_X, CENTER_Y, WATCH_BASE_Z]}>
      {/* ================================================================== */}
      {/* 1. CALIBRATED LUXURY COMMERCIAL STUDIO LIGHTING SETUP              */}
      {/* ================================================================== */}
      {/* Frontal watch face key & fill for exterior establishing shot */}
      <directionalLight
        position={[-3.5, 4.0, 6.0]}
        intensity={2.0}
        color="#fff4e6"
      />
      <directionalLight
        position={[3.8, 2.5, 4.0]}
        intensity={1.6}
        color="#fde68a"
      />
      <ambientLight intensity={0.35} color="#cbd5e1" />

      {/* Movement Caliber Directional Grazing & Rim Lighting */}
      {/* 1. Warm Golden Grazing Key - Raking across gear faces at 35° angle */}
      <directionalLight
        position={[-2.8, 3.2, 2.0]}
        intensity={3.2}
        color="#fef3c7"
      />
      {/* 2. Cool Rhodium Specular Rim - Catching crisp micro-bevel highlights on teeth */}
      <directionalLight
        position={[3.2, -2.6, 1.5]}
        intensity={2.8}
        color="#bae6fd"
      />
      {/* 3. Ruby & Hairspring localized accent light (low intensity, zero bloom blowout) */}
      <pointLight
        position={[-0.64, -0.45, -2.3]}
        intensity={1.6}
        color="#fda4af"
        distance={4.0}
        decay={2}
      />
      {/* 4. Deep Mainplate Shadow Contrast Fill */}
      <pointLight
        position={[0.4, 0.4, -2.4]}
        intensity={1.2}
        color="#fde68a"
        distance={4.5}
        decay={2}
      />

      {/* ================================================================== */}
      {/* 2. GLOSSY MIRROR STAGE FLOOR & INVERTED REFLECTION (PHOTO 1)       */}
      {/* ================================================================== */}
      <mesh
        ref={stageFloorRef}
        position={[0, FLOOR_Y - CENTER_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={MAT_MIRROR_FLOOR}
      >
        <planeGeometry args={[28, 48]} />
      </mesh>

      {/* Real Inverted Reflection Clone (Flipped on Y, scaled to watchScale) */}
      <group
        ref={reflGroupRef}
        position={[0, 2 * (FLOOR_Y - CENTER_Y), 0]}
        scale={[watchScale, -watchScale, watchScale]}
      >
        <WatchCaseAndBracelet />
        <FlutedBezel radius={3.65} />
        <WatchDialFace
          hourHandRef={reflHourHandRef}
          minuteHandRef={reflMinuteHandRef}
          secondsHandRef={reflSecondsHandRef}
        />
        <mesh position={[0, 0, 0.3]}>
          <planeGeometry args={[12, 12]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.50} />
        </mesh>
      </group>

      {/* ================================================================== */}
      {/* 3. HERO UPRIGHT TIMEPIECE ASSEMBLY (PHOTO 1)                       */}
      {/* Framed at watchScale showing bezel, dial, lugs, bracelet           */}
      {/* Dial center opens smoothly revealing caliber directly beneath      */}
      {/* ================================================================== */}
      <group ref={watchAssemblyRef} scale={[watchScale, watchScale, watchScale]}>
        <WatchCaseAndBracelet />
        <FlutedBezel radius={3.65} />
        <WatchDialFace
          hourHandRef={hourHandRef}
          minuteHandRef={minuteHandRef}
          secondsHandRef={secondsHandRef}
          dialCenterRef={dialCenterRef}
          sapphireRef={sapphireRef}
        />
      </group>

      {/* ================================================================== */}
      {/* 4. MACRO HOROLOGY CALIBER (PHOTOS 2, 3, 4)                         */}
      {/* Nested multi-gear Swiss movement with fine cycloidal teeth         */}
      {/* ================================================================== */}
      <group ref={caliberGroupRef}>
        <MacroHorologyCaliber
          barrelRef={barrelRef}
          centerWheelRef={centerWheelRef}
          thirdWheelRef={thirdWheelRef}
          fourthWheelRef={fourthWheelRef}
          balanceWheelRef={balanceWheelRef}
          escapeWheelRef={escapeWheelRef}
        />
      </group>

      {/* ================================================================== */}
      {/* 5. WARM STUDIO BOKEH BACKGROUND (PHOTO 1)                          */}
      {/* ================================================================== */}
      <WarmStudioBokeh />
    </group>
  );
}

export default LuxuryTimepieceDive;
