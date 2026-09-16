import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../../../store/scrollState";
import { act07State } from "../../../lib/timeline/gsapChoreography";

/**
 * ACT 07: WORLD BECOMES COMPOSITION (BREAK THE FRAME)
 * ---------------------------------------------------
 * The 2D boundary of film ruptures into an architectural 3D gallery of cinematic compositions.
 *
 * Visual Architecture:
 * - Central 2.39:1 Anamorphic Scope Master Frame (Taj Hotel luxury architecture).
 * - Left Flanking 16:9 Digital Cinema Frame (Harrdy Sandhu concert lighting).
 * - Right Flanking 1.33:1 Academy/IMAX Frame (Bennett Night atmosphere).
 * - Depth Background Gallery Layers (Embassy & Client Work).
 * - Luminous Rule-of-Thirds & Golden-Ratio Gridlines unmasking with optical precision.
 * - Dynamic Perimeter Frame-Break: borders detach and dissolve into high-energy embers.
 * - Architectural Corridor Folding: smoothly prepares the spatial geometry for Act 08 (Impossible Room).
 * - 100% Continuous Focal Presence: frames remain in camera view across all progress values.
 */
export function Act06_BreakFrame({ active: _active }: { active?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const heroGroupRef = useRef<THREE.Group>(null);
  const leftGroupRef = useRef<THREE.Group>(null);
  const rightGroupRef = useRef<THREE.Group>(null);
  const backGalleryRef = useRef<THREE.Group>(null);

  const heroMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backLeftMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backRightMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const heroGridMatRef = useRef<THREE.LineBasicMaterial>(null);
  const heroBorderMatRef = useRef<THREE.LineBasicMaterial>(null);
  const leftBorderMatRef = useRef<THREE.LineBasicMaterial>(null);
  const rightBorderMatRef = useRef<THREE.LineBasicMaterial>(null);

  const boundarySparksRef = useRef<THREE.Points>(null);
  const sparkMatRef = useRef<THREE.PointsMaterial>(null);

  // Load High-Quality Authentic Production Stills
  const textures = useTexture({
    hero: "/images/taj-hotel-poster.jpg",
    left: "/images/harrdy-sandhu-poster.jpg",
    right: "/images/bennett-night-poster.jpg",
    backLeft: "/images/embassy-poster.jpg",
    backRight: "/images/client-work-poster.jpg",
  });

  useEffect(() => {
    Object.values(textures).forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
    });
    return () => {
      Object.values(textures).forEach((tex) => tex.dispose());
    };
  }, [textures]);

  // Procedural Rule-of-Thirds & Viewfinder Line Geometry (2.39:1 Anamorphic)
  const gridGeom = useMemo(() => {
    const w = 4.2;
    const h = 1.76;
    const halfW = w / 2;
    const halfH = h / 2;

    const points: THREE.Vector3[] = [];

    // Vertical third lines
    const xThird1 = -halfW + w / 3;
    const xThird2 = -halfW + (2 * w) / 3;
    points.push(new THREE.Vector3(xThird1, -halfH, 0.005), new THREE.Vector3(xThird1, halfH, 0.005));
    points.push(new THREE.Vector3(xThird2, -halfH, 0.005), new THREE.Vector3(xThird2, halfH, 0.005));

    // Horizontal third lines
    const yThird1 = -halfH + h / 3;
    const yThird2 = -halfH + (2 * h) / 3;
    points.push(new THREE.Vector3(-halfW, yThird1, 0.005), new THREE.Vector3(halfW, yThird1, 0.005));
    points.push(new THREE.Vector3(-halfW, yThird2, 0.005), new THREE.Vector3(halfW, yThird2, 0.005));

    // Center Crosshair
    const ch = 0.12;
    points.push(new THREE.Vector3(-ch, 0, 0.006), new THREE.Vector3(ch, 0, 0.006));
    points.push(new THREE.Vector3(0, -ch, 0.006), new THREE.Vector3(0, ch, 0.006));

    // Viewfinder Corner Brackets
    const cw = 0.25;
    // Top-Left
    points.push(new THREE.Vector3(-halfW + cw, halfH, 0.008), new THREE.Vector3(-halfW, halfH, 0.008));
    points.push(new THREE.Vector3(-halfW, halfH, 0.008), new THREE.Vector3(-halfW, halfH - cw, 0.008));
    // Top-Right
    points.push(new THREE.Vector3(halfW - cw, halfH, 0.008), new THREE.Vector3(halfW, halfH, 0.008));
    points.push(new THREE.Vector3(halfW, halfH, 0.008), new THREE.Vector3(halfW, halfH - cw, 0.008));
    // Bottom-Left
    points.push(new THREE.Vector3(-halfW + cw, -halfH, 0.008), new THREE.Vector3(-halfW, -halfH, 0.008));
    points.push(new THREE.Vector3(-halfW, -halfH, 0.008), new THREE.Vector3(-halfW, -halfH + cw, 0.008));
    // Bottom-Right
    points.push(new THREE.Vector3(halfW - cw, -halfH, 0.008), new THREE.Vector3(halfW, -halfH, 0.008));
    points.push(new THREE.Vector3(halfW, -halfH, 0.008), new THREE.Vector3(halfW, -halfH + cw, 0.008));

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, []);

  // Frame Border Wireframe Geometries
  const heroBorderGeom = useMemo(() => {
    return new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.2, 1.76));
  }, []);

  const leftBorderGeom = useMemo(() => {
    return new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.8, 1.57));
  }, []);

  const rightBorderGeom = useMemo(() => {
    return new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.4, 1.8));
  }, []);

  // Perimeter Rupture Spark Particles
  const SPARK_COUNT = 160;
  const { sparkInitialPos, sparkDir } = useMemo(() => {
    const pos = new Float32Array(SPARK_COUNT * 3);
    const dir = new Float32Array(SPARK_COUNT * 3);
    const halfW = 4.2 / 2;
    const halfH = 1.76 / 2;

    for (let i = 0; i < SPARK_COUNT; i++) {
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = (Math.random() - 0.5) * 2 * halfW; y = halfH; }
      else if (side === 1) { x = halfW; y = (Math.random() - 0.5) * 2 * halfH; }
      else if (side === 2) { x = (Math.random() - 0.5) * 2 * halfH; y = -halfH; }
      else { x = -halfW; y = (Math.random() - 0.5) * 2 * halfH; }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = 0;

      dir[i * 3] = (x / halfW) * (1.2 + Math.random() * 1.8);
      dir[i * 3 + 1] = (y / halfH) * (1.2 + Math.random() * 1.8);
      dir[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    return { sparkInitialPos: pos, sparkDir: dir };
  }, []);

  // Procedural Crisp Viewfinder Typographic Texture
  const hudTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 128);
      ctx.fillStyle = "#FF5F1F";
      ctx.font = "900 24px monospace";
      ctx.fillText("[REC ●] 4K RAW", 24, 48);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px monospace";
      ctx.fillText("ANAMORPHIC 2.39:1 // 50mm T1.3 // ISO 800", 24, 90);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px monospace";
      ctx.fillText("UNBOUND FRAME // DEPTH: +4.82m", 640, 90);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const isAct7 = scrollState.act === 7;
    const isAct6End = scrollState.act === 6 && scrollState.actProgress > 0.82;
    const isAct8Start = scrollState.act === 8 && scrollState.actProgress < 0.18;
    const isVisible = isAct7 || isAct6End || isAct8Start;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const p = isAct7
      ? scrollState.actProgress
      : isAct6End
      ? (scrollState.actProgress - 0.82) / 0.18 * 0.05
      : 1.0;

    const t = state.clock.elapsedTime;
    const pointer = scrollState.pointer;

    // 1. Seamless Entrance Bloom from Act 6
    // Opacity fades up smoothly as entranceFade or local progress advances
    const masterEntrance = isAct7 ? Math.max(act07State.entranceFade, Math.min(1, p / 0.15)) : 0.05;
    const exitAlpha = isAct7 && p > 0.85 ? Math.max(0, 1.0 - (p - 0.85) / 0.15) : 1.0;
    const globalAlpha = masterEntrance * exitAlpha;

    // 2. Parallax and Gentle Floating Dynamics
    groupRef.current.rotation.y = pointer.x * 0.06;
    groupRef.current.rotation.x = -pointer.y * 0.04;

    // 3. Central Hero Frame Dynamics
    if (heroGroupRef.current) {
      const heroZ = act07State.heroZ + Math.sin(t * 1.2) * 0.02;
      heroGroupRef.current.position.z = heroZ;
      heroGroupRef.current.position.y = Math.cos(t * 0.9) * 0.015;

      // Scale responds to spread
      const heroScale = 1.0 + act07State.frameSpread * 0.05;
      heroGroupRef.current.scale.set(heroScale, heroScale, 1.0);
    }

    // 4. Flanking Frames Lateral Unfolding & Angular Perspective
    const spread = act07State.frameSpread;
    const exitCorridor = act07State.exitFold;

    if (leftGroupRef.current) {
      // Unfolds from behind hero to lateral position, then folds inward as corridor wall
      const baseLeftX = THREE.MathUtils.lerp(-1.0, -3.1, spread);
      const corridorLeftX = THREE.MathUtils.lerp(baseLeftX, -2.4, exitCorridor);
      const corridorRotY = THREE.MathUtils.lerp(0.28, Math.PI * 0.45, exitCorridor);

      leftGroupRef.current.position.x = corridorLeftX;
      leftGroupRef.current.position.y = 0.3 + Math.sin(t * 1.1 + 1.0) * 0.02;
      leftGroupRef.current.position.z = act07State.flankZ - 0.4 * (1.0 - spread) - exitCorridor * 1.5;
      leftGroupRef.current.rotation.y = corridorRotY;
    }

    if (rightGroupRef.current) {
      // Unfolds to right flank, then folds inward as right corridor wall
      const baseRightX = THREE.MathUtils.lerp(1.0, 3.1, spread);
      const corridorRightX = THREE.MathUtils.lerp(baseRightX, 2.4, exitCorridor);
      const corridorRotY = THREE.MathUtils.lerp(-0.25, -Math.PI * 0.45, exitCorridor);

      rightGroupRef.current.position.x = corridorRightX;
      rightGroupRef.current.position.y = -0.2 + Math.cos(t * 1.0 + 2.0) * 0.02;
      rightGroupRef.current.position.z = act07State.flankZ - 0.5 * (1.0 - spread) - exitCorridor * 1.5;
      rightGroupRef.current.rotation.y = corridorRotY;
    }

    // 5. Background Gallery Parallax
    if (backGalleryRef.current) {
      backGalleryRef.current.position.z = -2.2 - (1.0 - spread) * 1.5;
    }

    // 6. Material Opacity and Rupture Modulation
    if (heroMatRef.current) heroMatRef.current.opacity = 0.96 * globalAlpha;
    if (leftMatRef.current) leftMatRef.current.opacity = 0.88 * globalAlpha * spread;
    if (rightMatRef.current) rightMatRef.current.opacity = 0.88 * globalAlpha * spread;
    if (backLeftMatRef.current) backLeftMatRef.current.opacity = 0.50 * globalAlpha * spread;
    if (backRightMatRef.current) backRightMatRef.current.opacity = 0.50 * globalAlpha * spread;

    // 7. Gridlines & Border Glow
    const gridAlpha = act07State.gridOpacity * globalAlpha;
    if (heroGridMatRef.current) heroGridMatRef.current.opacity = 0.55 * gridAlpha;
    if (heroBorderMatRef.current) {
      heroBorderMatRef.current.opacity = THREE.MathUtils.lerp(0.8, 0.3, act07State.frameBreak) * globalAlpha;
    }
    if (leftBorderMatRef.current) leftBorderMatRef.current.opacity = 0.65 * globalAlpha * spread;
    if (rightBorderMatRef.current) rightBorderMatRef.current.opacity = 0.65 * globalAlpha * spread;

    // 8. Perimeter Rupture Sparks Bursting Outward
    if (boundarySparksRef.current) {
      const geom = boundarySparksRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const sparkP = act07State.sparkExpansion;

      for (let i = 0; i < SPARK_COUNT; i++) {
        const ambientJitter = Math.sin(t * 3.5 + i) * 0.02;
        const px = sparkInitialPos[i * 3] + sparkDir[i * 3] * sparkP + ambientJitter;
        const py = sparkInitialPos[i * 3 + 1] + sparkDir[i * 3 + 1] * sparkP + ambientJitter;
        const pz = sparkInitialPos[i * 3 + 2] + sparkDir[i * 3 + 2] * sparkP;
        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;

      if (sparkMatRef.current) {
        sparkMatRef.current.opacity = Math.max(0, Math.sin(sparkP * Math.PI)) * 0.95 * globalAlpha;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. HERO 2.39:1 ANAMORPHIC SCOPE MASTER FRAME */}
      <group ref={heroGroupRef} position={[0, 0, 0]}>
        <mesh>
          <planeGeometry args={[4.2, 1.76]} />
          <meshStandardMaterial
            ref={heroMatRef}
            map={textures.hero}
            roughness={0.2}
            metalness={0.15}
            transparent
            opacity={0}
          />
        </mesh>

        {/* Viewfinder Rule-of-Thirds Gridlines */}
        <lineSegments geometry={gridGeom}>
          <lineBasicMaterial
            ref={heroGridMatRef}
            color="#FF5F1F"
            transparent
            opacity={0}
            linewidth={1}
          />
        </lineSegments>

        {/* Glowing Frame Border */}
        <lineSegments geometry={heroBorderGeom}>
          <lineBasicMaterial
            ref={heroBorderMatRef}
            color="#FF5F1F"
            transparent
            opacity={0}
            linewidth={1.5}
          />
        </lineSegments>

        {/* Floating Viewfinder HUD Overlay */}
        <mesh position={[0, -1.05, 0.01]}>
          <planeGeometry args={[4.2, 0.42]} />
          <meshBasicMaterial
            map={hudTexture}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 2. LEFT FLANKING 16:9 DIGITAL CINEMA FRAME */}
      <group ref={leftGroupRef} position={[-3.1, 0.3, -0.4]} rotation={[0, 0.28, 0]}>
        <mesh>
          <planeGeometry args={[2.8, 1.57]} />
          <meshStandardMaterial
            ref={leftMatRef}
            map={textures.left}
            roughness={0.25}
            metalness={0.1}
            transparent
            opacity={0}
          />
        </mesh>
        <lineSegments geometry={leftBorderGeom}>
          <lineBasicMaterial
            ref={leftBorderMatRef}
            color="#38bdf8"
            transparent
            opacity={0}
            linewidth={1.5}
          />
        </lineSegments>
      </group>

      {/* 3. RIGHT FLANKING 1.33:1 ACADEMY/IMAX FRAME */}
      <group ref={rightGroupRef} position={[3.1, -0.2, -0.5]} rotation={[0, -0.25, 0]}>
        <mesh>
          <planeGeometry args={[2.4, 1.8]} />
          <meshStandardMaterial
            ref={rightMatRef}
            map={textures.right}
            roughness={0.25}
            metalness={0.1}
            transparent
            opacity={0}
          />
        </mesh>
        <lineSegments geometry={rightBorderGeom}>
          <lineBasicMaterial
            ref={rightBorderMatRef}
            color="#FF5F1F"
            transparent
            opacity={0}
            linewidth={1.5}
          />
        </lineSegments>
      </group>

      {/* 4. BACKGROUND PERSPECTIVE GALLERY */}
      <group ref={backGalleryRef} position={[0, 0, -2.2]}>
        {/* Upper Left Depth Frame */}
        <mesh position={[-2.6, 2.0, 0]} rotation={[0.08, 0.15, 0]}>
          <planeGeometry args={[2.2, 1.24]} />
          <meshStandardMaterial
            ref={backLeftMatRef}
            map={textures.backLeft}
            roughness={0.3}
            transparent
            opacity={0}
          />
        </mesh>
        {/* Lower Right Depth Frame */}
        <mesh position={[2.6, -1.8, 0]} rotation={[-0.08, -0.15, 0]}>
          <planeGeometry args={[2.2, 1.24]} />
          <meshStandardMaterial
            ref={backRightMatRef}
            map={textures.backRight}
            roughness={0.3}
            transparent
            opacity={0}
          />
        </mesh>
      </group>

      {/* 5. EXPLODING PERIMETER BORDER SPARKS */}
      <points ref={boundarySparksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkInitialPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={sparkMatRef}
          size={0.065}
          color="#FF5F1F"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
