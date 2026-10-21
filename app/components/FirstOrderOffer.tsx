import {CartForm} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {useRouteLoaderData, type FetcherWithComponents} from 'react-router';
import offerBanner from '~/assets/first-order-offer.webp';
import type {RootLoader} from '~/root';

export const FIRST_ORDER_CODE = 'FIRST20';

// Set when the visitor first closes the popup; from then on it only opens
// from the tab on the left edge of the screen
const CLOSED_KEY = 'first_order_offer_closed';

/**
 * First-order discount popup. Opens `delay` ms after a visitor's first page
 * load; once closed, a tab stuck to the left edge of the screen reopens it.
 */
export function FirstOrderOffer({delay = 4000}: {delay?: number}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // false until mounted, so the server render and hydration agree
  const [showTab, setShowTab] = useState(false);

  useEffect(() => {
    if (readClosed()) {
      setShowTab(true);
      return;
    }
    const timer = window.setTimeout(() => {
      // don't stack on top of another popup (e.g. the Build Your Box intro)
      if (document.querySelector('dialog[open]')) {
        setShowTab(true);
        return;
      }
      dialog.current?.showModal();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  const open = () => dialog.current?.showModal();
  const close = () => dialog.current?.close();

  return (
    <>
      {showTab && (
        <button
          aria-haspopup="dialog"
          className="offer-tab reset"
          onClick={open}
          type="button"
        >
          <span>20% off your first order</span>
        </button>
      )}

      <dialog
        aria-label="20% off your first order"
        className="offer-dialog"
        onClick={(event) => {
          // clicks on the backdrop land on the <dialog> element itself
          if (event.target === event.currentTarget) close();
        }}
        onClose={() => {
          writeClosed();
          setShowTab(true);
        }}
        ref={dialog}
      >
        <button
          aria-label="Close"
          className="offer-dialog-close reset"
          onClick={close}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <img
          alt={`Enjoy 20% off your first order with code ${FIRST_ORDER_CODE}`}
          className="offer-dialog-banner"
          height={861}
          src={offerBanner}
          width={627}
        />

        <div className="offer-dialog-actions">
          <CartForm
            action={CartForm.ACTIONS.DiscountCodesUpdate}
            inputs={{discountCode: FIRST_ORDER_CODE, discountCodes: []}}
            route="/cart"
          >
            {(fetcher) => <ApplyButton fetcher={fetcher} />}
          </CartForm>
          <CopyButton />
        </div>
      </dialog>
    </>
  );
}

function ApplyButton({fetcher}: {fetcher: FetcherWithComponents<any>}) {
  const cartHasCode = useCartHasCode();
  const applying = fetcher.state !== 'idle';
  // Shopify only marks the code "applicable" once the cart has items it
  // covers, so being on the cart at all counts as applied here. The root
  // loader reloads the cart after the apply, so this also flips back if the
  // code is later removed in the cart.
  const applied = !applying && cartHasCode;

  return (
    <button
      className="button offer-apply"
      disabled={applying || applied}
      type="submit"
    >
      {applying
        ? 'Applying…'
        : applied
          ? 'Applied ✓'
          : 'Apply code to my cart'}
    </button>
  );
}

/** Whether the visitor's current cart (from the root loader) has the code. */
function useCartHasCode() {
  const root = useRouteLoaderData<RootLoader>('root');
  const [cartHasCode, setCartHasCode] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.resolve(root?.cart)
      .then((cart) => current && setCartHasCode(hasCode(cart)))
      .catch(() => current && setCartHasCode(false));
    return () => {
      current = false;
    };
  }, [root?.cart]);

  return cartHasCode;
}

function hasCode(cart?: {discountCodes?: {code: string}[]} | null) {
  return Boolean(
    cart?.discountCodes?.some(
      (discount) => discount.code.toUpperCase() === FIRST_ORDER_CODE,
    ),
  );
}

function CopyButton() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard
      .writeText(FIRST_ORDER_CODE)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // clipboard blocked: the code is printed on the banner anyway
      });
  }

  return (
    <button className="offer-copy reset" onClick={copy} type="button">
      {copied ? 'Copied!' : `Copy code ${FIRST_ORDER_CODE}`}
    </button>
  );
}

function readClosed() {
  try {
    return window.localStorage.getItem(CLOSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeClosed() {
  try {
    window.localStorage.setItem(CLOSED_KEY, '1');
  } catch {
    // storage blocked: the tab still shows for the rest of this visit
  }
}
