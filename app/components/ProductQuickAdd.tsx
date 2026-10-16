import {Suspense} from 'react';
import {Await, useRouteLoaderData} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {
  CartApiQueryFragment,
  ProductItemFragment,
  QuickAddProductFragment,
} from 'storefrontapi.generated';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {CartLineStepper} from './CartLineStepper';
import type {RootLoader} from '~/root';

export type QuickAddProduct = ProductItemFragment & QuickAddProductFragment;
export type QuickAddVariant = QuickAddProductFragment['variants']['nodes'][0];

/**
 * Add button over a product card on the Build Your Own Box page. A product
 * with a single variant goes straight into the cart and the button becomes a
 * 🗑/− quantity + stepper; a product with options opens the quick view
 * (`onChooseOptions`) so the customer can pick one first.
 */
export function ProductQuickAdd({
  onChooseOptions,
  product,
}: {
  onChooseOptions: () => void;
  product: QuickAddProduct;
}) {
  const variants = product.variants.nodes;
  if (!variants.length) return null;

  return (
    <WithCart>
      {(cart) => {
        if (variants.length > 1) {
          const inCart = cartQuantity(cart, variants);
          return (
            <div
              className="product-item-quick"
              data-in-cart={inCart ? '' : undefined}
            >
              <button
                className="button"
                onClick={onChooseOptions}
                type="button"
              >
                {inCart ? `✓ ${inCart} in cart` : '+ Add'}
              </button>
            </div>
          );
        }
        const line = findLine(cart, variants[0]);
        return (
          <div
            className="product-item-quick"
            data-in-cart={line ? '' : undefined}
          >
            <VariantCartControls
              cart={cart}
              label={(quantity) => quantity}
              stepperClassName="product-quantity product-item-quick-stepper"
              variant={variants[0]}
            />
          </div>
        );
      }}
    </WithCart>
  );
}

/**
 * "Add" until the variant is in the cart, then a 🗑/− quantity + stepper;
 * "Sold out" when it can't be bought
 */
export function VariantCartControls({
  addLabel = '+ Add',
  cart,
  label,
  stepperClassName,
  variant,
}: {
  addLabel?: string;
  cart: Cart;
  label?: (quantity: number) => React.ReactNode;
  stepperClassName?: string;
  variant: QuickAddVariant;
}) {
  const {open} = useAside();
  const line = findLine(cart, variant);
  if (line) {
    return (
      <CartLineStepper className={stepperClassName} label={label} line={line} />
    );
  }
  if (!variant.availableForSale) {
    return (
      <AddToCartButton disabled lines={[]}>
        Sold out
      </AddToCartButton>
    );
  }
  return (
    <AddToCartButton
      lines={[
        {merchandiseId: variant.id, quantity: 1, selectedVariant: variant},
      ]}
      // the cart stays open beside the page while the box is being built; on
      // phones there's no room, so the bottom bar (BuildBoxCartBar) opens it
      onClick={() => {
        if (window.matchMedia('(min-width: 45em)').matches) {
          open('cart', {docked: true});
        }
      }}
    >
      {addLabel}
    </AddToCartButton>
  );
}

type Cart = ReturnType<typeof useOptimisticCart<CartApiQueryFragment | null>>;

/**
 * Renders `children` with the cart, kept optimistic so controls update as
 * soon as a button is clicked (before Shopify confirms)
 */
export function WithCart({
  children,
}: {
  children: (cart: Cart) => React.ReactNode;
}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const render = (cart: CartApiQueryFragment | null) => (
    <OptimisticCart cart={cart}>{children}</OptimisticCart>
  );
  return (
    <Suspense fallback={render(null)}>
      <Await resolve={rootData?.cart} errorElement={render(null)}>
        {(cart) => render(cart ?? null)}
      </Await>
    </Suspense>
  );
}

function OptimisticCart({
  cart,
  children,
}: {
  cart: CartApiQueryFragment | null;
  children: (cart: Cart) => React.ReactNode;
}) {
  return children(useOptimisticCart(cart));
}

export function findLine(cart: Cart, variant: {id: string}) {
  return cart?.lines?.nodes?.find((line) => line.merchandise.id === variant.id);
}

/** how many of these variants are in the cart altogether */
export function cartQuantity(cart: Cart, variants: Array<{id: string}>) {
  return variants.reduce(
    (total, variant) => total + (findLine(cart, variant)?.quantity ?? 0),
    0,
  );
}
