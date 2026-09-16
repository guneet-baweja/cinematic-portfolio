import { useEffect, useState } from "react";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on touch or small-viewport devices (< 768px) — used to scale back 3D + pin density. */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px), (pointer: coarse)");
}

/** Synchronous check for mobile screen width (< 768px) */
export function isMobileScreen(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}
