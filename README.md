# Hydrogen template: Skeleton

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [React Router](https://reactrouter.com/), the modern multi-strategy router for React. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with React Router](https://reactrouter.com/start/framework/routing)

## What's included

- React Router
- Hydrogen
- Oxygen
- Vite
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

**Requirements:**

- Node.js version 22.x or 24.x

```bash
npm create @shopify/hydrogen@latest
```

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```

## Setup for using Customer Account API (`/account` section)

Follow step 1 and 2 of <https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen#step-1-set-up-a-public-domain-for-local-development>

## Managing the storefront from Shopify admin

Some parts of the storefront are controlled by metafields and metaobjects in Shopify admin. Every definition below needs **Storefronts** access set to **Read**, otherwise the storefront can't see it.

### Collection metafields

Create these under **Settings → Metafields and metaobjects → Collections**, then set the values on each collection in **Products → Collections** (Metafields section).

| Name | Namespace and key | Type | What it does |
| --- | --- | --- | --- |
| Show in menu | `custom.show_in_menu` | True or false | Set to **False** to hide the collection from the navbar. Empty or **True** shows it. |
| Menu order | `custom.menu_order` | Integer | Position in the navbar, lowest first. Collections without a number come after, A–Z. |
| Home order | `custom.home_order` | Integer | Position in the homepage's "Shop by Collection" section, lowest first. The section shows 3 collections, so numbers 1–3 also choose which ones appear. Collections without a number come after, most recently updated first. |

The `frontpage` collection is always hidden from the navbar.

### Product metafields

Create these under **Settings → Metafields and metaobjects → Products**, then set the values on each product in **Products** (Metafields section).

| Name | Namespace and key | Type | What it does |
| --- | --- | --- | --- |
| Show on homepage | `custom.show_on_homepage` | True or false | Set to **True** to list the product in the homepage's "Our Selection" section (up to 8, most recently updated first; checked among the 100 most recently updated products). While no product is ticked, the 4 most recently updated products show. |

### Hero slider (metaobject)

Homepage slides are entries of the `hero_slide` metaobject (**Content → Metaobjects → Hero slide**). Each slide shows only its image; clicking it opens the link. Images are displayed at 1905 × 1023, so make them that size to avoid cropping.

| Field key | Type | What it does |
| --- | --- | --- |
| `image` | File (image) | The slide image. |
| `button_link` | Single line text | Where the slide goes when clicked, e.g. `/collections/all` or a full `https://` URL. |
| `position` | Integer | Slide order, lowest first. |
| `heading` | Single line text | Not shown; read by screen readers if the image has no alt text. |

Until a slide exists, a default slide shows `app/assets/hero.jpg` (or `.jpeg`, `.png`, `.webp`) and links to `/collections/all`.
