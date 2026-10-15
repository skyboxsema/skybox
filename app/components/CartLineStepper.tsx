import {CartForm} from '@shopify/hydrogen';
import {getUpdateKey, type CartLine} from './CartLineItem';

/**
 * − / quantity / + controls for a line already in the cart. At quantity 1 the
 * minus becomes a remove (trash) button. `label` renders the quantity text.
 */
export function CartLineStepper({
  className = 'product-quantity',
  label = (quantity) => `${quantity} in cart`,
  line,
}: {
  className?: string;
  label?: (quantity: number) => React.ReactNode;
  line: CartLine;
}) {
  const {id: lineId, quantity, isOptimistic} = line;
  const disabled = !!isOptimistic;

  return (
    <div className={className}>
      {quantity <= 1 ? (
        <CartForm
          fetcherKey={getUpdateKey([lineId])}
          route="/cart"
          action={CartForm.ACTIONS.LinesRemove}
          inputs={{lineIds: [lineId]}}
        >
          <button
            aria-label="Remove from cart"
            className="product-quantity-button"
            disabled={disabled}
            type="submit"
          >
            <TrashIcon />
          </button>
        </CartForm>
      ) : (
        <CartForm
          fetcherKey={getUpdateKey([lineId])}
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{lines: [{id: lineId, quantity: quantity - 1}]}}
        >
          <button
            aria-label="Decrease quantity"
            className="product-quantity-button"
            disabled={disabled}
            type="submit"
          >
            &#8722;
          </button>
        </CartForm>
      )}
      <span className="product-quantity-value" aria-live="polite">
        {label(quantity)}
      </span>
      <CartForm
        fetcherKey={getUpdateKey([lineId])}
        route="/cart"
        action={CartForm.ACTIONS.LinesUpdate}
        inputs={{lines: [{id: lineId, quantity: quantity + 1}]}}
      >
        <button
          aria-label="Increase quantity"
          className="product-quantity-button"
          disabled={disabled}
          type="submit"
        >
          &#43;
        </button>
      </CartForm>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}
