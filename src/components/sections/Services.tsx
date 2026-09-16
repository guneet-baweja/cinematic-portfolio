import { useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useScopedGsap } from "../../lib/useScopedGsap";
import { services } from "../../data/content";
import "./Services.css";

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useScopedGsap(sectionRef, () => {
    gsap.fromTo(
      ".service-row",
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.06,
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
      }
    );
  }, []);

  const handleEnter = (index: number) => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>(".service-row");
    if (!rows) return;
    rows.forEach((row, i) => {
      const isHovered = i === index;
      gsap.to(row, {
        opacity: isHovered ? 1 : 0.3,
        duration: 0.35,
        ease: "power2.out",
      });
      const note = row.querySelector<HTMLElement>(".service-row__note");
      if (note) {
        gsap.to(note, {
          autoAlpha: isHovered ? 1 : 0,
          x: isHovered ? 0 : 20,
          duration: 0.35,
          ease: "power3.out",
        });
      }
      const label = row.querySelector<HTMLElement>(".service-row__label");
      if (label) {
        gsap.to(label, {
          color: "#ffffff",
          duration: 0.2,
        });
      }
    });
  };

  const handleLeave = () => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>(".service-row");
    rows?.forEach((row) => {
      gsap.to(row, { opacity: 1, duration: 0.35, ease: "power2.out" });
      const note = row.querySelector<HTMLElement>(".service-row__note");
      if (note) {
        gsap.to(note, { autoAlpha: 0, x: 20, duration: 0.25, ease: "power2.in" });
      }
      const label = row.querySelector<HTMLElement>(".service-row__label");
      if (label) {
        gsap.to(label, { color: "#ffffff", duration: 0.2 });
      }
    });
  };

  return (
    <section ref={sectionRef} className="services" id="services">
      <div className="container">
        <span className="eyebrow">09 — Services</span>
        <ul ref={listRef} className="services__list" onMouseLeave={handleLeave}>
          {services.map((service, i) => (
            <li
              key={service.label}
              className="service-row"
              onMouseEnter={() => handleEnter(i)}
              data-cursor="view"
            >
              <span className="service-row__index">{String(i + 1).padStart(2, "0")}</span>
              <span className="service-row__label">{service.label}</span>
              <span className="service-row__note">{service.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
