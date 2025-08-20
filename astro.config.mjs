import { defineConfig } from 'astro/config';

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: 'https://awcrowe00.github.io',
  base: '/portfolio-project',
  integrations: [svelte()]
});