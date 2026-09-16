import * as THREE from "three";

/**
 * eye.js — Macro Ocular Iris, Corneal Highlight, and Pupil Dilation
 * Matches Frames 140 to 250 (Targeting eye -> Macro Iris -> Pupil Void Dive)
 */
export function createEye(scene) {
  const eyeGroup = new THREE.Group();
  scene.add(eyeGroup);

  const texLoader = new THREE.TextureLoader();

  // Load high-resolution macro eye texture
  const eyeTex = texLoader.load("./assets/eye-macro.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  // Macro Eye Plane Geometry: positioned exactly at the coordinates of Guneet's right eye
  // In the portrait face mesh, the viewer's right eye is at approximately [0.38, 0.34, 0.01]
  const eyeGeom = new THREE.PlaneGeometry(3.6, 2.2, 32, 32);

  // Custom Shader Material for dynamic pupil dilation & smooth crossfade
  const eyeMat = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: eyeTex },
      uOpacity: { value: 0.0 },
      uPupilDilation: { value: 0.0 }, // 0.0 to 1.0 (swallows iris)
      uCornealHighlight: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      uniform float uPupilDilation;
      uniform float uCornealHighlight;
      varying vec2 vUv;

      void main() {
        vec4 texColor = texture2D(uTexture, vUv);

        // Center of the pupil in texture UV space: approx [0.495, 0.505]
        vec2 pupilCenter = vec2(0.495, 0.505);
        float dist = length((vUv - pupilCenter) * vec2(1.0, 0.85));

        // Base pupil radius ~ 0.075. With dilation, expands up to 0.70
        float currentPupilRadius = 0.075 + uPupilDilation * 0.65;
        float pupilEdge = smoothstep(currentPupilRadius - 0.02, currentPupilRadius, dist);

        // Blend iris color with deep black pupil
        vec3 finalColor = mix(vec3(0.005, 0.005, 0.008), texColor.rgb, pupilEdge);

        // Specular highlight preservation at 1 o'clock (UV around [0.58, 0.62])
        float highlightDist = length((vUv - vec2(0.58, 0.62)) * vec2(1.2, 1.0));
        if (highlightDist < 0.08 && uPupilDilation < 0.75) {
          float hl = smoothstep(0.08, 0.02, highlightDist) * 0.75 * uCornealHighlight;
          finalColor += vec3(hl);
        }

        gl_FragColor = vec4(finalColor, uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
  // Position aligned with the right eye in 3D world space
  eyeMesh.position.set(0.38, 0.34, 0.02);
  eyeMesh.visible = false;
  eyeGroup.add(eyeMesh);

  return {
    group: eyeGroup,
    mesh: eyeMesh,
    material: eyeMat,
  };
}

export function updateEye(eye, frame) {
  const { mesh, material } = eye;

  if (frame < 150) {
    // Hidden during wide headshot and initial dolly
    mesh.visible = false;
    material.uniforms.uOpacity.value = 0.0;
    material.uniforms.uPupilDilation.value = 0.0;
  } else if (frame < 170) {
    // Crossfade in as camera aligns with the eye (f = 150 -> 170)
    mesh.visible = true;
    const t = (frame - 150) / 20;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uPupilDilation.value = 0.0;
  } else {
    // Macro Shot & Pupil Dilation (f = 170 -> 250)
    mesh.visible = true;
    material.uniforms.uOpacity.value = 1.0;

    // Exponential pupil dilation swallowing the screen into blackness
    const t = (frame - 170) / 80;
    const dilation = Math.pow(t, 2.2); // accelerating expansion
    material.uniforms.uPupilDilation.value = Math.min(1.0, dilation);
  }

}
