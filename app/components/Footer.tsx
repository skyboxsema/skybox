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

// The footer menu is defined here instead of in the Shopify admin
const FOOTER_MENU = [
  {title: 'Search', url: '/search'},
  {title: 'Contact', url: '/pages/contact'},
  {title: 'Policies', url: '/policies'},
  {title: 'Your privacy choices', url: '/pages/data-sharing-opt-out'},
];
