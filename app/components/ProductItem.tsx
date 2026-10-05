import {Suspense} from 'react';
import {Await, Link, useRouteLoaderData} from 'react-router';
import {Image, Money, useOptimisticCart} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
  CartApiQueryFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import type {RootLoader} from '~/root';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const rootData = useRouteLoaderData<RootLoader>('root');
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="product-item-image">
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="4/5"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        {rootData?.cart && (
          <Suspense fallback={null}>
            <Await resolve={rootData.cart}>
              {(cart) => <InCartBadge cart={cart} handle={product.handle} />}
            </Await>
          </Suspense>
        )}
      </div>
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
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
