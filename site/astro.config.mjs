import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTE: `site` drives canonical URLs, sitemap.xml and Open Graph tags.
// Change this one value if the domain ever changes.
export default defineConfig({
  site: 'https://klicatech.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/stats') })],
  build: { inlineStylesheets: 'auto' },
});
