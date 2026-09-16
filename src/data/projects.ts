import type { Project } from "../types/project";

/**
 * MEDIA BASE URL
 * --------------
 * If VITE_MEDIA_BASE_URL is set (e.g., pointing to Cloudflare Pages or Cloudflare R2),
 * assets are fetched from the high-bandwidth CDN.
 * Otherwise, falls back to local /public directory.
 */
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL || "").replace(/\/$/, "");
export const getMediaUrl = (path: string) => `${MEDIA_BASE}${path}`;

/**
 * PROJECT DATA
 * ------------
 * Single source of truth for all video projects on the site.
 */
export const projects: Project[] = [
  {
    slug: "real-estate",
    title: "Ascend Residences",
    category: "REAL ESTATE",
    year: "2025",
    client: "Ascend Residences",
    role: "Editor / Colorist",
    software: ["Premiere Pro", "DaVinci Resolve", "After Effects"],
    description:
      "A cinematic walkthrough built to sell a feeling before it sells a floor plan — slow glides, negative space, and light doing the talking.",
    video: getMediaUrl("/videos/real-estate.mp4"),
    poster: getMediaUrl("/images/real-estate-poster.jpg"),
    featured: true,
  },
  {
    slug: "saas",
    title: "Fluent — Product Launch",
    category: "SAAS",
    year: "2025",
    client: "Fluent",
    role: "Editor / Motion Designer",
    software: ["Premiere Pro", "After Effects", "Cinema 4D"],
    description:
      "Turning a dashboard walkthrough into a launch film — UI choreography timed frame-for-frame against a rising synth line.",
    video: getMediaUrl("/videos/saas.mp4"),
    poster: getMediaUrl("/images/saas-poster.jpg"),
    featured: true,
  },
  {
    slug: "embassy",
    title: "EU Embassy Film",
    category: "CINEMATIC",
    year: "2024",
    client: "European Union Delegation",
    role: "Editor",
    software: ["Premiere Pro", "DaVinci Resolve"],
    description:
      "An institutional documentary short cut for weight and restraint — every cut earns its place.",
    video: getMediaUrl("/videos/embassy.mp4"),
    poster: getMediaUrl("/images/embassy-poster.jpg"),
    featured: true,
  },
  {
    slug: "taj-hotel",
    title: "Taj Hotel — Brand Film",
    category: "REAL ESTATE",
    year: "2024",
    client: "Taj Hotels",
    role: "Editor / Colorist",
    software: ["DaVinci Resolve", "Premiere Pro"],
    description:
      "Hospitality editing built on texture — linen, marble, low light — paced like a slow exhale.",
    video: getMediaUrl("/videos/taj-hotel.mp4"),
    poster: getMediaUrl("/images/taj-hotel-poster.jpg"),
    featured: true,
  },
  {
    slug: "harrdy-sandhu",
    title: "Harrdy Sandhu — Promo Cut",
    category: "MOTION",
    year: "2024",
    client: "Harrdy Sandhu",
    role: "Editor / Motion Designer",
    software: ["Premiere Pro", "After Effects"],
    description:
      "A promotional edit built for social-first energy — kinetic titles, tight cut rhythm, high replay value.",
    video: getMediaUrl("/videos/harrdy-sandhu.mp4"),
    poster: getMediaUrl("/images/harrdy-sandhu-poster.jpg"),
    featured: true,
  },
  {
    slug: "bennett-night",
    title: "Bennett — Night Sequence",
    category: "CINEMATIC",
    year: "2023",
    client: "Bennett",
    role: "Editor / Colorist",
    software: ["DaVinci Resolve", "Premiere Pro"],
    description:
      "A night-shot sequence graded for contrast and mood — practical light sources doing the heavy lifting.",
    video: getMediaUrl("/videos/bennett-night.mp4"),
    poster: getMediaUrl("/images/bennett-night-poster.jpg"),
  },
  {
    slug: "client-work",
    title: "High-Retention Creator Reel",
    category: "MOTION",
    year: "2025",
    client: "Creator Network",
    role: "Editor / Motion Designer",
    software: ["Premiere Pro", "After Effects"],
    description:
      "Fast-paced, hook-driven social video crafted for maximum audience retention and viral pacing.",
    video: getMediaUrl("/videos/client-work.mp4"),
    poster: getMediaUrl("/images/client-work-poster.jpg"),
  },
  {
    slug: "github-launch",
    title: "GitHub — Motion Identity",
    category: "SAAS",
    year: "2025",
    client: "Open Source",
    role: "Creative Director / Editor",
    software: ["After Effects", "Illustrator"],
    description:
      "Kinetic UI graphics and branded motion cut to introduce developer tooling with clarity and speed.",
    video: getMediaUrl("/videos/github-launch.mp4"),
    poster: getMediaUrl("/images/github-launch-poster.jpg"),
  },
  {
    slug: "before-after-vfx",
    title: "VFX & Motion Breakdown",
    category: "MOTION",
    year: "2025",
    client: "Ext Production / Debo Bhowmick",
    role: "VFX Artist / Motion Designer",
    software: ["After Effects", "Cinema 4D", "DaVinci Resolve"],
    description:
      "Side-by-side post-production breakdown demonstrating raw camera capture transformed into a 3D hologram sequence.",
    video: getMediaUrl("/videos/before-after.mp4"),
    poster: getMediaUrl("/images/before-after-poster.jpg"),
  },
];

export const beforeAfterExample = {
  title: "Before and After",
  description:
    "Same footage, two decisions. Raw capture on the left, delivered grade and pace on the right.",
  rawVideo: getMediaUrl("/videos/before-raw.mp4"),
  finalVideo: getMediaUrl("/videos/after-final.mp4"),
  rawPoster: getMediaUrl("/images/before-raw-poster.jpg"),
  finalPoster: getMediaUrl("/images/after-final-poster.jpg"),
};
