import {Suspense, useRef, useState} from 'react';
import {Await, Link, useRouteLoaderData} from 'react-router';
import {Image, Money, useOptimisticCart} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
  SearchProductFragment,
  CartApiQueryFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import type {RootLoader} from '~/root';

export function ProductItem({
  product,
  loading,
  url,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment
    | SearchProductFragment;
  loading?: 'eager' | 'lazy';
  /** overrides the product link, e.g. to carry search tracking params */
  url?: string;
}) {
  const defaultUrl = useVariantUrl(product.handle);
  const variantUrl = url ?? defaultUrl;
  const rootData = useRouteLoaderData<RootLoader>('root');
  // collection pages load every photo; elsewhere only the featured one
  const images =
    'images' in product && product.images.nodes.length
      ? product.images.nodes
      : product.featuredImage
        ? [product.featuredImage]
        : [];

  return (
    <div className="product-item">
      <div className="product-item-image">
        <ProductItemPhotos
          images={images}
          title={product.title}
          url={variantUrl}
          loading={loading}
        />
        {rootData?.cart && (
          <Suspense fallback={null}>
            <Await resolve={rootData.cart}>
              {(cart) => <InCartBadge cart={cart} handle={product.handle} />}
            </Await>
          </Suspense>
        )}
      </div>
      <Link prefetch="intent" to={variantUrl}>
        <h4>{product.title}</h4>
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      </Link>
    </div>
  );
}

type PhotoImage = NonNullable<ProductItemFragment['featuredImage']>;

/** Swipeable strip of a product's photos, with arrows and dots when there are several */
function ProductItemPhotos({
  images,
  title,
  url,
  loading,
}: {
  images: PhotoImage[];
  title: string;
  url: string;
  loading?: 'eager' | 'lazy';
}) {
  const stripRef = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(0);
  const count = images.length;

  const go = (index: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const next = (index + count) % count;
    strip.scrollTo({left: next * strip.clientWidth, behavior: 'smooth'});
  };

  return (
    <>
      <Link
        ref={stripRef}
        className="product-item-photos"
        prefetch="intent"
        to={url}
        tabIndex={-1}
        aria-hidden
        onScroll={(event) => {
          const strip = event.currentTarget;
          setActive(Math.round(strip.scrollLeft / strip.clientWidth));
        }}
      >
        {images.map((image, index) => (
          <Image
            key={image.id}
            alt={image.altText || title}
            aspectRatio="4/5"
            data={image}
            loading={index === 0 ? loading : 'lazy'}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        ))}
      </Link>
      {count > 1 && (
        <>
          <button
            type="button"
            className="product-item-arrow product-item-arrow-prev"
            aria-label={`Previous photo of ${title}`}
            onClick={() => go(active - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="product-item-arrow product-item-arrow-next"
            aria-label={`Next photo of ${title}`}
            onClick={() => go(active + 1)}
          >
            ›
          </button>
          <div className="product-item-dots" aria-hidden>
            {images.map((image, index) => (
              <span key={image.id} data-active={index === active} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function InCartBadge({
  cart: originalCart,
  handle,
}: {
  cart: CartApiQueryFragment | null;
  handle: string;
}) {
  // Optimistic so the badge appears as soon as "Add to cart" is clicked
  const cart = useOptimisticCart(originalCart);
  const quantity = (cart?.lines?.nodes ?? []).reduce(
    (total, line) =>
      line.merchandise.product.handle === handle
        ? total + line.quantity
        : total,
    0,
  );

  if (quantity === 0) return null;

  return (
    <span className="product-item-in-cart">
      ✓ In cart{quantity > 1 ? ` (${quantity})` : ''}
    </span>
  );
}
