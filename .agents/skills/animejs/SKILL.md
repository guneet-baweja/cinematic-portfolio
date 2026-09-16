---
name: animejs
description: Lightweight DOM, SVG, and text animations with Anime.js. Use when implementing SVG path morphing, SVG line drawing, letter/word staggered text reveals, micro-interactions, and simple lightweight UI animations where full GSAP orchestration is not required.
---

# Anime.js Micro-Animations & SVG Manipulation

Anime.js is ideal for targeted micro-interactions, SVG stroke animation, morphing, and lightweight typography choreography.

## SVG Line Drawing & Morphing

```typescript
import anime from 'animejs';

// Animate SVG stroke draw-in
export function drawSvgPath(selector: string) {
  anime({
    targets: selector,
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeInOutSine',
    duration: 1500,
    delay: function(el, i) { return i * 250 },
    direction: 'alternate',
    loop: true
  });
}
```

## Typography Stagger Reveal

```typescript
import anime from 'animejs';

export function animateLetterEntrance(elements: HTMLElement[]) {
  anime({
    targets: elements,
    translateY: [40, 0],
    opacity: [0, 1],
    easing: 'easeOutExpo',
    duration: 1200,
    delay: anime.stagger(30, { start: 200 })
  });
}
```

## Architecture Rule
- **Single Owner Principle**: Never use Anime.js and GSAP on the same element's properties simultaneously. Use GSAP for page-wide scroll/timelines and Anime.js for self-contained SVG or DOM micro-interactions.
