# Sky Box With You: launch plan

Last updated: 2026-10-02

## Where things stand

The storefront is built, deployed and attached to `skyboxwithyou.com`. It is still private: visitors get a Shopify login screen, and no customer can reach it or order yet.

## Done

- [x] Hydrogen channel installed and storefront `skyboxwithyou` created
- [x] Local project linked to the store
- [x] Store name set to "Sky Box With You" (country US, currency USD, language English)
- [x] Header and footer menus defined in code
- [x] Shopify Payments switched on (cards, Shop Pay, Apple Pay, Google Pay)
- [x] Code on GitHub (`skyboxsema/skybox`); every push to `main` deploys automatically
- [x] First production deployment live on Shopify hosting
- [x] `skyboxwithyou.com` points at the storefront, and `www` forwards to it

## Remaining before launch

### 1. Products and collections (in progress)

- [ ] Add the rest of the products. One product and the "Happy Birthday Boxes" collection show on the site so far.
- [ ] Publish every product and collection to the **Hydrogen** sales channel, or it will not appear.
- [ ] Rename or delete the default "Ana sayfa" collection; it shows on the home page as a card.
- [ ] Give each collection an image and a short description; the home page cards use both.

### 2. Brand text

These are placeholders in the code and need real wording:

- [ ] Announcement bar: "Curated with care · Delivered to your door" (`app/components/Header.tsx`)
- [ ] Hero headline and line: "Curated With Care." plus a filler sentence (`app/routes/_index.tsx`)
- [ ] "Our story" section: "Made with intention." plus filler text (`app/routes/_index.tsx`)
- [ ] Create an **About** page in Shopify (Content → Pages, handle `about`). The "Discover more" button links to it and currently leads to a "not found" page.
- [ ] Optional: add `app/assets/hero.jpg` to choose the hero photo. Without it, the hero uses a collection or product image.

### 3. Store policies

In Shopify: Settings → Policies. The footer's "Policies" link lists whatever exists.

- [x] Privacy policy
- [ ] Refund policy
- [ ] Shipping policy
- [ ] Terms of service

### 4. Plan and payments

- [ ] Confirm a paid Shopify plan is selected (Basic is enough). Real orders need one.
- [ ] Check Settings → Payments for any banner asking for more documents. Payouts can be held until Shopify finishes verifying the business and bank account.

### 5. Shipping and taxes

- [ ] Set shipping rates (Settings → Shipping and delivery)
- [ ] Review US sales tax settings (Settings → Taxes and duties)


## 6

- [ ] Put checkout on `checkout.skyboxwithyou.com`. Checkout currently runs on `fumndw-06.myshopify.com`. Add the subdomain to the Online Store channel in Settings → Domains, then set `PUBLIC_CHECKOUT_DOMAIN` in the storefront's environment variables; that also clears the analytics warning in the browser console.
- [ ] Update Node and npm on the development machine. The local npm (11.6.1) is older than the one GitHub uses, which caused the first deployment failures.


### 7. Test and go live

- [ ] Place a test order from start to finish on `skyboxwithyou.com`, including payment
- [ ] Test "Sign in" (customer accounts) on the live domain
- [ ] Check the site on a phone
- [ ] Make the production environment public (Hydrogen → skyboxwithyou → storefront settings)
- [ ] Remove the store password (Online Store → Preferences)
