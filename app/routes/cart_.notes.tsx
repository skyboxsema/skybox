import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/cart_.notes';
import {Image} from '@shopify/hydrogen';
import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {loadBuildBoxCategoryList} from '~/lib/buildBox';

// Saved as a line item property, so it shows on the item at checkout,
// on the order in Shopify admin and on packing slips.
const NOTE_KEY = 'Note';
const NOTE_MAX_LENGTH = 250;

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Sky Box With You | Add a Gift Message'},
    {name: 'robots', content: 'noindex'},
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const cart = await context.cart.get();
  if (!cart?.lines?.nodes?.length) throw redirect('/cart');
  const lines = await getNoteLines(context, cart.lines.nodes);
  // nothing to leave a note on: straight to checkout
  if (!lines.length) throw redirect(cart.checkoutUrl);
  return {lines};
}

export async function action({request, context}: Route.ActionArgs) {
  const cart = await context.cart.get();
  if (!cart?.lines?.nodes?.length) return redirect('/cart');

  const form = await request.formData();
  const updates: CartLineUpdateInput[] = [];

  for (const line of await getNoteLines(context, cart.lines.nodes)) {
    const note = String(form.get(`note:${line.id}`) ?? '')
      .trim()
      .slice(0, NOTE_MAX_LENGTH);
    if (note === getNote(line)) continue;

    const otherAttributes = line.attributes
      .filter((attribute) => attribute.key !== NOTE_KEY)
      .map(({key, value}) => ({key, value: value ?? ''}));

    updates.push({
      id: line.id,
      attributes: note
        ? [...otherAttributes, {key: NOTE_KEY, value: note}]
        : otherAttributes,
    });
  }

  if (!updates.length) return redirect(cart.checkoutUrl);

  const result = await context.cart.updateLines(updates);
  if (result.errors?.length || !result.cart?.checkoutUrl) {
    return {error: 'We could not save your notes. Please try again.'};
  }

  return redirect(result.cart.checkoutUrl, {
    headers: context.cart.setCartId(result.cart.id),
  });
}

export default function CartNotes() {
  const {lines} = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state !== 'idle';

  return (
    <div className="cart-notes">
      <header className="contact-intro">
        <h1>Add a Note</h1>
        <p>
Make your gift even more personal. Write your message below, and we’ll include it on a note card inside your gift box. Remember to add your name so they know who it’s from.
Prefer no message? Leave this field blank and continue to checkout.
        </p>
      </header>

      <Form method="post" className="contact-form">
        <ul className="cart-notes-lines">
          {lines.map((line) => {
            const {product, title, image} = line.merchandise;
            const variantTitle =
              title && title !== 'Default Title' ? title : null;

            return (
              <li key={line.id} className="cart-notes-line">
                <div className="cart-line-inner">
                  {image && (
                    <Image
                      alt={product.title}
                      aspectRatio="1/1"
                      data={image}
                      height={80}
                      loading="lazy"
                      width={80}
                    />
                  )}
                  <div>
                    <strong>{product.title}</strong>
                    {variantTitle && (
                      <p>
                        <small>{variantTitle}</small>
                      </p>
                    )}
                    <p>
                      <small>Quantity: {line.quantity}</small>
                    </p>
                  </div>
                </div>
                <label>
                  Note (optional)
                  <textarea
                    name={`note:${line.id}`}
                    rows={3}
                    maxLength={NOTE_MAX_LENGTH}
                    defaultValue={getNote(line)}
                  />
                </label>
              </li>
            );
          })}
        </ul>

        {result?.error ? (
          <p className="contact-error" role="alert">
            {result.error}
          </p>
        ) : null}

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Continue to Checkout →'}
        </button>
        <Link to="/cart" className="cart-notes-back">
          ← Back to cart
        </Link>
      </Form>
    </div>
  );
}

type CartLines = CartApiQueryFragment['lines']['nodes'];

/**
 * The lines that get a note: the boxes. For a box built on the Build Your Own
 * Box page that's the box itself, not the gifts that go in it (products in
 * the other build-your-box categories). Anything else, such as a ready-made
 * gift box, gets one too.
 */
async function getNoteLines(
  {storefront}: Route.LoaderArgs['context'],
  lines: CartLines,
) {
  const topLevelLines = getTopLevelLines(lines);
  const productIds = [
    ...new Set(topLevelLines.map((line) => line.merchandise.product.id)),
  ];
  const [categories, {nodes}] = await Promise.all([
    loadBuildBoxCategoryList(storefront),
    storefront.query(CART_PRODUCT_COLLECTIONS_QUERY, {
      variables: {ids: productIds},
    }),
  ]);

  const [boxCategory, ...giftCategories] = categories;
  const giftCategoryIds = new Set(giftCategories.map(({id}) => id));
  const collectionsByProduct = new Map(
    nodes.flatMap((node) =>
      node && 'collections' in node
        ? [[node.id, node.collections.nodes.map(({id}) => id)] as const]
        : [],
    ),
  );

  return topLevelLines.filter((line) => {
    const collectionIds =
      collectionsByProduct.get(line.merchandise.product.id) ?? [];
    if (boxCategory && collectionIds.includes(boxCategory.id)) return true;
    return !collectionIds.some((id) => giftCategoryIds.has(id));
  });
}

const CART_PRODUCT_COLLECTIONS_QUERY = `#graphql
  query CartProductCollections(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        id
        collections(first: 50) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

/** Child lines (bundle components and the like) belong to their parent line. */
function getTopLevelLines(lines: CartLines) {
  return lines.filter(
    (line) =>
      !('parentRelationship' in line && line.parentRelationship?.parent),
  );
}

function getNote(line: CartLines[number]) {
  return (
    line.attributes.find((attribute) => attribute.key === NOTE_KEY)?.value ?? ''
  );
}
