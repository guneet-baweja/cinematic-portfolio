import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import "./CustomCursor.css";

/**
 * CustomCursor (Phase 8: Custom Cursor & Magnetic Zones)
 * -------------------------------------------------------
 * High-end tactile cursor built strictly with GSAP quickTo:
 * - Zero-latency trailing dot (z-index: 9999, mix-blend-mode: difference).
 * - Bounding box math for elements with [data-cursor-magnetic].
 * - Magnetic attraction to button centers with scale: 3 locked state.
 * - Instant release and smooth return to tracking on mouseleave.
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only mount custom cursor on fine pointer devices (desktops/laptops with mouse/trackpad)
    const isFine = window.matchMedia("(pointer: fine)").matches;
    if (!isFine) return;

    document.body.classList.add("has-custom-cursor");

    const cursor = cursorRef.current;
    if (!cursor) return;

    // Centering offset with GSAP transforms so scale/position works flawlessly
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    // 1. Zero-Latency GSAP quickTo X and Y Setters
    const moveX = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });

    let activeMagneticEl: HTMLElement | null = null;

    // 2. Mouse Movement & Magnetic Trajectory Math
    const handleMouseMove = (e: MouseEvent) => {
      if (activeMagneticEl) {
        // Calculate center of the magnetic bounding box
        const rect = activeMagneticEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Subtle elastic pull towards center (75% magnetic snap, 25% pointer follow)
        const magnetPull = 0.25;
        const targetX = centerX + (e.clientX - centerX) * magnetPull;
        const targetY = centerY + (e.clientY - centerY) * magnetPull;

        moveX(targetX);
        moveY(targetY);
      } else {
        moveX(e.clientX);
        moveY(e.clientY);
      }
    };

    // 3. Magnetic Hover Detection (Enter & Lock)
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor-magnetic]") as HTMLElement | null;

      if (target && target !== activeMagneticEl) {
        activeMagneticEl = target;
        cursor.classList.add("is-magnetic-locked");

        // Calculate center of the button
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Animate cursor dot towards exact center of the button (magnetic pull)
        moveX(centerX);
        moveY(centerY);

        // Simultaneously scale cursor dot up (scale: 3) to indicate locked state
        gsap.to(cursor, {
          scale: 3,
          duration: 0.25,
          ease: "back.out(2)",
          overwrite: "auto",
        });
      }
    };

    // 4. Magnetic Release on Mouseout / Mouseleave
    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor-magnetic]") as HTMLElement | null;

      if (target && target === activeMagneticEl) {
        const related = e.relatedTarget as HTMLElement | null;
        if (related && target.contains(related)) {
          return; // Still inside child elements of the button
        }

        activeMagneticEl = null;
        cursor.classList.remove("is-magnetic-locked");

        // Release magnetic scale back to default 1.0
        gsap.to(cursor, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });

        // Instantly resume standard tracking
        moveX(e.clientX);
        moveY(e.clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <div ref={cursorRef} className="custom-cursor" aria-hidden>
      <div ref={dotRef} className="custom-cursor__dot" />
      <span className="custom-cursor__badge">SNAP</span>
    </div>
  );
}
