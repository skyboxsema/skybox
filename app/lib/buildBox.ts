import type {Storefront} from '@shopify/hydrogen';

// The "Build Your Own Box" collection page lists the gift categories that
// can go in a custom box: collections whose "Build your box category"
// metafield (custom.build_your_box_category) is ticked in Shopify admin. Those
// collections are kept out of the header menu, the homepage and the
// collections list, so customers only meet them on that page.

export const BUILD_YOUR_OWN_BOX_HANDLE = 'build-your-own-box';

export function isBuildBoxCategory(collection: {
  buildBoxCategory?: {value: string} | null;
}) {
  return collection.buildBoxCategory?.value === 'true';
}

/**
 * The build-your-box categories in page order: by the "Build your box listing
 * order" metafield (custom.build_your_box_listing_order), A–Z after that.
 * Categories with no products on the storefront are left out. The first one
 * holds the boxes themselves ("Choose Your Box" is step 1).
 */
export async function loadBuildBoxCategoryList(storefront: Storefront) {
  const {collections} = await storefront.query(BUILD_BOX_CATEGORIES_QUERY);
  return collections.nodes
    .filter(isBuildBoxCategory)
    .filter((collection) => collection.products.nodes.length)
    .map((collection, index) => ({
      collection,
      order: Number(collection.listingOrder?.value ?? '') || 1000 + index,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({collection}) => collection);
}

const BUILD_BOX_CATEGORIES_QUERY = `#graphql
  fragment BuildBoxCategory on Collection {
    id
    handle
    listingOrder: metafield(
      namespace: "custom"
      key: "build_your_box_listing_order"
    ) {
      value
    }
    buildBoxCategory: metafield(
      namespace: "custom"
      key: "build_your_box_category"
    ) {
      value
    }
    products(first: 1) {
      nodes {
        id
      }
    }
  }
  query BuildBoxCategories($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 100, sortKey: TITLE) {
      nodes {
        ...BuildBoxCategory
      }
    }
  }
` as const;
