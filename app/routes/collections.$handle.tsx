import {useState} from 'react';
import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {BuildBoxCartBar} from '~/components/BuildBoxCartBar';
import {BuildBoxIntro} from '~/components/BuildBoxIntro';
import {
  ProductQuickAdd,
  WithCart,
  cartQuantity,
  type QuickAddProduct,
} from '~/components/ProductQuickAdd';
import {ProductQuickView} from '~/components/ProductQuickView';
import {
  BUILD_YOUR_OWN_BOX_HANDLE,
  isBuildBoxCategory,
  loadBuildBoxCategoryList,
} from '~/lib/buildBox';
import type {ProductItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Sky Box With You | ${data?.collection.title ?? ''} Collection`},
  ];
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
async function loadCriticalData(args: Route.LoaderArgs) {
  const {context, params, request} = args;
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}, buildBoxCategories] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
    handle === BUILD_YOUR_OWN_BOX_HANDLE ? loadBuildBoxCategories(args) : [],
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // Build-your-box categories have no page of their own: send visitors to
  // that category's section on the Build Your Own Box page
  if (isBuildBoxCategory(collection)) {
    throw redirect(
      `/collections/${BUILD_YOUR_OWN_BOX_HANDLE}#${collection.handle}`,
    );
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
    buildBoxCategories,
  };
}

/**
 * The build-your-box categories with their products, ordered by the "Build
 * your box listing order" metafield (A–Z after that). Categories with no
 * products on the storefront yet are left out.
 */
async function loadBuildBoxCategories({context}: Route.LoaderArgs) {
  const {storefront} = context;
  const ordered = await loadBuildBoxCategoryList(storefront);

  const categories = await Promise.all(
    ordered.map((collection) =>
      storefront
        .query(BUILD_BOX_CATEGORY_QUERY, {
          variables: {handle: collection.handle, first: MAX_CATEGORY_PRODUCTS},
        })
        .then((response) => response.collection),
    ),
  );

  return categories.filter(
    (category): category is NonNullable<typeof category> =>
      Boolean(category?.products.nodes.length),
  );
}

const MAX_CATEGORY_PRODUCTS = 50;

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {collection, buildBoxCategories} = useLoaderData<typeof loader>();

  return (
    <div className="collection">
      <Breadcrumbs
        crumbs={[
          {label: 'Home', to: '/'},
          {label: 'Gift Boxes', to: '/collections'},
          {label: collection.title},
        ]}
      />
      <h1 className="sr-only">{collection.title}</h1>
      {buildBoxCategories.length > 0 ? (
        <BuildBoxCategories categories={buildBoxCategories} />
      ) : (
        <PaginatedResourceSection<ProductItemFragment>
          connection={collection.products}
          resourcesClassName="products-grid"
          infiniteScroll
        >
          {({node: product, index}) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      )}
      {collection.handle === BUILD_YOUR_OWN_BOX_HANDLE && (
        <BuildBoxIntro delay={2000} />
      )}
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 10) {
      nodes {
        id
        altText
        url
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      buildBoxCategory: metafield(
        namespace: "custom"
        key: "build_your_box_category"
      ) {
        value
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

/**
 * Build Your Own Box: one section per category, in listing order. Products
 * open in a quick view instead of their own page, so customers stay here.
 *
 * The first category holds the boxes themselves ("Choose Your Box" is step 1).
 * Until one of its products is in the cart, the other categories' products
 * can be browsed but not added.
 */
function BuildBoxCategories({
  categories,
}: {
  categories: Awaited<ReturnType<typeof loadBuildBoxCategories>>;
}) {
  const [openProduct, setOpenProduct] = useState<QuickAddProduct | null>(null);
  const [boxCategory] = categories;
  const boxVariants = boxCategory.products.nodes.flatMap(
    (product) => product.variants.nodes,
  );
  const isBox = (product: QuickAddProduct) =>
    boxCategory.products.nodes.some((box) => box.id === product.id);

  return (
    <WithCart>
      {(cart) => {
        const hasBox = cartQuantity(cart, boxVariants) > 0;
        return (
          <>
            {categories.map((category) => {
              const locked = !hasBox && category !== boxCategory;
              return (
                <section
                  aria-labelledby={`${category.handle}-title`}
                  className="build-box-category"
                  data-locked={locked ? '' : undefined}
                  id={category.handle}
                  key={category.id}
                >
                  <div className="build-box-category-heading">
                    <h2 id={`${category.handle}-title`}>{category.title}</h2>
                    {category === boxCategory && !hasBox && (
                      <p className="build-box-warning" role="status">
                        <span aria-hidden="true">!</span>
                        Choose a box first to start adding gifts
                      </p>
                    )}
                  </div>
                  {locked && (
                    <p className="build-box-locked-note">
                      Choose your box first, then fill it with gifts.{' '}
                      <a href={`#${boxCategory.handle}`}>Choose a box ↑</a>
                    </p>
                  )}
                  <div className="products-grid">
                    {category.products.nodes.map((product) => (
                      <ProductItem
                        key={product.id}
                        onOpen={() => setOpenProduct(product)}
                        product={product}
                        quickAdd={
                          <ProductQuickAdd
                            locked={locked}
                            onChooseOptions={() => setOpenProduct(product)}
                            product={product}
                          />
                        }
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            <ProductQuickView
              locked={!hasBox && openProduct !== null && !isBox(openProduct)}
              onClose={() => setOpenProduct(null)}
              product={openProduct}
            />
            <BuildBoxCartBar />
          </>
        );
      }}
    </WithCart>
  );
}

// A category's products plus the variant details for adding them to the cart
// straight from the card (the variant fields mirror the cart line's, so the
// cart can show the line before Shopify confirms it)
const BUILD_BOX_CATEGORY_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  fragment QuickAddProduct on Product {
    id
    title
    descriptionHtml
    variants(first: 10) {
      nodes {
        id
        availableForSale
        title
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        requiresShipping
        image {
          id
          url
          altText
          width
          height
        }
        product {
          id
          handle
          title
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  query BuildBoxCategory(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: $first) {
        nodes {
          ...ProductItem
          ...QuickAddProduct
        }
      }
    }
  }
` as const;
