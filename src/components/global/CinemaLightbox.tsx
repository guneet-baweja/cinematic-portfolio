import { useEffect, useRef, useState, useCallback } from "react";
import type { Project } from "../../types/project";
import { getLenis } from "../../lib/lenis";
import "./CinemaLightbox.css";

interface CinemaLightboxProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

export function CinemaLightbox({ isOpen, project, onClose }: CinemaLightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimeoutRef = useRef<number | null>(null);

  // Lock Lenis smooth scroll and body overflow when open
  useEffect(() => {
    const lenis = getLenis();
    if (isOpen) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Synchronize audio and video on mount/project change
  useEffect(() => {
    if (!isOpen || !project) return;
    const v = videoRef.current;
    if (!v) return;

    v.currentTime = 0;
    v.muted = isMuted;
    v.volume = volume;

    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If browser blocks unmuted autoplay, mute and try again
          v.muted = true;
          setIsMuted(true);
          v.play().catch(() => {});
        });
    }
  }, [isOpen, project]);

  // Handle Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Time format helper (MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const next = !isMuted;
    v.muted = next;
    setIsMuted(next);
    if (!next && volume === 0) {
      v.volume = 0.5;
      setVolume(0.5);
    }
  }, [isMuted, volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const nextVol = Math.min(1, volume + 0.1);
        setVolume(nextVol);
        if (videoRef.current) {
          videoRef.current.volume = nextVol;
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextVol = Math.max(0, volume - 0.1);
        setVolume(nextVol);
        if (videoRef.current) {
          videoRef.current.volume = nextVol;
          if (nextVol === 0) {
            videoRef.current.muted = true;
            setIsMuted(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, togglePlay, toggleMute, toggleFullscreen, volume, duration]);

  // Idle autohide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  if (!isOpen || !project) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`cinema-lightbox ${showControls ? "show-controls" : "hide-controls"}`}
      onMouseMove={handleMouseMove}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} Cinema Player`}
    >
      {/* Immersive Dark Blurred Backdrop */}
      <div className="cinema-lightbox__backdrop" onClick={onClose} />

      {/* Main Cinema Theater Stage */}
      <div className="cinema-lightbox__stage">
        {/* Top Header HUD */}
        <header className="cinema-lightbox__header">
          <div className="cinema-lightbox__branding">
            <span className="cinema-lightbox__badge">CINEMA THEATER // MASTER CUT</span>
            <span className="cinema-lightbox__meta-tag">
              {project.category} • {project.year} • {project.client}
            </span>
            <h2 className="cinema-lightbox__title">{project.title}</h2>
          </div>

          <div className="cinema-lightbox__top-actions">
            <button
              type="button"
              className="cinema-lightbox__btn cinema-lightbox__fullscreen-top-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? "🗗 EXIT FULLSCREEN" : "⛶ FULLSCREEN"}
            </button>
            <button
              type="button"
              className="cinema-lightbox__close-btn"
              onClick={onClose}
              aria-label="Close Cinema Player (ESC)"
            >
              ✕ CLOSE [ESC]
            </button>
          </div>
        </header>

        {/* Video Canvas Box */}
        <div className="cinema-lightbox__viewport" onClick={togglePlay}>
          <video
            ref={videoRef}
            src={project.video}
            poster={project.poster}
            playsInline
            loop
            className="cinema-lightbox__video"
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Large Center Play State Animation */}
          {!isPlaying && (
            <div className="cinema-lightbox__play-badge">
              <span className="cinema-lightbox__play-icon">▶</span>
              <span className="cinema-lightbox__play-label">CLICK OR PRESS SPACE TO RESUME</span>
            </div>
          )}
        </div>

        {/* Bottom Cinema Controls Bar */}
        <div className="cinema-lightbox__controls" onClick={(e) => e.stopPropagation()}>
          {/* Seek Progress Bar */}
          <div
            ref={progressBarRef}
            className="cinema-lightbox__progress-container"
            onClick={handleSeek}
          >
            <div className="cinema-lightbox__progress-track">
              <div
                className="cinema-lightbox__progress-fill"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="cinema-lightbox__progress-handle" />
              </div>
            </div>
          </div>

          {/* Control Buttons Row */}
          <div className="cinema-lightbox__controls-row">
            {/* Left Controls: Play/Pause, Mute, Volume, Time */}
            <div className="cinema-lightbox__controls-left">
              <button
                type="button"
                className="cinema-lightbox__control-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}
              </button>

              <div className="cinema-lightbox__volume-group">
                <button
                  type="button"
                  className="cinema-lightbox__control-btn cinema-lightbox__mute-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted || volume === 0 ? "🔇 MUTED" : "🔊 AUDIO"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="cinema-lightbox__volume-slider"
                  aria-label="Volume Slider"
                />
                <span className="cinema-lightbox__volume-val">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              <div className="cinema-lightbox__time-readout">
                <span>{formatTime(currentTime)}</span>
                <span className="cinema-lightbox__time-sep">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Tags & Fullscreen */}
            <div className="cinema-lightbox__controls-right">
              <div className="cinema-lightbox__tags">
                <span className="cinema-lightbox__role-pill">ROLE: {project.role}</span>
                {project.software.slice(0, 3).map((sw) => (
                  <span key={sw} className="cinema-lightbox__tech-pill">
                    {sw}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="cinema-lightbox__control-btn cinema-lightbox__fs-btn"
                onClick={toggleFullscreen}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? "🗗 EXIT" : "⛶ FULLSCREEN"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
