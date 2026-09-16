# Scroll Driven 3D

Example architecture:

scroll progress
→ GSAP ScrollTrigger
→ normalized progress
→ camera position
→ camera rotation
→ object rotation
→ object position
→ shader uniforms

Use a timeline for multi-stage choreography.
