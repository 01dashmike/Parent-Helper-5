import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    output: 'static',
    integrations: [react(), tailwind(), sitemap()],
    site: 'https://your-site-url.com', // Update to your actual site URL
});
