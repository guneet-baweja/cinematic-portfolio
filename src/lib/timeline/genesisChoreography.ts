import { gsap } from "../gsap";
import { APPLE_CURVE_NAMES } from "../motion/appleCurves";

export interface GenesisTimelineState {
  progress: number;
  activeBeat: number; // 1 to 8
  
  // Beat 3.1: Portrait
  portraitOpacity: number;
  portraitScale: number;
  portraitZ: number;
  
  // Beat 3.2: Eye Dolly & Aperture
  eyeDollyProgress: number;
  irisApertureOpen: number;
  
  // Beat 3.3: Mind POV & Synapses
  mindOpacity: number;
  synapseProgress: number;
  hemisphereSpread: number;
  
  // Beat 3.4: Nerve Descent
  nervePathProgress: number;
  nervePulseIntensity: number;
  
  // Beat 3.5: Heart Chamber
  heartOpacity: number;
  heartScale: number;
  heartBeatPulse: number;
  
  // Beat 3.6: Bloodstream & Brand Marks
  bloodstreamOpacity: number;
  streamSpeed: number;
  brandProgress: number; // 0 to 5 floating past
  
  // Beat 3.7: Chronograph Watch
  watchOpacity: number;
  watchScale: number;
  watchZ: number;
  engravingStroke: number; // 0 to 1
  
  // Beat 3.8: Iris Close to Void
  irisCloseProgress: number; // 0 to 1
  handoffAlpha: number; // 0 to 1 (1 = black void)
  
  // Camera Trajectory Override for Genesis
  camPos: [number, number, number];
  camLookAt: [number, number, number];
}

export const genesisState: GenesisTimelineState = {
  progress: 0,
  activeBeat: 1,
  
  portraitOpacity: 1.0,
  portraitScale: 1.0,
  portraitZ: 0.0,
  
  eyeDollyProgress: 0.0,
  irisApertureOpen: 0.0,
  
  mindOpacity: 0.0,
  synapseProgress: 0.0,
  hemisphereSpread: 0.0,
  
  nervePathProgress: 0.0,
  nervePulseIntensity: 0.0,
  
  heartOpacity: 0.0,
  heartScale: 0.8,
  heartBeatPulse: 1.0,
  
  bloodstreamOpacity: 0.0,
  streamSpeed: 1.0,
  brandProgress: 0.0,
  
  watchOpacity: 0.0,
  watchScale: 0.7,
  watchZ: -2.0,
  engravingStroke: 0.0,
  
  irisCloseProgress: 0.0,
  handoffAlpha: 0.0,
  
  camPos: [0, 0, 4.8],
  camLookAt: [0, 0, 0],
};

let genesisTimeline: gsap.core.Timeline | null = null;

export function buildGenesisTimeline(): gsap.core.Timeline {
  if (genesisTimeline) return genesisTimeline;

  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

  // -------------------------------------------------------------
  // BEAT 3.1: Portrait Idle & Reveal [0.00 -> 0.15]
  // -------------------------------------------------------------
  tl.addLabel("portrait", 0.0);
  tl.fromTo(
    genesisState,
    { portraitOpacity: 1.0, portraitScale: 1.0 },
    { portraitOpacity: 1.0, duration: 0.15 },
    0.0
  );

  // -------------------------------------------------------------
  // BEAT 3.2: Push into the Eye [0.15 -> 0.30]
  // -------------------------------------------------------------
  tl.addLabel("push-eye", 0.15);
  tl.to(
    genesisState,
    {
      eyeDollyProgress: 1.0,
      irisApertureOpen: 1.0,
      duration: 0.15,
      ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM,
    },
    0.15
  );
  tl.to(
    genesisState,
    {
      portraitOpacity: 0.0,
      duration: 0.06,
      ease: "power2.in",
    },
    0.24
  );

  // -------------------------------------------------------------
  // BEAT 3.3: Inside the Mind (Synapses) [0.30 -> 0.45]
  // -------------------------------------------------------------
  tl.addLabel("mind", 0.30);
  tl.fromTo(
    genesisState,
    { mindOpacity: 0.0, hemisphereSpread: 0.0, synapseProgress: 0.0 },
    {
      mindOpacity: 1.0,
      hemisphereSpread: 1.0,
      synapseProgress: 1.0,
      duration: 0.15,
      ease: APPLE_CURVE_NAMES.ENERGY,
    },
    0.30
  );

  // -------------------------------------------------------------
  // BEAT 3.4: Nerve Signal Descent [0.45 -> 0.58]
  // -------------------------------------------------------------
  tl.addLabel("nerve", 0.45);
  tl.to(
    genesisState,
    {
      mindOpacity: 0.0,
      nervePathProgress: 1.0,
      nervePulseIntensity: 1.0,
      duration: 0.13,
      ease: APPLE_CURVE_NAMES.CAMERA_RHYTHM,
    },
    0.45
  );

  // -------------------------------------------------------------
  // BEAT 3.5: The Heart ("EVERY CUT IS MADE WITH HEART") [0.58 -> 0.72]
  // -------------------------------------------------------------
  tl.addLabel("heart", 0.58);
  tl.fromTo(
    genesisState,
    { heartOpacity: 0.0, heartScale: 0.7 },
    {
      heartOpacity: 1.0,
      heartScale: 1.0,
      duration: 0.08,
      ease: APPLE_CURVE_NAMES.GLASS,
    },
    0.58
  );
  tl.to(
    genesisState,
    {
      heartOpacity: 0.0,
      heartScale: 1.4,
      duration: 0.06,
      ease: "power2.in",
    },
    0.66
  );

  // -------------------------------------------------------------
  // BEAT 3.6: Bloodstream & Software Brand Marks [0.72 -> 0.85]
  // -------------------------------------------------------------
  tl.addLabel("bloodstream", 0.72);
  tl.fromTo(
    genesisState,
    { bloodstreamOpacity: 0.0, brandProgress: 0.0 },
    {
      bloodstreamOpacity: 1.0,
      brandProgress: 5.0, // all 5 software brand marks pass
      duration: 0.13,
      ease: APPLE_CURVE_NAMES.FAST_DECAY,
    },
    0.72
  );
  tl.to(
    genesisState,
    {
      bloodstreamOpacity: 0.0,
      duration: 0.04,
    },
    0.81
  );

  // -------------------------------------------------------------
  // BEAT 3.7: Chronograph Watch ("ALWAYS DELIVER ON TIME") [0.85 -> 0.96]
  // -------------------------------------------------------------
  tl.addLabel("watch", 0.85);
  tl.fromTo(
    genesisState,
    { watchOpacity: 0.0, watchScale: 0.7, watchZ: -1.5, engravingStroke: 0.0 },
    {
      watchOpacity: 1.0,
      watchScale: 1.0,
      watchZ: 0.0,
      engravingStroke: 1.0,
      duration: 0.11,
      ease: APPLE_CURVE_NAMES.HEAVY_SETTLING,
    },
    0.85
  );


  // -------------------------------------------------------------
  // BEAT 3.8: Iris Close to Void Handoff [0.96 -> 1.00]
  // -------------------------------------------------------------
  tl.addLabel("iris-close", 0.96);
  tl.to(
    genesisState,
    {
      watchOpacity: 0.0,
      irisCloseProgress: 1.0,
      handoffAlpha: 1.0,
      duration: 0.04,
      ease: "power2.inOut",
    },
    0.96
  );

  genesisTimeline = tl;
  return tl;
}

