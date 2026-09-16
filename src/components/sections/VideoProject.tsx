import { useEffect, useRef, useState, useCallback } from "react";
import "./VideoProject.css";

interface VideoProjectProps {
  src: string;
  poster: string;
  title?: string;
  className?: string;
  /** load the <source> only once the element is near the viewport */
  rootMargin?: string;
  onOpenCinema?: () => void;
}

/**
 * Renders a poster image immediately; swaps in a real <video> source only
 * once the element is close to the viewport (lazy load), then plays/pauses
 * automatically based on actual visibility so we never run dozens of
 * decoders at once.
 *
 * Provides interactive sound controls (unmute/mute), play/pause,
 * and Cinema Fullscreen Theater trigger.
 */
export function VideoProject({
  src,
  poster,
  title,
  className = "",
  rootMargin = "600px",
  onOpenCinema,
}: VideoProjectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Lazy-load: attach the real <source> only once nearby.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Play/pause based on real visibility — never autoplay off-screen video.
  useEffect(() => {
    const el = wrapperRef.current;
    const video = videoRef.current;
    if (!el || !video || !shouldLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0].isIntersecting && entries[0].intersectionRatio > 0.35;
        if (visible) {
          video.play().catch(() => {
            /* autoplay can be blocked before user interaction — safe to ignore */
          });
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.35, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const toggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
    if (!next) {
      video.volume = 0.9;
    }
  }, [isMuted]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // If onOpenCinema is provided, open cinema mode
    if (onOpenCinema) {
      e.preventDefault();
      onOpenCinema();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`video-project ${ready ? "is-ready" : ""} ${className}`}
      onClick={handleCardClick}
      role={onOpenCinema ? "button" : undefined}
      tabIndex={onOpenCinema ? 0 : undefined}
      aria-label={title ? `Watch ${title} in Cinema View` : "Watch Video in Cinema View"}
    >
      <img src={poster} alt="" className="video-project__poster" aria-hidden />
      {shouldLoad && (
        <video
          ref={videoRef}
          className="video-project__video"
          poster={poster}
          muted={isMuted}
          loop
          playsInline
          preload="none"
          onLoadedData={() => setReady(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {/* Cybernetic Interactive Controls Overlay */}
      <div className="video-project__overlay">
        {/* Top Floating Badges */}
        <div className="video-project__top-bar">
          <span className="video-project__cinema-badge">
            <span className="video-project__pulse-dot" />
            4K 60FPS MASTER
          </span>

          <button
            type="button"
            className={`video-project__audio-btn ${!isMuted ? "is-unmuted" : ""}`}
            onClick={toggleSound}
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? (
              <>
                <span className="video-project__btn-icon">🔇</span>
                <span className="video-project__btn-text">UNMUTE</span>
              </>
            ) : (
              <>
                <span className="video-project__btn-icon">🔊</span>
                <span className="video-project__btn-text">SOUND ON</span>
              </>
            )}
          </button>
        </div>

        {/* Center Hover Action */}
        <div className="video-project__center-action">
          <div className="video-project__expand-pill">
            <span className="video-project__expand-icon">⛶</span>
            <span className="video-project__expand-text">CLICK FOR FULL CINEMA VIEW</span>
          </div>
        </div>

        {/* Bottom Bar: Play/Pause Toggle */}
        <div className="video-project__bottom-bar">
          <button
            type="button"
            className="video-project__play-toggle"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause Video" : "Play Video"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
