import * as THREE from "three";



/**
 * Generates an ultra-realistic, high-resolution procedural arterial blood splatter texture
 * featuring jagged impact bursts, high-velocity directional droplets, fine aerosol mist,
 * and downward-flowing viscous gravity drips.
 */
export interface LineBloodTextures {
  diffuseMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

export interface MonolithBloodTextures {
  line1: LineBloodTextures;
  line2: LineBloodTextures;
}

let cachedMonolithTextures: MonolithBloodTextures | null = null;

function createSplatterTextureForLine(lineType: "line1" | "line2"): LineBloodTextures {
  const width = 1024;
  const height = 256; // 4:1 aspect ratio perfectly matches a single horizontal text line, 4x lighter VRAM

  // 1. Diffuse (Color)
  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext("2d")!;

  // 2. Roughness (Wet mirror specular)
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = width;
  roughCanvas.height = height;
  const roughCtx = roughCanvas.getContext("2d")!;

  // 3. Bump (Surface relief)
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext("2d")!;

  // 4. Emissive (Internal arterial biological glow - pure black for clean letters, crimson for blood)
  const emissiveCanvas = document.createElement("canvas");
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;
  const emCtx = emissiveCanvas.getContext("2d")!;

  // Base background:
  // Pristine titanium white/light grey for diffuse
  diffCtx.fillStyle = "#e8e8ed";
  diffCtx.fillRect(0, 0, width, height);

  // Base roughness: satin metal (~0.32 = #525252)
  roughCtx.fillStyle = "#525252";
  roughCtx.fillRect(0, 0, width, height);

  // Base bump: neutral height (#808080)
  bumpCtx.fillStyle = "#808080";
  bumpCtx.fillRect(0, 0, width, height);

  // Base emissive: pitch black (#000000) so clean text never washes out or blooms
  emCtx.fillStyle = "#000000";
  emCtx.fillRect(0, 0, width, height);

  // Seeded deterministic pseudo-random helper
  let seed = lineType === "line1" ? 42091 : 98127;
  const rnd = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const drawCluster = (
    cx: number,
    cy: number,
    baseR: number,
    dripLen: number,
    velAngle: number
  ) => {
    const points = 18 + Math.floor(rnd() * 8);
    const radList: number[] = [];
    for (let i = 0; i < points; i++) {
      radList.push(baseR * (0.6 + rnd() * 0.8));
    }

    const drawBlob = (
      context: CanvasRenderingContext2D,
      scale: number,
      style: string | CanvasGradient
    ) => {
      context.save();
      context.translate(cx, cy);
      context.beginPath();
      for (let i = 0; i <= points; i++) {
        const idx = i % points;
        const angle = (idx / points) * Math.PI * 2;
        const r = radList[idx] * scale;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) context.moveTo(x, y);
        else {
          const prevIdx = (idx - 1 + points) % points;
          const prevAngle = (prevIdx / points) * Math.PI * 2;
          const prevR = radList[prevIdx] * scale;
          const px = Math.cos(prevAngle) * prevR;
          const py = Math.sin(prevAngle) * prevR;
          context.quadraticCurveTo(px, py, (px + x) * 0.5, (py + y) * 0.5);
        }
      }
      context.closePath();
      context.fillStyle = style;
      context.fill();
      context.restore();
    };

    // Multi-layered arterial blood impact:
    // 1. Oxygenated crimson rim halo
    drawBlob(diffCtx, 1.15, "rgba(185, 6, 22, 0.88)");
    // 2. Viscous arterial body
    drawBlob(diffCtx, 0.95, "rgba(125, 2, 14, 0.98)");
    // 3. Thick dark coagulated core
    drawBlob(diffCtx, 0.65, "#260003");

    // Roughness: Mirror-wet gloss on blood (roughness 0.02 = #050505)
    drawBlob(roughCtx, 1.15, "#050505");

    // Bump: Raised meniscus rim on impact
    drawBlob(bumpCtx, 1.12, "#b0b0b0");
    drawBlob(bumpCtx, 0.70, "#888888");

    // Emissive: Deep biological crimson self-illumination
    drawBlob(emCtx, 1.05, "rgba(95, 0, 8, 0.75)");
    drawBlob(emCtx, 0.65, "#300004");

    // B. High-velocity satellites (droplets flung outward on impact)
    const satCount = 20 + Math.floor(rnd() * 26);
    for (let s = 0; s < satCount; s++) {
      const spread = (rnd() - 0.5) * 1.9;
      const angle = velAngle + spread;
      const dist = baseR * (1.1 + rnd() * 2.6);
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const sRadius = 2.2 + rnd() * (baseR * 0.14);
      const stretch = 1.3 + rnd() * 1.5;

      diffCtx.save();
      diffCtx.translate(sx, sy);
      diffCtx.rotate(angle);
      diffCtx.beginPath();
      diffCtx.ellipse(0, 0, sRadius * stretch, sRadius, 0, 0, Math.PI * 2);
      diffCtx.fillStyle = rnd() > 0.4 ? "#82020e" : "#3e0005";
      diffCtx.fill();
      diffCtx.restore();

      roughCtx.save();
      roughCtx.translate(sx, sy);
      roughCtx.rotate(angle);
      roughCtx.beginPath();
      roughCtx.ellipse(0, 0, sRadius * stretch, sRadius, 0, 0, Math.PI * 2);
      roughCtx.fillStyle = "#050505";
      roughCtx.fill();
      roughCtx.restore();

      bumpCtx.save();
      bumpCtx.translate(sx, sy);
      bumpCtx.beginPath();
      bumpCtx.arc(0, 0, sRadius, 0, Math.PI * 2);
      bumpCtx.fillStyle = "#a2a2a2";
      bumpCtx.fill();
      bumpCtx.restore();

      emCtx.save();
      emCtx.translate(sx, sy);
      emCtx.beginPath();
      emCtx.arc(0, 0, sRadius, 0, Math.PI * 2);
      emCtx.fillStyle = "#3a0004";
      emCtx.fill();
      emCtx.restore();
    }

    // C. Gravity Drips (Viscous blood running downwards down the letter faces)
    if (dripLen > 0) {
      const drips = 1 + Math.floor(rnd() * 3);
      for (let d = 0; d < drips; d++) {
        const startX = cx + (rnd() - 0.5) * (baseR * 0.7);
        const startY = cy + baseR * 0.35;
        const len = dripLen * (0.65 + rnd() * 0.8);
        const dripWidth = 3.2 + rnd() * 5.5;

        // Tapered viscous drip stream
        diffCtx.save();
        diffCtx.beginPath();
        diffCtx.moveTo(startX - dripWidth * 0.5, startY);
        diffCtx.bezierCurveTo(
          startX - dripWidth * 0.3,
          startY + len * 0.45,
          startX - dripWidth * 0.2,
          startY + len * 0.85,
          startX - dripWidth * 0.7,
          startY + len
        );
        // Terminal teardrop bulb
        diffCtx.arc(startX, startY + len, dripWidth * 1.35, Math.PI, 0, true);
        diffCtx.bezierCurveTo(
          startX + dripWidth * 0.2,
          startY + len * 0.85,
          startX + dripWidth * 0.3,
          startY + len * 0.45,
          startX + dripWidth * 0.5,
          startY
        );
        diffCtx.closePath();
        diffCtx.fillStyle = "#5c0007";
        diffCtx.fill();
        diffCtx.restore();

        // Wet gloss on drip
        roughCtx.save();
        roughCtx.beginPath();
        roughCtx.rect(startX - dripWidth, startY, dripWidth * 2, len + dripWidth * 2.5);
        roughCtx.fillStyle = "#050505";
        roughCtx.fill();
        roughCtx.restore();

        // Raised drip relief
        bumpCtx.save();
        bumpCtx.beginPath();
        bumpCtx.arc(startX, startY + len, dripWidth * 1.3, 0, Math.PI * 2);
        bumpCtx.fillStyle = "#b2b2b2";
        bumpCtx.fill();
        bumpCtx.restore();

        // Drip arterial glow
        emCtx.save();
        emCtx.beginPath();
        emCtx.arc(startX, startY + len, dripWidth * 1.2, 0, Math.PI * 2);
        emCtx.fillStyle = "#4a0005";
        emCtx.fill();
        emCtx.restore();
      }
    }
  };

