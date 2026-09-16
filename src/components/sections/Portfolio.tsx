import { useState } from "react";
import { projects } from "../../data/projects";
import type { Project } from "../../types/project";
import { ProjectScene } from "./ProjectScene";
import { CinemaLightbox } from "../global";
import "./Portfolio.css";

export function Portfolio() {
  const [selectedCinemaProject, setSelectedCinemaProject] = useState<Project | null>(null);

  return (
    <section className="portfolio" id="portfolio">
      <div className="container portfolio__heading">
        <span className="eyebrow">05 — Selected Work</span>
        <h2>A few stories, cut to move.</h2>
      </div>
      {projects.map((project, i) => (
        <ProjectScene
          key={project.slug}
          project={project}
          index={i}
          onOpenCinema={(p) => setSelectedCinemaProject(p)}
        />
      ))}

      {/* Fullscreen Cinema Lightbox Theater with Audio & Scrub Controls */}
      <CinemaLightbox
        isOpen={!!selectedCinemaProject}
        project={selectedCinemaProject}
        onClose={() => setSelectedCinemaProject(null)}
      />
    </section>
  );
}
