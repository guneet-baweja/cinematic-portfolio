---
name: theatrejs
description: Visual authoring and keyframe sequencing with Theatre.js. Use when authoring complex 3D camera fly-throughs, cinematic choreographed scenes, lighting sequences, or when visual studio timeline keyframing is required.
---

# Theatre.js Cinematic Sequencing

Theatre.js is an animation library with a visual timeline editor designed for complex 3D camera paths, lighting choreography, and cinematic scenes.

## Studio Setup vs Production Build

```typescript
import { getProject, types } from '@theatre/core';

// Only load studio GUI during development
if (process.env.NODE_ENV === 'development') {
  import('@theatre/studio').then((studio) => studio.default.initialize());
}

// 1. Create Theatre Project & Sheet
const project = getProject('CinematicPortfolio');
const sheet = project.sheet('HeroScene');

// 2. Define Animatable Sheet Object for Camera
export const cameraObj = sheet.object('Camera', {
  position: types.compound({
    x: types.number(0, { range: [-10, 10] }),
    y: types.number(0, { range: [-10, 10] }),
    z: types.number(5, { range: [0, 20] }),
  }),
  fov: types.number(45, { range: [20, 90] }),
});
```

## Connecting Theatre.js Sequence to ScrollTrigger

```typescript
import { ScrollTrigger } from 'gsap/ScrollTrigger';

ScrollTrigger.create({
  trigger: '#hero-container',
  start: 'top top',
  end: '+=2000',
  scrub: 1,
  pin: true,
  onUpdate: (self) => {
    // Scrub Theatre.js sequence to match scroll percentage
    const sequenceLength = sheet.sequence.length;
    sheet.sequence.position = self.progress * sequenceLength;
  },
});
```
