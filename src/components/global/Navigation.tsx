import { useRef, useState } from "react";
import { ScrollTrigger } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { MobileMenu } from "./MobileMenu";
import "./Navigation.css";

const LINKS = [
  { label: "Work", href: "#portfolio" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useScopedGsap(navRef, () => {
    ScrollTrigger.create({
      start: "top -80",
      onUpdate: (self) => {
        navRef.current?.classList.toggle("is-compact", self.scroll() > 80);
      },
    });
  }, []);

  return (
    <>
      <nav ref={navRef} className="nav">
        <a href="#top" className="nav__mark" data-cursor="view">
          N.<span>Editor</span>
        </a>
        <ul className="nav__links">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} data-cursor="view">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="nav__toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </nav>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={LINKS} />
    </>
  );
}
