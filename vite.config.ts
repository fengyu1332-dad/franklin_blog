import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors so admin-only and rarely-used deps don't bloat the main bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('micromark') ||
            id.includes('unified') ||
            id.includes('hast-') ||
            id.includes('mdast-') ||
            id.includes('unist-') ||
            id.includes('property-information') ||
            id.includes('decode-named-character-reference') ||
            id.includes('character-entities') ||
            id.includes('comma-separated-tokens') ||
            id.includes('escape-string-regexp') ||
            id.includes('markdown-table') ||
            id.includes('trim-lines') ||
            id.includes('trough') ||
            id.includes('ccount') ||
            id.includes('devlop')
          ) {
            return 'markdown';
          }
          if (id.includes('motion') || id.includes('framer-motion')) return 'motion';
          if (id.includes('react-dom') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('exifr')) return 'exifr';
          return 'vendor';
        },
      },
    },
  },
  server: {
    // HMR is disabled when DISABLE_HMR is set to 'true' (e.g. in AI Studio).
    // Do not modify — file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
