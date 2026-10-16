import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';
import {useId} from 'react';
import {Link} from 'react-router';
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
