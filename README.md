# Klica Technologies — website

Marketing site for Klica Technologies: exam preparation apps for JAMB/UTME, WAEC,
NECO, BECE and Post-UTME, plus app, web and digital marketing services.

- **Framework:** Astro 5, static output
- **Hosting:** Netlify
- **Build size:** ~243 KB across 10 pages, with almost no client-side JavaScript

## Why Astro

The content is static marketing copy, and most visitors arrive on mobile data in
Nigeria. Astro renders to plain HTML and ships JavaScript only for the mobile menu
and the contact form, which keeps the site fast on slow connections.

## Local development

```bash
cd site
npm install
npm run dev        # http://localhost:4321
npm run build      # -> site/dist
```

Regenerate the Open Graph card and Apple touch icon only if the brand mark changes:

```bash
node scripts/gen-images.mjs
```

## Deployment

Netlify builds from this repository automatically on every push to `master`.
Configuration lives in `netlify.toml` at the repo root — it sets the base directory
to `site/`, publishes `site/dist`, and pins content types and cache headers.

No manual deploy step is needed.

## `app-ads.txt`

`site/public/app-ads.txt` declares the authorized sellers for advertising in the
Klica mobile apps, per the IAB Authorized Sellers for Apps standard.

It must be served at the site root as `text/plain` with HTTP 200 — `netlify.toml`
pins the content type explicitly rather than relying on extension sniffing, and
`.gitattributes` marks the file as binary so no platform rewrites its line endings
between commit, checkout and build.

Verify integrity at any time:

```bash
sha256sum site/public/app-ads.txt
# 587cced1e9a02a3ddeda91f14e75d82ef04ec72d0879a9ae33917976fe3472e5
```

## Changing the domain

The canonical domain is set in one place, `site/astro.config.mjs`:

```js
site: 'https://klicatech.com',
```

That drives canonical URLs, the sitemap and every Open Graph tag. Also update
`domain` and `url` in `site/src/data/site.ts`, and the `Sitemap:` line in
`site/public/robots.txt`.

## Project layout

```
netlify.toml            build + headers config
site/
  astro.config.mjs      canonical domain, sitemap integration
  public/               served verbatim at the site root
  scripts/              one-off image generation
  src/
    data/site.ts        business details, single source of truth
    data/apps.ts        the app catalogue
    layouts/Base.astro  SEO, Open Graph, JSON-LD
    components/
    pages/
    styles/global.css   design tokens, light and dark
```

## Outstanding

Items marked `TODO(owner)` in the source:

| What | Where |
|---|---|
| Google Play package IDs | `src/data/apps.ts` — `playId`; cards show "Coming soon" until set |
| Original vector logo | `src/components/Logo.astro` — currently a vector rebuild of the mark |
| Contact email | `src/data/site.ts` — switch once domain email is set up |
| Privacy policy review | `src/pages/privacy.astro` — confirm accuracy before relying on it |
| Terms review | `src/pages/terms.astro` |
| Form backend | `src/pages/contact.astro` — currently composes a WhatsApp message |
