# Klica Technologies — website

Website for Klica Technologies. The home page is the download hub for the **OneSitting**
exam-prep app (JAMB, WAEC, Post-UTME): Google Play, the App Store, and a Windows installer.
Services and Contact pages cover app, web and digital marketing work.

- **Framework:** Astro 5, static output
- **Hosting:** Netlify
- **Desktop downloads:** Cloudflare Worker + R2 (`downloads-worker/`)

## Why Astro

The content is static marketing copy, and most visitors arrive on mobile data in
Nigeria. Astro renders to plain HTML and ships JavaScript only for the mobile menu, the
download dialog, the contact form and the stats page, which keeps the site fast on
slow connections.

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

## Desktop downloads (`downloads-worker/`)

The Windows installer is too big for Netlify, so it lives in the Cloudflare R2 bucket
`onesitting-downloads` and is served by the Worker `onesitting-downloads`
(https://onesitting-downloads.austinemishael.workers.dev).

| Route | What it does |
|---|---|
| `GET /windows` | the current installer; supports resume (`Range`); max 3 starts per IP per minute |
| `GET /info` | current version, size and SHA-256 per platform (the site reads this) |
| `GET /stats` | daily counts for `klicatech.com/stats`; needs the `STATS_KEY` password |
| `klicatech.com/download/windows` | Netlify 302 to `/windows` (a redirect, not a proxy) |

The button uses the browser's own download, so it keeps going when the visitor leaves the
page and can be resumed after a dropped connection.

**Download counts.** When the last byte of the installer is sent (a full download, or the
final part of a resumed one), the Worker adds 1 to Firestore
`website_downloads_daily/{YYYY-MM-DD, Lagos time}` `{date, total, windows, updatedAt}` in the
`onesitting-jamb` project. Cancelled downloads and small range probes are not counted.

**Private stats page.** `klicatech.com/stats` asks for the password and shows today,
yesterday, the last 7 and 30 days and a per-day chart. It is `noindex` and not in the sitemap.

**Worker secrets** (`npx wrangler secret put <NAME>` in `downloads-worker/`; never committed):
`SA_EMAIL`, `SA_KEY` (service account with the *Cloud Datastore User* role), `STATS_KEY`.
`UPLOAD_SECRET` exists only while uploading an installer.

### Shipping a new Windows installer

Run in PowerShell from `downloads-worker/` (use `npx.cmd`: the execution policy blocks `npx.ps1`):

1. Set a temporary `UPLOAD_SECRET` with `npx.cmd wrangler secret bulk <file.json>` (piping the
   value into `secret put` stores a stray line ending).
2. Upload, resumable, retrying dropped connections on its own:
   `$env:UPLOAD_SECRET=...; $env:UPLOAD_STATE=...; node scripts/upload.mjs <msi> windows/OneSitting-<version>.msi`
3. `npx.cmd wrangler secret delete UPLOAD_SECRET`
4. In `wrangler.toml` set `WINDOWS_KEY`, `WINDOWS_VERSION`, `WINDOWS_SHA256`, then `npx.cmd wrangler deploy`.
5. Check `/info`, then delete the old object:
   `npx.cmd wrangler r2 object delete onesitting-downloads/windows/<old>.msi --remote`
6. Update the fallbacks `windowsVersion` / `windowsSizeBytes` in `site/src/data/site.ts`.

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
netlify.toml            build, headers and redirects config
downloads-worker/       Cloudflare Worker for desktop installers, counts and stats
  src/index.js
  scripts/upload.mjs    resumable multipart upload of an installer to R2
site/
  astro.config.mjs      canonical domain, sitemap integration
  public/               served verbatim at the site root
  scripts/              one-off image generation
  src/
    data/site.ts        business details and OneSitting links, single source of truth
    layouts/Base.astro  SEO, Open Graph, JSON-LD
    components/         DownloadHub.astro (home page), Header, Footer, Logo
    pages/              index (download hub), services, contact, stats, privacy, terms
    styles/global.css   design tokens, light and dark
```

## Outstanding

Items marked `TODO(owner)` in the source:

| What | Where |
|---|---|
| Original vector logo | `src/components/Logo.astro` — currently a vector rebuild of the mark |
| Contact email | `src/data/site.ts` — switch once domain email is set up |
| Privacy policy review | `src/pages/privacy.astro` — confirm accuracy before relying on it |
| Terms review | `src/pages/terms.astro` |
| Form backend | `src/pages/contact.astro` — currently composes a WhatsApp message |
| Mac installer | `src/data/site.ts` — `macReady`; the Mac option shows "Coming soon" until a build exists |
