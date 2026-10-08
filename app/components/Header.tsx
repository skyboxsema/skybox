import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import logo from '~/assets/logo.webp';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
}

type Viewport = 'desktop' | 'mobile';

export function Header({header, isLoggedIn, cart}: HeaderProps) {
  const {shop} = header;
  return (
    <>
      <p className="announcement">{ANNOUNCEMENT}</p>
      <header className="header">
        <div className="header-start">
          <HeaderMenuMobileToggle />
          <SearchToggle className="header-search-desktop" />
        </div>
        <NavLink className="header-brand" prefetch="intent" to="/" end>
          <img alt={shop.name} height={242} src={logo} width={900} />
        </NavLink>
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
        <HeaderMenu viewport="desktop" header={header} />
      </header>
    </>
  );
}

export function HeaderMenu({
  viewport,
  header,
}: {
  viewport: Viewport;
  header: HeaderQuery;
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();
  const menu = header.collections.nodes
    .filter((collection) => !HIDDEN_COLLECTIONS.includes(collection.handle))
    // hidden when the collection's "Show in menu" metafield is unticked;
    // collections without the field set stay visible
    .filter((collection) => collection.showInMenu?.value !== 'false')
    // ordered by the collection's "Menu order" metafield; collections without
    // one go last, A–Z (the query already sorts by title)
    .map((collection, index) => ({
      collection,
      order: Number(collection.menuOrder?.value ?? '') || 1000 + index,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({collection}) => ({
      title: collection.title,
      url: `/collections/${collection.handle}`,
    }));

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink end onClick={close} prefetch="intent" to="/">
          Home
        </NavLink>
      )}
      {menu.map((item) => (
        <NavLink
          className="header-menu-item"
          end
          key={item.url}
          onClick={close}
          prefetch="intent"
          to={item.url}
        >
          {item.title}
        </NavLink>
      ))}
      {viewport === 'mobile' && (
        <NavLink onClick={close} prefetch="intent" to="/account">
          Account
        </NavLink>
      )}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="header-ctas" role="navigation">
      <SearchToggle className="header-search-mobile" />
      <NavLink className="header-account" prefetch="intent" to="/account">
        <AccountIcon />
        <span className="sr-only">
          <Suspense fallback="Sign in">
            <Await resolve={isLoggedIn} errorElement="Sign in">
              {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
            </Await>
          </Suspense>
        </span>
      </NavLink>
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      aria-label="Menu"
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <MenuIcon />
    </button>
  );
}

function SearchToggle({className}: {className: string}) {
  const {open} = useAside();
  return (
    <button
      aria-label="Search"
      className={`reset ${className}`}
      onClick={() => open('search')}
    >
      <SearchIcon />
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      aria-label={`Cart, ${count} items`}
      className="header-cart"
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      <CartIcon />
      {count > 0 && <span className="header-cart-count">{count}</span>}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

function Icon({children}: {children: React.ReactNode}) {
  return (
    <svg
      aria-hidden="true"
      className="header-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function MenuIcon() {
  return (
    <Icon>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Icon>
  );
}

function SearchIcon() {
  return (
    <Icon>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </Icon>
  );
}

function AccountIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.500 8 6.500" />
    </Icon>
  );
}

function CartIcon() {
  return (
    <Icon>
      <path d="M2.500 4h3l2.300 11h10.400l2-7.500H6.600" />
      <circle cx="9" cy="19" r="1.300" />
      <circle cx="17" cy="19" r="1.300" />
    </Icon>
  );
}

// Text of the bar above the header
const ANNOUNCEMENT = 'Curated with care · Delivered to your door';

// The header menu lists every collection in the store, except these
// handles ('frontpage' is Shopify's built-in home page collection)
const HIDDEN_COLLECTIONS = ['frontpage'];
