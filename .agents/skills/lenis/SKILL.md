---
name: lenis-scroll
description: Master smooth scrolling with Lenis and seamless synchronization with GSAP ScrollTrigger. Use when configuring smooth scrolling, scroll interpolation, scroll velocity, pinning coordination, anchor scrolling, or preventing scroll jitter in web experiences.
---

# Lenis Smooth Scrolling

Lenis is the industry-standard smooth scrolling library designed for 60fps performance and perfect synchronization with WebGL, canvas, and GSAP ScrollTrigger.

## Core Setup & GSAP ScrollTrigger Sync

To avoid scroll jitter and sync issues, **Lenis must drive ScrollTrigger updates via requestAnimationFrame or GSAP's ticker**:

```typescript
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Lenis
export const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  touchMultiplier: 2,
});

// 2. Synchronize Lenis scroll with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// 3. Connect GSAP Ticker to Lenis RAF
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// 4. Disable GSAP lag smoothing to prevent visual jumps during sudden frame drops
gsap.ticker.lagSmoothing(0);
```

## React / Next.js Integration Hook

```typescript
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const updateRaf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
    };
  }, []);
}
```

## Velocity Uniform for Shaders

Lenis exposes instantaneous scroll velocity, ideal for driving distortion shaders:

```typescript
lenis.on('scroll', ({ velocity }) => {
  // Pass to shader uniform
  if (distortionMaterialRef.current) {
    distortionMaterialRef.current.uniforms.uVelocity.value = velocity * 0.005;
  }
});
```

## Critical Rules
1. **Never run multiple scroll smoothers**: Do not use Lenis alongside Locomotive Scroll or native CSS `scroll-behavior: smooth`.
2. **Anchor scrolling**: Use `lenis.scrollTo('#target', { offset: 0, duration: 1.5 })`.
3. **Modal / Overlay scroll lock**: Use `lenis.stop()` when opening full-screen modals and `lenis.start()` on close.
4. **Cleanup**: Always call `lenis.destroy()` when unmounting to avoid memory leaks.
