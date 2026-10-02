import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';

// Drop a file named hero.jpg (or .jpeg, .png, .webp) into app/assets to set
// the hero image. Without one, the hero falls back to a store image.
const [localHeroImage] = Object.values(
  import.meta.glob<string>('../assets/hero.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
);

export const meta: Route.MetaFunction = () => {
  return [{title: 'Sky Box With You | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections, products}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    collections: collections.nodes,
    heroImage:
      collections.nodes.find((collection) => collection.image)?.image ??
      products.nodes[0]?.featuredImage ??
      null,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Hero image={data.heroImage} />
      <HomeCollections collections={data.collections} />
      <RecommendedProducts products={data.recommendedProducts} />
      <BrandStory />
    </div>
  );
}

// Placeholder copy: replace with the brand's own headline
function Hero({image}: {image: FeaturedCollectionFragment['image']}) {
  return (
    <div className="hero">
      <div className="hero-image">
        {localHeroImage ? (
          <img alt="" src={localHeroImage} />
        ) : image ? (
          <Image
            alt={image.altText || ''}
            data={image}
            loading="eager"
            sizes="(min-width: 48em) 50vw, 100vw"
          />
        ) : null}
      </div>
      <div className="hero-content">
        <p className="eyebrow">Sky Box With You</p>
        <h1>Curated With Care.</h1>
        <p>A short line about what you offer and who it is for goes here.</p>
        <Link className="button" prefetch="intent" to="/collections/all">
          Shop now
        </Link>
      </div>
    </div>
  );
}

function HomeCollections({
  collections,
}: {
  collections: FeaturedCollectionFragment[];
}) {
  if (!collections.length) return null;
  return (
    <section className="home-collections" aria-labelledby="home-collections">
      <div className="section-heading">
        <p className="eyebrow">Explore</p>
        <h2 id="home-collections">Shop by Collection</h2>
      </div>
      <div className="home-collections-grid">
        {collections.map((collection) => (
          <Link
            className="home-collection"
            key={collection.id}
            prefetch="intent"
            to={`/collections/${collection.handle}`}
          >
            <div className="home-collection-image">
              {collection.image && (
                <Image
                  alt={collection.image.altText || collection.title}
                  aspectRatio="4/5"
                  data={collection.image}
                  loading="lazy"
                  sizes="(min-width: 48em) 33vw, 100vw"
                />
              )}
            </div>
            <h3>{collection.title}</h3>
            {collection.description && <p>{collection.description}</p>}
            <span className="button">Explore</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Placeholder copy: replace with the brand's own story
function BrandStory() {
  return (
    <section className="brand-story" aria-labelledby="brand-story">
      <p className="eyebrow">Our story</p>
      <h2 id="brand-story">Made with intention.</h2>
      <p>
        Tell your brand story here: what you make, how you make it, and why it
        matters.
      </p>
      <Link className="button" prefetch="intent" to="/pages/about">
        Discover more
      </Link>
    </section>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <Suspense fallback={null}>
      <Await resolve={products}>
        {(response) =>
          response?.products.nodes.length ? (
            <section
              className="recommended-products"
              aria-labelledby="recommended-products"
            >
              <div className="section-heading">
                <p className="eyebrow">Curated</p>
                <h2 id="recommended-products">Our Selection</h2>
              </div>
              <div className="recommended-products-grid">
                {response.products.nodes.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null
        }
      </Await>
    </Suspense>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    description
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 3, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
    products(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        featuredImage {
          id
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
