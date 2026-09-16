import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { contactLinks } from "../../data/content";
import "./Contact.css";

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      ".contact-link",
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="contact" id="contact">
      <div className="container">
        <span className="eyebrow">12 — Contact</span>
        <ul className="contact__list">
          {contactLinks.map((link) => (
            <li key={link.label} className="contact-link">
              <a href={link.href} target="_blank" rel="noreferrer" data-cursor="view">
                <span className="contact-link__label">{link.label}</span>
                <span className="contact-link__value">{link.value}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
