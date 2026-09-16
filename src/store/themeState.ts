import * as THREE from "three";

/**
 * Strict global palette — no per-section theming.
 * Subtle, high-tech neon-orange is the one HUD accent used everywhere (lines, dots,
 * wireframe). Mint is reserved exclusively for the CTA headline and is
 * applied there directly in CSS, never through this module.
 */
export const HUD_COLOR = "#FF5F1F";
export const HUD_COLOR_THREE = new THREE.Color(HUD_COLOR);
