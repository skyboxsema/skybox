import {NavLink} from 'react-router';
import type {HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  header: HeaderQuery;
}

export function Footer({header}: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-brand">{header.shop.name}</div>
      <FooterMenu />
      <div className="footer-contact">
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <MailIcon />
          {CONTACT_EMAIL}
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <InstagramIcon />
          Instagram
        </a>
      </div>
      <p className="footer-copyright">
        &copy; {new Date().getFullYear()} {header.shop.name}
      </p>
    </footer>
  );
}

function FooterMenu() {
  return (
    <nav className="footer-menu" role="navigation">
      {FOOTER_MENU.map((item) => (
        <NavLink end key={item.url} prefetch="intent" to={item.url}>
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="footer-icon">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="footer-icon">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

const CONTACT_EMAIL = 'contact@skyboxwithyou.com';
const INSTAGRAM_URL = 'https://www.instagram.com/skyboxwithyou/';

// The footer menu is defined here instead of in the Shopify admin
const FOOTER_MENU = [
  {title: 'Contact', url: '/contact'},
  {title: 'Policies', url: '/policies'},
  {title: 'Your privacy choices', url: '/pages/data-sharing-opt-out'},
];
