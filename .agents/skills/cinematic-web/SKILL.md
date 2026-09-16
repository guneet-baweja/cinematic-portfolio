---
name: cinematic-web
description: Build premium interactive websites with smooth scrolling, scroll-driven animation, 3D scenes, shaders, cinematic transitions, advanced typography, and high-performance motion using GSAP, Lenis, Anime.js, Three.js, R3F, Drei, Postprocessing, Barba.js, Theatre.js, Motion, and GLSL.
---

# Cinematic Web Experience Skill

## PURPOSE

Build premium, highly interactive web experiences with a strong visual identity.

This skill should be used when creating:
- Awwwards-style websites
- cinematic landing pages
- interactive product websites
- 3D portfolio websites
- creative agency websites
- immersive storytelling websites
- scroll-driven experiences
- WebGL experiences
- advanced motion systems

The goal is not to add random animations everywhere.

The goal is to create a coherent visual choreography where scrolling, typography, imagery, 3D objects, camera movement, shaders, transitions and interaction work as one system.

---

# CORE TECHNOLOGY STACK

Use the following responsibilities:

## Frontend Design
Use for:
- visual hierarchy
- typography
- composition
- layout
- responsive design
- visual direction
- interaction design

Reference:
references/frontend-design.md

## GSAP
Primary animation orchestration system.

Use for:
- timelines
- tweens
- stagger
- sequencing
- complex choreography
- scroll-driven animation
- transitions

Reference:
references/gsap.md

## ScrollTrigger
Use for:
- scroll progress
- scrub animation
- pinning
- section choreography
- scroll-based camera animation
- scroll-based object animation
- scroll-based shader uniforms

Reference:
references/scrolltrigger.md

## Lenis
Use as the smooth scrolling foundation.

Responsibilities:
- smooth scrolling
- scroll interpolation
- scroll velocity
- integration with GSAP ScrollTrigger

Reference:
references/lenis.md

## Anime.js
Use for lightweight:
- DOM animation
- SVG animation
- text animation
- small UI interactions
- simple timelines

Do not use Anime.js and GSAP to control the exact same animation.

Reference:
references/animejs.md

## Three.js
Use for:
- 3D scenes
- cameras
- meshes
- materials
- lights
- textures
- GLTF/GLB
- animation mixers
- WebGL/WebGPU rendering

Reference:
references/threejs.md

## React Three Fiber
Use when the project is React-based.

Reference:
references/r3f.md

## Drei
Use for reusable R3F helpers and abstractions.

Reference:
references/drei.md

## Postprocessing
Use for cinematic visual effects:
- bloom
- vignette
- noise
- chromatic aberration
- depth of field
- distortion
- glitch
- color effects

Reference:
references/postprocessing.md

## Barba.js
Use for:
- page transitions
- route transitions
- persistent visual continuity

Reference:
references/barbajs.md

## Theatre.js
Use when visual timeline/keyframe authoring is useful, especially for cinematic 3D sequences.

Reference:
references/theatrejs.md

## Motion
Use for React/UI-oriented animation when appropriate.

Do not introduce Motion unnecessarily if GSAP already owns the animation architecture.

Reference:
references/motion.md

## GLSL / Shaders
Use for:
- image distortion
- displacement
- liquid effects
- waves
- noise
- procedural visuals
- custom WebGL effects
- mouse interaction
- scroll-driven distortion

Reference:
references/shaders.md

---

# ANIMATION ARCHITECTURE

Preferred architecture:

Lenis
    ↓
scroll position / velocity
    ↓
GSAP ScrollTrigger
    ↓
animation progress
    ↓
DOM / typography / images / 3D / camera / shaders

For React 3D:

React
    ↓
React Three Fiber
    ↓
Three.js
    ↓
WebGL
    ↓
Shaders / Postprocessing

---

# LIBRARY OWNERSHIP RULE

Every animation should have one clear owner.

Use:

