import { useEffect, useRef, useState } from "react";
import "./VideoProject.css";

interface VideoProjectProps {
  src: string;
  poster: string;
  className?: string;
  /** load the <source> only once the element is near the viewport */
  rootMargin?: string;
}

/**
 * Renders a poster image immediately; swaps in a real <video> source only
 * once the element is close to the viewport (lazy load), then plays/pauses
 * automatically based on actual visibility so we never run dozens of
 * decoders at once.
 */
export function VideoProject({ src, poster, className = "", rootMargin = "600px" }: VideoProjectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);

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
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.35, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={wrapperRef} className={`video-project ${ready ? "is-ready" : ""} ${className}`}>
      <img src={poster} alt="" className="video-project__poster" aria-hidden />
      {shouldLoad && (
        <video
          ref={videoRef}
          className="video-project__video"
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          onLoadedData={() => setReady(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
