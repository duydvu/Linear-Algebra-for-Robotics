// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const isGitHubPages = !!process.env.GITHUB_ACTIONS;

// https://astro.build/config
export default defineConfig({
  site: isGitHubPages ? 'https://linear-algebra-for-robotics.kysuai.com' : undefined,
  base: '/',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
    })
  ]
});