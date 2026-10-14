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

// Saved as a line item property, so it shows on the item at checkout,
// on the order in Shopify admin and on packing slips.
const NOTE_KEY = 'Note';
const NOTE_MAX_LENGTH = 250;

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Sky Box With You | Add a Note'},
    {name: 'robots', content: 'noindex'},
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const cart = await context.cart.get();
  if (!cart?.lines?.nodes?.length) throw redirect('/cart');
  return {cart};
}

export async function action({request, context}: Route.ActionArgs) {
  const cart = await context.cart.get();
  if (!cart?.lines?.nodes?.length) return redirect('/cart');

  const form = await request.formData();
  const updates: CartLineUpdateInput[] = [];

  for (const line of getTopLevelLines(cart.lines.nodes)) {
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
  const {cart} = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state !== 'idle';

  return (
    <div className="cart-notes">
      <header className="contact-intro">
        <h1>Add a Note</h1>
        <p>
          Anything we should know about a box? Leave a note for each item, or
          leave it blank and continue to checkout.
        </p>
      </header>

      <Form method="post" className="contact-form">
        <ul className="cart-notes-lines">
          {getTopLevelLines(cart.lines.nodes).map((line) => {
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