export function scrubGenesisTimeline(progress: number) {
  const tl = buildGenesisTimeline();
  const clamped = Math.max(0, Math.min(1, progress));
  genesisState.progress = clamped;
  tl.progress(clamped);

  // Compute active beat
  if (clamped < 0.15) genesisState.activeBeat = 1;
  else if (clamped < 0.30) genesisState.activeBeat = 2;
  else if (clamped < 0.45) genesisState.activeBeat = 3;
  else if (clamped < 0.58) genesisState.activeBeat = 4;
  else if (clamped < 0.72) genesisState.activeBeat = 5;
  else if (clamped < 0.85) genesisState.activeBeat = 6;
  else if (clamped < 0.96) genesisState.activeBeat = 7;
  else genesisState.activeBeat = 8;

  // Camera choreography calculation for Genesis
  computeGenesisCamera(clamped);
}

function computeGenesisCamera(p: number) {
  if (p < 0.15) {
    // Beat 3.1: Frontal portrait framing
    genesisState.camPos = [0, 0, 4.8];
    genesisState.camLookAt = [0, 0, 0];
  } else if (p < 0.30) {
    // Beat 3.2: Dolly straight toward right eye (approx UV [0.53, 0.58] -> 3D coords [0.15, 0.45, 0.2])
    const t = (p - 0.15) / 0.15;
    genesisState.camPos = [
      0.15 * t,
      0.45 * t,
      4.8 * (1 - t) + 1.2 * t,
    ];
    genesisState.camLookAt = [0.15 * t, 0.45 * t, 0];
  } else if (p < 0.45) {
    // Beat 3.3: Mind POV inside synapse tunnel
    const t = (p - 0.30) / 0.15;
    genesisState.camPos = [0, 0, 5.0 - t * 1.5];
    genesisState.camLookAt = [0, 0, -2.0];
  } else if (p < 0.58) {
    // Beat 3.4: Curve descent toward heart
    const t = (p - 0.45) / 0.13;
    genesisState.camPos = [
      Math.sin(t * Math.PI) * 0.4,
      -t * 1.8,
      3.5 - t * 2.0,
    ];
    genesisState.camLookAt = [0, -1.8, -3.0];
  } else if (p < 0.72) {
    // Beat 3.5: Heart chamber
    genesisState.camPos = [0, 0, 3.8];
    genesisState.camLookAt = [0, 0, 0];
  } else if (p < 0.85) {
    // Beat 3.6: Bloodstream tunnel
    const t = (p - 0.72) / 0.13;
    genesisState.camPos = [0, 0, 4.0 - t * 1.0];
    genesisState.camLookAt = [0, 0, -5.0];
  } else if (p < 0.96) {
    // Beat 3.7: Chronograph watch
    const t = (p - 0.85) / 0.11;
    genesisState.camPos = [0, 0, 4.2 - t * 0.8];
    genesisState.camLookAt = [0, 0, 0];
  } else {
    // Beat 3.8: Black void handoff to Act 00 ([0, 0, 5.2] matches Act 00 start)
    const t = (p - 0.96) / 0.04;
    genesisState.camPos = [0, 0, 3.4 * (1 - t) + 5.2 * t];
    genesisState.camLookAt = [0, 0, 0];
  }
}
