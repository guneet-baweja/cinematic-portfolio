import { useLayoutEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import "./MobileMenu.css";

interface Link {
  label: string;
  href: string;
}

export function MobileMenu({ open, onClose, links }: { open: boolean; onClose: () => void; links: Link[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const items = el.querySelectorAll(".mobile-menu__link");

    if (open) {
      gsap.set(el, { display: "flex" });
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(
        items,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.7, stagger: 0.06, ease: "power4.out", delay: 0.1 }
      );
    } else {
      gsap.to(el, {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => gsap.set(el, { display: "none" }),
      });
    }
  }, [open]);

  return (
    <div ref={rootRef} className="mobile-menu" style={{ display: "none" }}>
      <button className="mobile-menu__close" onClick={onClose} aria-label="Close menu">
        Close
      </button>
      <ul>
        {links.map((link) => (
          <li key={link.href} className="mobile-menu__item">
            <a href={link.href} className="mobile-menu__link" onClick={onClose}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
