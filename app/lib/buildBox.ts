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
