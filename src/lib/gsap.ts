import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, useGSAP, CustomEase);

// Sensible cinematic default: dignified Apple fluid curve
gsap.defaults({ ease: "power2.out", duration: 1 });

export { gsap, ScrollTrigger, useGSAP, CustomEase };
