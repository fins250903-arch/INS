// @ts-check
import { defineConfig } from 'astro/config';


import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://insbs.net',

  integrations: [
    sitemap({
      // thanks / compare は noindex のためサイトマップから除外
      filter: (page) => !page.includes('/thanks/') && !page.includes('/compare/')
    })
  ],

  adapter: vercel()
});