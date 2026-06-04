// @ts-check
import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://insbs.net',

  env: {
    schema: {
      DECAP_GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      DECAP_GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      DECAP_SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        default: 'https://insbs.net'
      })
    }
  },

  integrations: [
    sitemap({
      // thanks / compare は noindex のためサイトマップから除外
      filter: (page) => !page.includes('/thanks/') && !page.includes('/compare/')
    })
  ],

  adapter: vercel()
});
