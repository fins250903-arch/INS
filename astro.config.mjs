// @ts-check
import { defineConfig, envField, sessionDrivers } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { rehypeBlogImages } from './src/lib/rehype-blog-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://insbs.net',

  // No page or endpoint uses `Astro.session`. Without an explicit driver the Cloudflare adapter adds a
  // `SESSION` KV binding to the generated wrangler config, and `wrangler deploy` then rejects it with
  // `SESSION bindings must have an "id" field` until a KV namespace exists. To use sessions, create one
  // (`npx wrangler kv namespace create SESSION`) and swap this for `sessionDrivers.cloudflareKVBinding()`.
  session: { driver: sessionDrivers.null() },

  markdown: {
    rehypePlugins: [rehypeBlogImages]
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
      // thanks / compare / 岡山(okayama) は noindex のためサイトマップから除外
      // 広島(hirosima) はサービス提供終了により LP を廃止（ページ自体を生成しない）
      filter: (page) =>
        !page.includes('/thanks/') &&
        !page.includes('/compare/') &&
        !page.includes('/okayama/')
    })
  ],

  // `compile` optimizes every `<Image />` with sharp during the build, so prerendered pages ship the
  // same pre-generated WebP assets as before. The few SSR routes fall back to the original file.
  //
  // Prerendering runs in Node because pages bake in the current date (`SITE_CONTENT_UPDATED`,
  // JSON-LD `dateModified`), and `workerd` freezes its clock at the epoch until the first I/O.
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' })
});
