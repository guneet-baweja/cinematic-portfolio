import * as THREE from "three";

/**
 * lighting.js — Multi-Stage Lighting Rig Matching Reference Video Frames
 */
export function createLighting(scene) {
  const lightsGroup = new THREE.Group();
  scene.add(lightsGroup);

  // 1. Ambient Dark Void Fill
  const ambientLight = new THREE.AmbientLight("#121620", 0.5);
  lightsGroup.add(ambientLight);

  // 2. Warm Golden/Amber Rim Light (grazes subject hair and left shoulder)
  const goldenRimLight = new THREE.DirectionalLight("#FFA040", 5.5);
  goldenRimLight.position.set(-3.5, 3.8, 1.2);
  lightsGroup.add(goldenRimLight);

  // 3. Studio Frontal Key Light (neutral white/cool softbox)
  const keyLight = new THREE.DirectionalLight("#F0F4FA", 2.0);
  keyLight.position.set(2.5, 1.5, 4.0);
  lightsGroup.add(keyLight);

  // 4. Subtle Top Backlight (cranial outline definition)
  const backRimLight = new THREE.DirectionalLight("#FFFFFF", 2.2);
  backRimLight.position.set(0, 4.5, -2.0);
  lightsGroup.add(backRimLight);

  // 5. Specular Corneal Eye Highlight Light (at 1 o'clock angle)
  const eyeSpecularLight = new THREE.PointLight("#FFFFFF", 1.8, 8, 2);
  eyeSpecularLight.position.set(0.65, 0.65, 1.8);
  lightsGroup.add(eyeSpecularLight);

  return {
    group: lightsGroup,
    ambient: ambientLight,
    goldenRim: goldenRimLight,
    key: keyLight,
    backRim: backRimLight,
    eyeSpecular: eyeSpecularLight,
  };
}

export function updateLighting(lights, frame) {
  // Golden rim light intensifies as blue background dissolves (f = 25 -> 60)
  if (frame < 25) {
    lights.goldenRim.intensity = 2.0;
  } else if (frame < 60) {
    const t = (frame - 25) / 35;
    lights.goldenRim.intensity = 2.0 + t * 4.0;
  } else {
    lights.goldenRim.intensity = 6.0;
  }

  // As we zoom into the macro eye (f > 170), adjust lighting to emphasize corneal specular reflex
  if (frame > 160) {
    const t = Math.min(1, (frame - 160) / 40);
    lights.eyeSpecular.intensity = 1.8 + t * 2.2;
    lights.key.intensity = 2.0 - t * 0.8;
  } else {
    lights.eyeSpecular.intensity = 1.8;
    lights.key.intensity = 2.0;
  }
}
