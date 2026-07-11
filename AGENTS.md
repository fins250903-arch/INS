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
