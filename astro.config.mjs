// @ts-check
import { defineConfig, envField, sessionDrivers } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

import cloudflare from '@astrojs/cloudflare';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeBlogImages } from './src/lib/rehype-blog-images.mjs';
import { includeInSitemap, sitemapLastmod } from './scripts/sitemap-policy.ts';

// DNS is still on Vercel. Workers Builds sets WORKERS_CI; Vercel sets VERCEL.
// `ASTRO_ADAPTER=vercel|cloudflare` overrides the auto-detect for local builds.
const adapterName =
  process.env.ASTRO_ADAPTER === 'vercel' || process.env.ASTRO_ADAPTER === 'cloudflare'
    ? process.env.ASTRO_ADAPTER
    : process.env.WORKERS_CI || process.env.CF_PAGES
      ? 'cloudflare'
      : process.env.VERCEL
        ? 'vercel'
        : 'cloudflare';

const adapter =
  adapterName === 'vercel'
    ? vercel()
    : cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' });

// https://astro.build/config
export default defineConfig({
  site: 'https://insbs.net',
  // Keep Astro 6 HTML whitespace so inline text does not collapse after the v7 default.
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()],
  },

  // No page or endpoint uses `Astro.session`. Without an explicit driver the Cloudflare adapter adds a
  // `SESSION` KV binding to the generated wrangler config, and `wrangler deploy` then rejects it with
  // `SESSION bindings must have an "id" field` until a KV namespace exists. To use sessions, create one
  // (`npx wrangler kv namespace create SESSION`) and swap this for `sessionDrivers.cloudflareKVBinding()`.
  session: { driver: sessionDrivers.null() },

  markdown: {
    // Astro 7 defaults to Sätteri, which does not run rehype plugins.
    processor: unified({
      rehypePlugins: [rehypeBlogImages],
    }),
  },

  env: {
    schema: {
      DECAP_GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      DECAP_GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      DECAP_SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        default: 'https://insbs.net'
      }),
      BLOG_PUBLISH_GITHUB_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      BLOG_PUBLISH_GITHUB_REPO: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'fins250903-arch/INS'
      }),
      BLOG_PUBLISH_GITHUB_BRANCH: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        default: 'main'
      }),
      ADMIN_PASSWORD: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      })
    }
  },

  integrations: [
    sitemap({
      // thanks / compare / 岡山は noindex。管理画面・転送URL・終了した広島も出さない。
      // ブログの lastmod は記事の updatedDate、なければ公開日。
      filter: includeInSitemap,
      serialize(item) {
        const lastmod = sitemapLastmod(item.url);
        return lastmod ? { ...item, lastmod } : item;
      }
    })
  ],

  // Cloudflare: `compile` pre-generates WebP at build time; prerendering runs in Node because
  // `workerd` freezes its clock at the epoch until the first I/O (`dateModified` would become 1970).
  // Vercel: the platform adapter serves the same prerendered pages while DNS still points here.
  adapter
});
