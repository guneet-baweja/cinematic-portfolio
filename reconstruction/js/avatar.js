import * as THREE from "three";

/**
 * avatar.js — 3D Subject Portrait & Blue Backdrop Dissolve
 */
export function createAvatar(scene) {
  const avatarGroup = new THREE.Group();
  scene.add(avatarGroup);

  const texLoader = new THREE.TextureLoader();

  // 1. Circular Blue Backdrop Disk (present in Frames 001 to 024, dissolves 025 to 048)
  const backdropGeom = new THREE.CircleGeometry(1.92, 64);
  const backdropMat = new THREE.MeshBasicMaterial({
    color: "#1E58D6",
    transparent: true,
    opacity: 1.0,
    side: THREE.FrontSide,
  });
  const backdropMesh = new THREE.Mesh(backdropGeom, backdropMat);
  backdropMesh.position.set(0, 0, -0.02);
  avatarGroup.add(backdropMesh);

  // 2. High-Fidelity Subject Mesh
  const portraitTex = texLoader.load("./assets/portrait-cutout.png", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  const subjectGeom = new THREE.PlaneGeometry(3.85, 3.85, 32, 32);
  const subjectMat = new THREE.MeshStandardMaterial({
    map: portraitTex,
    transparent: true,
    roughness: 0.45,
    metalness: 0.1,
    alphaTest: 0.01,
  });

  const subjectMesh = new THREE.Mesh(subjectGeom, subjectMat);
  subjectMesh.position.set(0, 0, 0.0);
  avatarGroup.add(subjectMesh);

  return {
    group: avatarGroup,
    backdrop: backdropMesh,
    backdropMat: backdropMat,
    subject: subjectMesh,
    subjectMat: subjectMat,
  };
}

export function updateAvatar(avatar, frame, elapsedTime) {
  const { group, backdrop, backdropMat } = avatar;

  // Subtle breathing idle motion
  const breathY = Math.sin(elapsedTime * 1.5) * 0.018;
  group.position.y = breathY;

  // Blue backdrop dissolve (Frames 24 -> 36)
  if (frame < 24) {
    backdrop.visible = true;
    backdropMat.opacity = 1.0;
  } else if (frame <= 36) {
    backdrop.visible = true;
    const t = 1.0 - (frame - 24) / 12;
    backdropMat.opacity = Math.max(0, t);
  } else {
    backdrop.visible = false;
  }

  // Seamless crossfade into macro eye at close zoom (Frames 150 -> 170)
  if (avatar.subjectMat) {
    if (frame < 150) {
      avatar.subject.visible = true;
      avatar.subjectMat.opacity = 1.0;
    } else if (frame <= 170) {
      avatar.subject.visible = true;
      const t = 1.0 - (frame - 150) / 20;
      avatar.subjectMat.opacity = Math.max(0, t);
    } else {
      avatar.subject.visible = false;
    }
  }
}

