import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

const base = process.env.VITE_BASE || '/';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-src 'none'",
].join('; ');

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'inject-csp',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          '<!-- CSP_PLACEHOLDER -->',
          `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  preview: {
    port: 4173,
  },
});
