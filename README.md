# Bakkenshale.com — Astro Site

Astro site for Bakkenshale.com with Decap CMS, Cloudflare Pages, and content from scraped HTML.

## Setup

```bash
npm install
```

## Migration (from scraped HTML)

1. **Download images** (run before conversion):
   ```bash
   npm run download-images
   ```

2. **Convert HTML to content**:
   ```bash
   npm run convert-html
   ```

## Development

```bash
npm run dev
```

For Decap CMS locally, run `npx decap-server` in another terminal, then visit `/admin`.

## Build & Deploy

```bash
npm run build
```

Deploy `dist/` to Cloudflare Pages. Set root directory to `astro-site` if the repo root is the parent folder.

## Cloudflare Pages

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (for Decap CMS OAuth), `EIA_API_KEY` (for WTI/natural gas prices on homepage)

## Structure

- `src/content/pages/` — CMS-editable Markdown (from conversion)
- `public/admin/` — Decap CMS (index.html, config.yml)
- `functions/api/` — GitHub OAuth (auth.js, callback.js)
