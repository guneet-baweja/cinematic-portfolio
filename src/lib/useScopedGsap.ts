import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "./gsap";

/**
 * Runs `callback` inside a gsap.context() scoped to `scopeRef`, reverting
 * every tween/ScrollTrigger it created on unmount or dependency change.
 * Keeps each section's animations self-contained and leak-free.
 */
export function useScopedGsap(
  scopeRef: RefObject<HTMLElement | null>,
  callback: (context: gsap.Context) => void,
  deps: unknown[] = []
) {
  useLayoutEffect(() => {
    if (!scopeRef.current) return;
    const ctx = gsap.context((self) => callback(self), scopeRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
