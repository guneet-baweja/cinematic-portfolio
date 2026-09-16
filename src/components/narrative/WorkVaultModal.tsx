import { useState, useRef, useEffect } from "react";
import { projects, beforeAfterExample } from "../../data/projects";
import type { Project } from "../../types/project";
import { getLenis } from "../../lib/lenis";
import "./WorkVaultModal.css";

export function WorkVaultModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0]);
  const [filter, setFilter] = useState<string>("ALL");
  const [sliderPos, setSliderPos] = useState(50);
  const [activeTab, setActiveTab] = useState<"projects" | "comparison">("projects");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lock background Lenis scroll and body overflow while modal is open
  useEffect(() => {
    const l = getLenis();
    if (isOpen) {
      l?.stop();
      document.body.style.overflow = "hidden";
    } else {
      l?.start();
      document.body.style.overflow = "";
    }
    return () => {
      l?.start();
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Restart video playback when project selection changes
  useEffect(() => {
    if (videoRef.current && selectedProject) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [selectedProject]);

  if (!isOpen) return null;

  const categories = ["ALL", "SAAS", "REAL ESTATE", "CINEMATIC", "MOTION"];
  const filteredProjects =
    filter === "ALL"
      ? projects
      : projects.filter((p) => p.category.toUpperCase() === filter);

  return (
    <div className="work-vault-modal" role="dialog" aria-modal="true">
      <div className="work-vault-modal__backdrop" onClick={onClose} />

      <div className="work-vault-modal__dialog">
        {/* Modal Header */}
        <header className="work-vault-modal__header">
          <div className="work-vault-modal__header-left">
            <span className="work-vault-modal__badge">THE WORK ARCHIVE</span>
            <h2 className="work-vault-modal__title">MASTERED TIMELINES</h2>
          </div>

          <div className="work-vault-modal__header-nav">
            <button
              type="button"
              className={`work-vault-modal__tab-btn ${activeTab === "projects" ? "is-active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              SELECTED FILMS [9]
            </button>
            <button
              type="button"
              className={`work-vault-modal__tab-btn ${activeTab === "comparison" ? "is-active" : ""}`}
              onClick={() => setActiveTab("comparison")}
            >
              BEFORE / AFTER BREAKDOWN
            </button>
          </div>

          <button
            type="button"
            className="work-vault-modal__close-btn"
            onClick={onClose}
            aria-label="Close Work Vault"
          >
            ✕ CLOSE [ESC]
          </button>
        </header>

        {/* Tab 1: 9 Selected Projects & Cinema Player */}
        {activeTab === "projects" && (
          <div className="work-vault-modal__body">
            {/* Left: Main Cinema Screen Player */}
            <div className="work-vault-modal__player-col">
              {selectedProject && (
                <div className="work-vault-modal__screen">
                  <video
                    ref={videoRef}
                    key={selectedProject.video}
                    src={selectedProject.video}
                    poster={selectedProject.poster}
                    controls
                    autoPlay
                    playsInline
                    className="work-vault-modal__video"
                  />

                  <div className="work-vault-modal__meta">
                    <div className="work-vault-modal__meta-header">
                      <div>
                        <span className="work-vault-modal__category">
                          {selectedProject.category} / {selectedProject.year}
                        </span>
                        <h3 className="work-vault-modal__project-title">
                          {selectedProject.title}
                        </h3>
                      </div>
                      <span className="work-vault-modal__client">
                        CLIENT: {selectedProject.client}
                      </span>
                    </div>

                    <p className="work-vault-modal__desc">
                      {selectedProject.description}
                    </p>

                    <div className="work-vault-modal__tags">
                      <span className="work-vault-modal__role">
                        ROLE: {selectedProject.role}
                      </span>
                      {selectedProject.software.map((sw) => (
                        <span key={sw} className="work-vault-modal__tag">
                          {sw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Project Selection Reel */}
            <div className="work-vault-modal__reel-col">
              {/* Category Filter Pills */}
              <div className="work-vault-modal__filters">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`work-vault-modal__filter-pill ${filter === c ? "is-active" : ""}`}
                    onClick={() => setFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Scrollable list of projects */}
              <div className="work-vault-modal__grid">
                {filteredProjects.map((proj) => {
                  const isSelected = selectedProject?.slug === proj.slug;
                  return (
                    <article
                      key={proj.slug}
                      className={`work-vault-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedProject(proj)}
                    >
                      <div className="work-vault-card__thumb-wrap">
                        <img
                          src={proj.poster}
                          alt={proj.title}
                          className="work-vault-card__thumb"
                          loading="lazy"
                        />
                        <div className="work-vault-card__overlay">
                          <span className="work-vault-card__play">▶ PLAY</span>
                        </div>
                      </div>
                      <div className="work-vault-card__info">
                        <span className="work-vault-card__cat">{proj.category}</span>
                        <h4 className="work-vault-card__title">{proj.title}</h4>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Before / After Breakdown */}
        {activeTab === "comparison" && (
          <div className="work-vault-modal__body work-vault-modal__body--comparison">
            <div className="work-vault-comparison">
              <div className="work-vault-comparison__viewer">
                {/* Raw Capture (Left) */}
                <video
                  src={beforeAfterExample.rawVideo}
                  poster={beforeAfterExample.rawPoster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="work-vault-comparison__video"
                />

                {/* Delivered Grade (Right Clip) */}
                <div
                  className="work-vault-comparison__clipped"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <video
                    src={beforeAfterExample.finalVideo}
                    poster={beforeAfterExample.finalPoster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="work-vault-comparison__video"
                  />
                </div>

                {/* Slider divider bar */}
                <div
                  className="work-vault-comparison__divider"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="work-vault-comparison__handle">
                    <span>◄ ►</span>
                  </div>
                </div>

                {/* Slider range input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="work-vault-comparison__input"
                  aria-label="Before / After split position"
                />

                <span className="work-vault-comparison__badge work-vault-comparison__badge--left">
                  RAW CAPTURE
                </span>
                <span className="work-vault-comparison__badge work-vault-comparison__badge--right">
                  FINAL GRADE & PACING
                </span>
              </div>

              <div className="work-vault-comparison__meta">
                <h3>{beforeAfterExample.title}</h3>
                <p>{beforeAfterExample.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
