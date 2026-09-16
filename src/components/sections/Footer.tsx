import { contactLinks } from "../../data/content";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__mark">N. Editor</div>
        <ul className="footer__socials">
          {contactLinks.slice(1).map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noreferrer" data-cursor="view">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="footer__meta">
          <span>© {year} — Video Editor &amp; Motion Designer</span>
          <span>Built as a portfolio piece in itself.</span>
        </div>
      </div>
    </footer>
  );
}
