/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production only (Vite injects inline styles in dev): see security-context.md.
const CSP = "default-src 'self'; media-src 'self' blob:; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; worker-src 'self' blob:"
const productionCsp = () => ({
  name: 'production-csp',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
})

// https://vite.dev/config/
// GitHub Pages serves the app from /<repo>/, so the deploy workflow sets VITE_BASE.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), productionCsp()],
})
