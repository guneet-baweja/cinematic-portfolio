---
name: barbajs
description: Smooth page transitions and route transitions with Barba.js. Use when implementing fluid page-to-page transitions, persistent WebGL canvases across routes, curtain animations, and seamless visual storytelling.
---

# Barba.js Page Transitions

Barba.js creates fluid, app-like transitions between web pages without page reloads, maintaining persistent WebGL scenes and scroll continuity.

## Core Initialization & GSAP Hookup

```typescript
import barba from '@barba/core';
import gsap from 'gsap';

barba.init({
  sync: true, // Run leaving and entering animations concurrently
  transitions: [
    {
      name: 'cinematic-curtain',
      async leave(data) {
        const done = this.async();
        const tl = gsap.timeline({ onComplete: done });

        tl.to(data.current.container, {
          opacity: 0,
          y: -50,
          duration: 0.6,
          ease: 'power2.inOut',
        });
      },
      async enter(data) {
        gsap.from(data.next.container, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: 'power3.out',
        });
      },
    },
  ],
});
```

## Best Practices with Three.js & React
- Keep the Three.js `<Canvas>` outside the Barba container to preserve the WebGL context across page changes.
- Reset Lenis scroll position (`lenis.scrollTo(0, { immediate: true })`) during the route change lifecycle.