  // Strategic cluster distribution tuned to typographic letter locations:
  if (lineType === "line1") {
    // "AFTER EFFECTS" (width: 2048, height: 512, Y center ~ 240)
    // Left: "AFTER" (X: 150 to 800)
    drawCluster(240, 200, 36, 120, -0.4);
    drawCluster(520, 230, 48, 160, 0.5);
    drawCluster(750, 190, 32, 90, -1.1);

    // Right: "EFFECTS" (X: 950 to 1950 - heavy impact!)
    drawCluster(1080, 210, 56, 190, 0.7);
    drawCluster(1360, 180, 68, 230, 1.2); // Big splash across 'FX'
    drawCluster(1620, 240, 44, 150, -0.6);
    drawCluster(1850, 220, 52, 170, 0.4);
  } else {
    // "IS IN MY BLOOD." (width: 2048, height: 512, Y center ~ 240)
    // "IS IN" (X: 180 to 700)
    drawCluster(280, 210, 40, 110, 0.3);
    drawCluster(560, 230, 35, 95, -0.7);

    // "MY" (X: 750 to 1050)
    drawCluster(900, 190, 45, 140, 0.6);

    // "BLOOD." (X: 1100 to 1950 - MAXIMUM ARTERIAL IMPACT & VISCERAL CLOTS!)
    drawCluster(1220, 190, 72, 240, 0.9); // Huge impact on 'B'
    drawCluster(1420, 170, 85, 270, 0.4); // Huge impact on 'LO'
    drawCluster(1650, 210, 78, 260, -0.4); // Huge impact on 'OD'
    drawCluster(1880, 230, 58, 200, 0.2); // Visceral burst on '.' period!
  }

