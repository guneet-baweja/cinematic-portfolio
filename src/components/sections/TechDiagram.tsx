import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import "./TechDiagram.css";

const HUB = { x: 260, y: 210 };

// Complex asymmetrical right-angled network paths
const PATHS = [
  // 1. Hub -> TIMELINE
  { id: "timeline-path", d: "M 260 210 H 380 V 80 H 510" },
  // 2. Hub -> WAVEFORM
  { id: "waveform-path", d: "M 260 210 H 150 V 120 H 70" },
  // 3. Hub -> RENDER 100%
  { id: "render-path", d: "M 260 210 V 310 H 430 V 350 H 520" },
  // 4. Asymmetrical telemetry branches
  { id: "audio-branch", d: "M 380 210 H 470 V 160 H 560" },
  { id: "sync-branch", d: "M 150 210 V 310 H 80" },
  { id: "cross-bus", d: "M 380 80 H 430 V 310" },
];

// Pulsing teal dots at right-angled intersections & branch points
const INTERSECTIONS = [
  { x: 380, y: 210 },
  { x: 380, y: 80 },
  { x: 150, y: 210 },
  { x: 150, y: 120 },
  { x: 260, y: 310 },
  { x: 430, y: 310 },
  { x: 430, y: 350 },
  { x: 470, y: 210 },
  { x: 470, y: 160 },
  { x: 150, y: 310 },
  { x: 430, y: 80 },
];

const NODES = [
  { id: "timeline", label: "TIMELINE", x: 510, y: 80, align: "right" },
  { id: "waveform", label: "WAVEFORM", x: 70, y: 120, align: "left" },
  { id: "render", label: "RENDER 100%", x: 520, y: 350, align: "right" },
  { id: "audio", label: "AUDIO 48kHz", x: 560, y: 160, align: "right" },
  { id: "sync", label: "SYNC 23.98", x: 80, y: 310, align: "left" },
];

export function TechDiagram() {
  const rootRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useScopedGsap(
    rootRef as unknown as React.RefObject<HTMLElement | null>,
    () => {
      const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];

      // Initialize right-angled lines with stroke-dashoffset for draw-in effect
      paths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      // 1. Physically draw right-angled lines from central hub
      tl.to(paths, {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: "power2.inOut",
        stagger: 0.12,
      });

      // 2. Reveal pulsing teal dots at intersections
      tl.fromTo(
        ".tech-diagram__intersection",
        { scale: 0, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: "back.out(2)",
        },
        "-=0.7"
      );

      // 3. Reveal destination labels
      tl.fromTo(
        ".tech-diagram__node",
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
        },
        "-=0.4"
      );
    },
    []
  );

  return (
    <svg ref={rootRef} className="tech-diagram" viewBox="0 0 680 430" fill="none" aria-hidden>
      {/* Background architectural grid */}
      <line x1="40" y1="210" x2="640" y2="210" className="tech-diagram__grid" />
      <line x1="260" y1="40" x2="260" y2="390" className="tech-diagram__grid" />
      <line x1="380" y1="40" x2="380" y2="390" className="tech-diagram__grid" />
      <line x1="150" y1="40" x2="150" y2="390" className="tech-diagram__grid" />

      {/* Thin, right-angled SVG lines (stroke-width: 1, stroke color: neon-orange #FF5F1F) */}
      {PATHS.map((item, i) => (
        <path
          key={item.id}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d={item.d}
          className="tech-diagram__line"
        />
      ))}

      {/* Central Hub */}
      <circle cx={HUB.x} cy={HUB.y} r={14} className="tech-diagram__hub-ring" />
      <circle cx={HUB.x} cy={HUB.y} r={5} className="tech-diagram__hub-core" />

      {/* Pulsing teal (#00FFC4) dots at intersections */}
      {INTERSECTIONS.map((pt, i) => (
        <g key={i} className="tech-diagram__intersection">
          <circle cx={pt.x} cy={pt.y} r={3} className="tech-diagram__dot" />
          <circle cx={pt.x} cy={pt.y} r={3} className="tech-diagram__dot tech-diagram__dot--pulse" />
        </g>
      ))}

      {/* Asymmetrical terminal labels */}
      {NODES.map((node) => {
        const isRight = node.align === "right";
        const bgX = isRight ? node.x : node.x - 110;
        const textX = isRight ? node.x + 55 : node.x - 55;

        return (
          <g key={node.id} className="tech-diagram__node">
            <circle cx={node.x} cy={node.y} r={3.5} className="tech-diagram__dot" />
            <circle cx={node.x} cy={node.y} r={3.5} className="tech-diagram__dot tech-diagram__dot--pulse" />
            <rect
              x={bgX}
              y={node.y - 12}
              width={110}
              height={24}
              className="tech-diagram__label-bg"
            />
            <text
              x={textX}
              y={node.y + 4}
              textAnchor="middle"
              className="tech-diagram__label"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
