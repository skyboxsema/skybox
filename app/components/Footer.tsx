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
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
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

const CONTACT_EMAIL = 'contact@skyboxwithyou.com';
const INSTAGRAM_URL = 'https://www.instagram.com/skyboxwithyou/';

// The footer menu is defined here instead of in the Shopify admin
const FOOTER_MENU = [
  {title: 'Contact', url: '/contact'},
  {title: 'Policies', url: '/policies'},
  {title: 'Your privacy choices', url: '/pages/data-sharing-opt-out'},
];