  // Aerosol micro-fleck stippling (380 fine droplets across each line)
  for (let i = 0; i < 380; i++) {
    const fx = rnd() * width;
    const fy = rnd() * height;
    const fr = 0.9 + rnd() * 2.4;

    diffCtx.beginPath();
    diffCtx.arc(fx, fy, fr, 0, Math.PI * 2);
    diffCtx.fillStyle = rnd() > 0.5 ? "rgba(165, 4, 20, 0.9)" : "rgba(75, 0, 6, 0.95)";
    diffCtx.fill();

    roughCtx.beginPath();
    roughCtx.arc(fx, fy, fr, 0, Math.PI * 2);
    roughCtx.fillStyle = "#080808";
    roughCtx.fill();

    emCtx.beginPath();
    emCtx.arc(fx, fy, fr, 0, Math.PI * 2);
    emCtx.fillStyle = "#2a0003";
    emCtx.fill();
  }

  const diffuseMap = new THREE.CanvasTexture(diffCanvas);
  diffuseMap.colorSpace = THREE.SRGBColorSpace;
  diffuseMap.wrapS = THREE.ClampToEdgeWrapping;
  diffuseMap.wrapT = THREE.ClampToEdgeWrapping;
  diffuseMap.minFilter = THREE.LinearFilter;
  diffuseMap.magFilter = THREE.LinearFilter;
  diffuseMap.generateMipmaps = false;
  diffuseMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.minFilter = THREE.LinearFilter;
  roughnessMap.magFilter = THREE.LinearFilter;
  roughnessMap.generateMipmaps = false;
  roughnessMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.ClampToEdgeWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.minFilter = THREE.LinearFilter;
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.generateMipmaps = false;
  bumpMap.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.ClampToEdgeWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.minFilter = THREE.LinearFilter;
  emissiveMap.magFilter = THREE.LinearFilter;
  emissiveMap.generateMipmaps = false;
  emissiveMap.needsUpdate = true;

  return { diffuseMap, roughnessMap, bumpMap, emissiveMap };
}

export function getMonolithBloodTextures(): MonolithBloodTextures {
  if (cachedMonolithTextures) return cachedMonolithTextures;
  cachedMonolithTextures = {
    line1: createSplatterTextureForLine("line1"),
    line2: createSplatterTextureForLine("line2"),
  };
  return cachedMonolithTextures;
}

// Backward-compatible export
export function getBloodSplatterTextures() {
  const m = getMonolithBloodTextures();
  return m.line1;
}

// Pre-warm monolith textures immediately on load so zero texture creation happens mid-scroll
if (typeof document !== "undefined") {
  getMonolithBloodTextures();
}
