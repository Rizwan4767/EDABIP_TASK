import { Link } from 'react-router-dom';
import './AppFooter.css';

const APP_VERSION = 'v2.1.0';

function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p className="app-footer__copy">
        © {year} EDABIP. All rights reserved. Enterprise Data Analytics & Business Intelligence
        Platform
      </p>
      <div className="app-footer__meta">
        <nav className="app-footer__links" aria-label="Legal and support">
          <a href="#!">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="#!">Terms</a>
          <span aria-hidden="true">·</span>
          <Link to="/contact-support">Help & Support</Link>
        </nav>
        <span className="app-footer__version">{APP_VERSION}</span>
      </div>
    </footer>
  );
}

export default AppFooter;