GSAP
→ complex timelines
→ scroll choreography
→ section transitions

Anime.js
→ lightweight DOM/SVG/text animation

Three.js / R3F
→ actual 3D rendering and frame-based 3D updates

Lenis
→ smooth scrolling

Shaders
→ GPU visual effects

Postprocessing
→ screen-space cinematic effects

Do not create competing animation systems for the same property.

---

# SCROLL EXPERIENCE

When a page is designed around scrolling:

1. Initialize Lenis.
2. Connect Lenis to GSAP.
3. Register ScrollTrigger.
4. Create a clear scroll choreography.
5. Use scrub where continuous control is required.
6. Use pinning only when it improves the story.
7. Keep scroll-triggered animation responsive.
8. Avoid excessive ScrollTriggers.
9. Clean up triggers/components when necessary.

---

# 3D EXPERIENCE

For 3D sections:

1. Establish a clear scene.
2. Use a suitable camera.
3. Load GLTF/GLB assets efficiently.
4. Animate transforms with a consistent system.
5. Connect scroll progress to camera/object movement where appropriate.
6. Use environment lighting carefully.
7. Avoid unnecessarily expensive geometry.
8. Lazy-load heavy assets.
9. Use Suspense/loading states in React Three Fiber.
10. Provide a mobile/performance fallback when required.

---

# SHADER EXPERIENCE

Shaders should be used when they provide a meaningful visual effect.

Common shader patterns:

- UV distortion
- displacement maps
- procedural noise
- wave distortion
- RGB/channel separation
- mouse interaction
- scroll velocity distortion
- image transition
- liquid effects
- procedural gradients

Do not use shaders merely because they are technically impressive.

---

# CINEMATIC CHOREOGRAPHY

Prefer a visual sequence such as:

Page Load
→ Hero reveal
→ Typography entrance
→ 3D object introduction
→ User scroll
→ Camera movement
→ Object rotation
→ Text transformation
→ Image/shader distortion
→ Section transition
→ Next visual scene

Animations should feel connected rather than being independent effects.

---

# TYPOGRAPHY MOTION

Use:
- character stagger
- word stagger
- line reveal
- clipping
- mask reveal
- position/opacity combinations
- scale
- tracking changes
- scroll-linked transformations

Avoid:
- generic fade-in on every element
- identical animation timing everywhere
- excessive bouncing
- random motion without purpose

---

# PERFORMANCE

Always consider:

- GPU cost
- large textures
- 3D model size
- draw calls
- shader complexity
- animation count
- mobile devices
- memory usage
- lazy loading
- asset compression
- responsive rendering

Use reduced motion when appropriate.

Respect:

prefers-reduced-motion

---

# RESPONSIVE MOTION

Desktop and mobile should not necessarily use identical animation values.

Adapt:
- camera distance
- object scale
- scroll distance
- animation intensity
- section height
- shader complexity
- particle count
- interaction density

---

# CODE QUALITY

Prefer:
- reusable components
- clear naming
- modular animation functions
- cleanup functions
- comments only where useful
- responsive logic
- progressive enhancement

Do not generate huge monolithic components when the experience can be divided into scenes/components.

---

# WHEN BUILDING A NEW WEBSITE

Before writing the final code:

1. Decide the visual direction.
2. Decide the motion language.
3. Decide whether 3D is actually needed.
4. Decide which animation engine owns which animation.
5. Decide the scroll architecture.
6. Decide the asset-loading strategy.
7. Decide the mobile fallback.
8. Then implement.

---

# DEFAULT STACK

For a modern React/Next.js cinematic website, prefer:

- React / Next.js
- GSAP
- ScrollTrigger
- Lenis
- Three.js
- React Three Fiber
- Drei
- Postprocessing
- GLSL

Use Anime.js, Barba.js, Theatre.js or Motion only when they provide a clear advantage.

---

# FINAL PRINCIPLE

Do not make a website that merely contains animations.

Make a website where the animation system is part of the design language.
