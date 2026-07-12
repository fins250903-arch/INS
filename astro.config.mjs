// @ts-check
import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { rehypeBlogImages } from './src/lib/rehype-blog-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://insbs.net',

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

  adapter: vercel()
});
