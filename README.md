# INS — insbs.net

Astro 6 (SSR) marketing site and blog for a Japanese car-interior cleaning business, hosted on
**Cloudflare Workers** with Workers Static Assets.

- Site Worker: `ins` (`wrangler.jsonc`) — serves the 650+ prerendered pages plus the SSR routes
  (`/admin/blog-manager/`, `/api/**`, `/auth`, `/callback`, `/wp1/**`, `/image-proxy`).
- Redirect Worker: `ins-legacy-redirects` (`workers/legacy-redirects/`) — handles `www`, `osak`, `hyg`
  and `siga` hostnames.
- Path redirects live in `redirects.config.json` and are compiled into `public/_redirects`.

Requires Node.js 22 (see `.node-version`) and npm.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Astro dev server on `http://localhost:4321` |
| `npm run build` | Production build into `./dist` (also regenerates `public/_redirects` and blog media paths) |
| `npm run preview` | Serve the build with `wrangler dev` on `http://localhost:8787` (real `workerd` runtime) |
| `npm run deploy` | Build and deploy the site Worker |
| `npm run deploy:preview` | Build and upload a preview version (`wrangler versions upload`) |
| `npm run deploy:legacy-redirects` | Deploy the redirect-only Worker |
| `npm run blog:validate` | Check blog paths and frontmatter |
| `npm run cf:redirects` | Regenerate `public/_redirects` from `redirects.config.json` |
| `npm run cf:redirects:check` | Fail if the committed `public/_redirects` is stale |
| `npm run cf:redirects:verify` | Replay the redirect expectations captured before the migration |

`wrangler` commands require a build first: `astro build` writes `dist/server/entry.mjs` and the
`.wrangler/deploy/config.json` redirect that tells wrangler which config to deploy.

## Documentation

- `docs/CLOUDFLARE_MIGRATION.md` — Cloudflare/DNS cutover runbook, Workers Builds settings, troubleshooting.
- `BLOG_MANAGER_GUIDE.md` — the self-hosted admin blog manager.
- `docs/GSC_SETUP.md` — Google Search Console sync.
