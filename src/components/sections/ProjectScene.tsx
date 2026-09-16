import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { VideoProject } from "./VideoProject";
import type { Project } from "../../types/project";
import "./ProjectScene.css";

export function ProjectScene({ project, index }: { project: Project; index: number }) {
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
            <VideoProject src={project.video} poster={project.poster} />
          </div>
        </div>
        <div className="project-scene__meta">
          <span className="eyebrow">
            {String(index + 1).padStart(2, "0")} — {project.category}
          </span>
          <h3>{project.title}</h3>
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
        </div>
      </div>
    </article>
  );
}
