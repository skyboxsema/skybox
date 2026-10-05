import {Suspense} from 'react';
import {Await, Link, useNavigate, useRouteLoaderData} from 'react-router';
import {
  CartForm,
  type MappedProductOptions,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {getUpdateKey} from './CartLineItem';
import type {
  CartApiQueryFragment,
  ProductFragment,
} from 'storefrontapi.generated';
import type {RootLoader} from '~/root';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const rootData = useRouteLoaderData<RootLoader>('root');
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <h5>{option.name}</h5>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className={`product-options-item${
                        selected ? ' selected' : ''
                      }`}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${
                        selected ? ' selected' : ''
                      }${exists && !selected ? ' link' : ''}`}
                      key={option.name + name}
                      style={{
                        opacity: available ? 1 : 0.3,
                      }}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
      {selectedVariant?.availableForSale ? (
        <Suspense
          fallback={<ProductAddButton selectedVariant={selectedVariant} />}
        >
          <Await
            resolve={rootData?.cart}
            errorElement={
              <ProductAddButton selectedVariant={selectedVariant} />
            }
          >
            {(cart) => (
              <ProductCartControls
                cart={cart}
                selectedVariant={selectedVariant}
              />
            )}
          </Await>
        </Suspense>
      ) : (
        <AddToCartButton disabled lines={[]}>
          Sold out
        </AddToCartButton>
      )}
    </div>
  );
}

type SelectedVariant = NonNullable<
  ProductFragment['selectedOrFirstAvailableVariant']
>;

function ProductAddButton({
  selectedVariant,
}: {
  selectedVariant: SelectedVariant;
}) {
  const {open} = useAside();
  return (
    <AddToCartButton
      onClick={() => {
        open('cart');
      }}
      lines={[
        {
          merchandiseId: selectedVariant.id,
          quantity: 1,
          selectedVariant,
        },
      ]}
    >
      Add to cart
    </AddToCartButton>
  );
}

/**
 * Shows "Add to cart" until the selected variant is in the cart, then swaps
 * to a quantity stepper. At quantity 1 the minus becomes a remove (trash) button.
 */
function ProductCartControls({
  cart: originalCart,
  selectedVariant,
}: {
  cart: CartApiQueryFragment | null | undefined;
  selectedVariant: SelectedVariant;
}) {
  // Optimistic so the controls update as soon as a button is clicked
  const cart = useOptimisticCart(originalCart);
  const line = cart?.lines?.nodes?.find(
    (line) => line.merchandise.id === selectedVariant.id,
  );

  if (!line) return <ProductAddButton selectedVariant={selectedVariant} />;

  const {id: lineId, quantity, isOptimistic} = line;
  const disabled = !!isOptimistic;

  return (
    <div className="product-quantity">
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
        {quantity} in cart
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

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}
