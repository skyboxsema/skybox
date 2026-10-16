import {useAnalytics, type CartViewPayload} from '@shopify/hydrogen';
import {useAside} from './Aside';
import {WithCart} from './ProductQuickAdd';

/**
 * Phone-only bar pinned to the bottom of the Build Your Own Box page once the
 * box has something in it: shows how many items are in the cart and opens the
 * cart when tapped. On wider screens the cart opens beside the page instead.
 */
export function BuildBoxCartBar() {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <WithCart>
      {(optimisticCart) => {
        const count = optimisticCart?.totalQuantity ?? 0;
        if (!count) return null;
        return (
          <button
            aria-label={`View cart, ${count} items`}
            className="build-box-cart-bar"
            onClick={() => {
              open('cart');
              publish('cart_viewed', {
                cart,
                prevCart,
                shop,
                url: window.location.href || '',
              } as CartViewPayload);
            }}
            type="button"
          >
            <span className="build-box-cart-bar-count">
              <GiftIcon />
              <span>{count}</span>
            </span>
            <span>View cart</span>
            <ChevronIcon />
          </button>
        );
      }}
    </WithCart>
  );
}

function BarIcon({children}: {children: React.ReactNode}) {
  return (
    <svg
      aria-hidden="true"
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

function GiftIcon() {
  return (
    <BarIcon>
      <path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13" />
      <path d="M12 8C10.5 4 6.5 4 7 6.5 7.4 8 12 8 12 8zM12 8c1.5-4 5.5-4 5-1.5C16.6 8 12 8 12 8z" />
    </BarIcon>
  );
}

function ChevronIcon() {
  return (
    <BarIcon>
      <path d="m9 6 6 6-6 6" />
    </BarIcon>
  );
}
