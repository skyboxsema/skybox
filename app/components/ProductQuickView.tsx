import {useEffect, useRef, useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {
  VariantCartControls,
  WithCart,
  findLine,
  type QuickAddProduct,
} from './ProductQuickAdd';

/**
 * Product details in a modal, so customers building a box never leave the
 * page: photos, price, options, add / quantity controls, description and
 * shipping notes. Open while `product` is set; `onClose` clears it.
 */
export function ProductQuickView({
  onClose,
  product,
}: {
  onClose: () => void;
  product: QuickAddProduct | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (product && !element.open) element.showModal();
    if (!product && element.open) element.close();
  }, [product]);

  return (
    <dialog
      aria-label={product?.title}
      className="quick-view"
      onClick={(event) => {
        // clicks on the backdrop land on the <dialog> element itself
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      onClose={onClose}
      ref={dialog}
    >
      <button
        aria-label="Close"
        className="quick-view-close reset"
        onClick={() => dialog.current?.close()}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      {product && <QuickViewContent key={product.id} product={product} />}
    </dialog>
  );
}

function QuickViewContent({product}: {product: QuickAddProduct}) {
  const variants = product.variants.nodes;
  const images = product.images.nodes.length
    ? product.images.nodes
    : product.featuredImage
      ? [product.featuredImage]
      : [];

  return (
    <WithCart>
      {(cart) => (
        <QuickViewBody
          cart={cart}
          images={images}
          product={product}
          // open on a variant already in the cart, else the first for sale
          initialVariantId={
            (
              variants.find((variant) => findLine(cart, variant)) ??
              variants.find((variant) => variant.availableForSale) ??
              variants[0]
            )?.id
          }
        />
      )}
    </WithCart>
  );
}

function QuickViewBody({
  cart,
  images,
  initialVariantId,
  product,
}: {
  cart: Parameters<typeof VariantCartControls>[0]['cart'];
  images: QuickAddProduct['images']['nodes'];
  initialVariantId: string | undefined;
  product: QuickAddProduct;
}) {
  const variants = product.variants.nodes;
  const [variantId, setVariantId] = useState(initialVariantId);
  // the description stays folded away until the customer asks for it
  const [showDescription, setShowDescription] = useState(false);
  const variant =
    variants.find((option) => option.id === variantId) ?? variants[0];
  const optionNames = variant?.selectedOptions
    .map((option) => option.name)
    .join(' / ');

  return (
    <div className="quick-view-inner">
      <div className="quick-view-photos">
        {images.map((image) => (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            key={image.id}
            sizes="(min-width: 48em) 22rem, 50vw"
          />
        ))}
      </div>

      <div className="quick-view-info">
        <h2>{product.title}</h2>
        {variant && (
          <p className="quick-view-price">
            <Money data={variant.price} />
          </p>
        )}

        {variants.length > 1 && (
          <fieldset className="quick-view-options">
            <legend>{optionNames}</legend>
            <div>
              {variants.map((option) => (
                <button
                  aria-pressed={option.id === variant?.id}
                  className="quick-view-option"
                  disabled={!option.availableForSale}
                  key={option.id}
                  onClick={() => setVariantId(option.id)}
                  type="button"
                >
                  {option.title}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {variant && (
          <div className="quick-view-cart">
            <VariantCartControls
              addLabel="Add to box"
              cart={cart}
              label={(quantity) => quantity}
              stepperClassName="product-quantity quick-view-stepper"
              variant={variant}
            />
          </div>
        )}

        {product.descriptionHtml && (
          <div className="quick-view-more">
            <button
              aria-controls={`${product.id}-description`}
              aria-expanded={showDescription}
              className="quick-view-more-toggle"
              onClick={() => setShowDescription((shown) => !shown)}
              type="button"
            >
              {showDescription ? 'Show less' : 'More details'}
              <span aria-hidden="true">{showDescription ? '−' : '+'}</span>
            </button>
            <div
              className="quick-view-description"
              dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
              hidden={!showDescription}
              id={`${product.id}-description`}
            />
          </div>
        )}

        <ul className="quick-view-notes">
          <li>
            <TruckIcon />
            <div>
              <strong>Fast shipping</strong>
              <span>
                Orders placed by 2:00 PM ET on business days ship the same day.
              </span>
            </div>
          </li>
          <li>
            <BoxIcon />
            <div>
              <strong>Delivery options</strong>
              <span>
                Standard $8 (3–5 business days) or Express $15 (1–2 business
                days).
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

function NoteIcon({children}: {children: React.ReactNode}) {
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

function TruckIcon() {
  return (
    <NoteIcon>
      <path d="M2 6h11v10H2zM13 9h4l3 3.5V16h-7" />
      <circle cx="6" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </NoteIcon>
  );
}

function BoxIcon() {
  return (
    <NoteIcon>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
    </NoteIcon>
  );
}
