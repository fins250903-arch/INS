# AGENTS.md

## Cursor Cloud specific instructions

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
