import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useId, useRef} from 'react';
import {Link, type FetcherWithComponents} from 'react-router';
import {useAside} from '~/components/Aside';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();

  return (
    <div aria-labelledby={summaryId} className={className}>
      <h4 id={summaryId}>Totals</h4>
      <dl role="group" className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      <CartDiscountSavings cart={cart} />
      <CartDiscounts discountCodes={cart?.discountCodes} />
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  const {close} = useAside();
  if (!checkoutUrl) return null;

  // Customers can leave a note per item on /cart/notes before checkout
  return (
    <div>
      <Link className="button cart-checkout" to="/cart/notes" onClick={close}>
        Continue to Checkout &rarr;
      </Link>
      <br />
    </div>
  );
}

type CartDiscountCodes = CartApiQueryFragment['discountCodes'];

function CartDiscountSavings({
  cart,
}: {
  cart: OptimisticCart<CartApiQueryFragment | null>;
}) {
  const allocations = cart?.discountAllocations ?? [];
  if (!allocations.length) return null;

  const amount = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.discountedAmount.amount),
    0,
  );
  if (!amount) return null;

  return (
    <dl className="cart-discount-savings">
      <dt>Discount</dt>
      <dd>
        &minus;
        <Money
          data={{
            amount: amount.toString(),
            currencyCode: allocations[0].discountedAmount.currencyCode,
          }}
        />
      </dd>
    </dl>
  );
}

function CartDiscounts({discountCodes}: {discountCodes?: CartDiscountCodes}) {
  const inputId = useId();
  const codes = discountCodes?.map(({code}) => code) ?? [];

  return (
    <div className="cart-discounts">
      {discountCodes?.map((discount) => (
        <div className="cart-discount-applied" key={discount.code}>
          <div>
            <span className="cart-discount-code">{discount.code}</span>
            {!discount.applicable && (
              <p className="cart-discount-error" role="alert">
                This code isn&rsquo;t valid for the items in your cart.
              </p>
            )}
          </div>
          <CartForm
            action={CartForm.ACTIONS.DiscountCodesUpdate}
            inputs={{
              discountCodes: codes.filter((code) => code !== discount.code),
            }}
            route="/cart"
          >
            <button
              aria-label={`Remove discount ${discount.code}`}
              className="cart-discount-remove reset"
              type="submit"
            >
              Remove
            </button>
          </CartForm>
        </div>
      ))}

      <CartForm
        action={CartForm.ACTIONS.DiscountCodesUpdate}
        inputs={{discountCodes: codes}}
        route="/cart"
      >
        {(fetcher) => <DiscountCodeField fetcher={fetcher} inputId={inputId} />}
      </CartForm>
    </div>
  );
}

function DiscountCodeField({
  fetcher,
  inputId,
}: {
  fetcher: FetcherWithComponents<any>;
  inputId: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const applying = fetcher.state !== 'idle';

  // clear the field once the code has been sent to the cart
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && input.current) {
      input.current.value = '';
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="cart-discount-form">
      <label className="sr-only" htmlFor={inputId}>
        Discount code
      </label>
      <input
        autoCapitalize="characters"
        autoComplete="off"
        id={inputId}
        name="discountCode"
        placeholder="Discount code"
        ref={input}
        required
        type="text"
      />
      <button className="button" disabled={applying} type="submit">
        {applying ? 'Applying…' : 'Apply'}
      </button>
    </div>
  );
}
