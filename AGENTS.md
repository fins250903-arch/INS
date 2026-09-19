# AGENTS.md

## Cursor Cloud specific instructions

This repository is a single Astro v6 project (marketing site + SEO blog + custom admin) for a Japanese car-interior cleaning service. It is content-file based: there is **no database, cache, queue, or containerized backing service**. Everything a visitor sees is generated from in-repo Markdown/TS/JSON, so the site runs fully with just Node + npm.

### Services / commands

There is only one service (the Astro app). Standard commands live in `package.json`:

- Dev server: `npm run dev` → http://localhost:4321 (use `npm run dev:lan` to bind `0.0.0.0`).
- Build: `npm run build` (runs `blog:fix-media` → `wp:resolve-images` → `astro build`, targets the Vercel adapter).
- Preview a build: `npm run preview`.

### Non-obvious notes

- **Node**: requires `>=22.12.0` (`engines` in `package.json`). The VM's default Node (v22.14) satisfies this; no `nvm`/`.nvmrc` switching needed.
- **No lint script exists.** `npx astro check` is NOT usable out of the box — it interactively prompts to install `@astrojs/check` + `typescript` (not in `package.json`) and will hang in a non-interactive shell. Don't run it during automated checks. Type safety relies on `astro build`.
- **All env vars are optional.** External integrations (Decap CMS GitHub OAuth, GitHub publishing token, Google Search Console) degrade gracefully (return 503 or fall back to local filesystem writes) when unset, so no secrets are required for local dev/build. See `.env.example`.
- **Custom admin login**: `/admin/blog-manager` uses a password cookie; the default password is `admin123` (overridable via `ADMIN_PASSWORD`). Logging in exercises the server-side admin API routes.
- The build emits many per-prefecture/keyword landing pages plus 175+ blog posts; a full `astro build` optimizing images takes a few seconds and is expected to be verbose.
This repository is a single **Astro 6 (SSR, Vercel adapter)** marketing/SEO website + blog for a Japanese
car-interior cleaning business. Everything (public marketing pages, blog, and the self-hosted admin CMS)
is served by one dev server. There is no database, Docker, or separate backend.

### Running the app (development)
- Requires Node.js `>=22.12.0` (see `engines` in `package.json`); npm is the package manager (`package-lock.json`).
- Dev server: `npm run dev` serves the whole product at `http://localhost:4321/`. Use `npm run dev:lan` to bind `0.0.0.0`.
- Admin blog manager: `http://localhost:4321/admin/blog-manager/`. Default password is `admin123` (overridable via `ADMIN_PASSWORD`). See `BLOG_MANAGER_GUIDE.md`.
- All environment variables (`.env.example`) are optional and have graceful fallbacks: without `BLOG_PUBLISH_GITHUB_TOKEN` the admin manager saves posts to local content files instead of publishing to GitHub; Decap CMS (`/admin/`) login and the GSC CLI (`npm run gsc`) need their respective credentials but are not needed to run/test the site.

### Lint / test / build (see `package.json` scripts)
- There is **no lint or test framework** configured. "Validation" is `npm run blog:validate` (checks blog paths/frontmatter). It prints warnings about stray images but still exits 0.
- Production build: `npm run build` (then `npm run preview` to serve `./dist/`). Matches the CI in `.github/workflows/sync-blog-to-production.yml`, which runs `npm ci` → `fix-blog-media-paths.mjs` → `validate-blog-content.mjs` → `npm run build` on Node 22.

### Gotchas
- `npm run build` runs preprocessing scripts (`blog:fix-media`, `wp:resolve-images`) that **move stray images** and rewrite media paths, so the working tree becomes dirty after a build. This is expected; run `git checkout -- . && git clean -fd src/content public/blog-images` to restore if the changes were unintended.
- `npm install` can regenerate `package-lock.json` with large diffs. CI uses `npm ci`, so avoid committing unrelated lockfile churn.
