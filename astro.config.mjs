import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: "https://deadning.abura.site",
  integrations: [sitemap()],
  server: {
    host: true,
    port: 4321
  }
});
