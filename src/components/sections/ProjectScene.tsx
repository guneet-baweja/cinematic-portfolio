import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { VideoProject } from "./VideoProject";
import type { Project } from "../../types/project";
import "./ProjectScene.css";

export function ProjectScene({
  project,
  index,
  onOpenCinema,
}: {
  project: Project;
  index: number;
  onOpenCinema?: (project: Project) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const reversed = index % 2 === 1;

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      ".project-scene__frame",
      { scale: 0.82, borderRadius: 28 },
      {
        scale: 1,
        borderRadius: 4,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 95%",
          end: "top 30%",
          scrub: 0.6,
        },
      }
    );

    gsap.fromTo(
      ".project-scene__meta > *",
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.08,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      }
    );
  }, []);

  return (
    <article ref={sectionRef} className={`project-scene ${reversed ? "is-reversed" : ""}`}>
      <div className="container project-scene__inner">
        <div className="project-scene__media">
          <div className="project-scene__frame">
            <VideoProject
              src={project.video}
              poster={project.poster}
              title={project.title}
              onOpenCinema={() => onOpenCinema?.(project)}
            />
          </div>
        </div>
        <div className="project-scene__meta">
          <span className="eyebrow">
            {String(index + 1).padStart(2, "0")} — {project.category}
          </span>
          <h3
            onClick={() => onOpenCinema?.(project)}
            className="project-scene__clickable-title"
            title="Open in Cinema Lightbox"
          >
            {project.title}
            <span className="project-scene__title-arrow">↗</span>
          </h3>
          <p>{project.description}</p>
          <dl className="project-scene__facts">
            <div>
              <dt>Client</dt>
              <dd>{project.client}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt>Tools</dt>
              <dd>{project.software.join(", ")}</dd>
            </div>
          </dl>

          {/* Interactive Project Actions */}
          <div className="project-scene__actions">
            <button
              type="button"
              className="project-scene__action-btn is-cinema"
              onClick={() => onOpenCinema?.(project)}
              title="Open full cinema theater view with audio"
            >
              <span className="project-scene__action-icon">▶</span>
              <span>WATCH FILM [CINEMA VIEW]</span>
            </button>

            <a
              href={project.video}
              target="_blank"
              rel="noopener noreferrer"
              className="project-scene__action-btn is-direct"
              title="Open direct video file in new tab"
            >
              <span>DIRECT LINK</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
