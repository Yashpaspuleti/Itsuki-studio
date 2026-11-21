import { Instagram, Youtube } from "lucide-react";
import iconURL from "../../public/images/itsuki-studio-is-icon.svg";

export function Footer() {
  return (
    <footer id="contact" className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="brand" href="#home" aria-label="Itsuki Studio home">
              <img
                className="brand-mark"
                src={iconURL}
                alt=""
                aria-hidden="true"
              />
              <span>Itsuki Studio</span>
            </a>
            <p>Crafted light for quiet spaces.</p>
          </div>

          <nav className="footer-nav" aria-label="Footer navigation">
            <p className="footer-heading">Explore</p>
            <div className="footer-nav-links">
              <a href="#collection">Shop</a>
              <a href="#story">About</a>
              <a href="#journal">Journal</a>
              <a href="mailto:hello@itsukistudio.in">Contact</a>
            </div>
          </nav>

          <div className="social-links" aria-label="Social media">
            <p className="footer-heading">Follow</p>
            <div className="social-links-row">
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="social-link"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram />
              </a>
              <a
                href="https://youtube.com"
                aria-label="YouTube"
                className="social-link"
                target="_blank"
                rel="noreferrer"
              >
                <Youtube />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Itsuki Studio. All rights reserved.
          </p>
          <p>Light. Design. You.</p>
        </div>
      </div>
    </footer>
  );
}
