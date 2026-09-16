import { projects } from "../../data/projects";
import { ProjectScene } from "./ProjectScene";
import "./Portfolio.css";

export function Portfolio() {
  return (
    <section className="portfolio" id="portfolio">
      <div className="container portfolio__heading">
        <span className="eyebrow">05 — Selected Work</span>
        <h2>A few stories, cut to move.</h2>
      </div>
      {projects.map((project, i) => (
        <ProjectScene key={project.slug} project={project} index={i} />
      ))}
    </section>
  );
}
