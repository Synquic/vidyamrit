// import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()
  //   , VitePWA({
  //   strategies: 'injectManifest',   // Service Worker strategy, generateSw generates sw.js completely automatically, injectManifest will compile YOUR CUSTOM sw and inject precached manifest into it.
  //   srcDir: 'src',
  //   filename: 'sw.ts',
  //   registerType: 'autoUpdate', //plugin option with autoUpdate or prompt (default strategy) value.
  //   injectRegister: false,

  //   pwaAssets: {
  //     disabled: false,
  //     config: true,
  //   },

  //   manifest: {
  //     name: 'vidyamrit',
  //     short_name: 'vidyamrit',
  //     description: 'VidyamritLiteracy. Learning. Livelihood.Empowering India\'s underserved children from the fundamentals to the future. Vidyamrit prepares every child with essential skills, genuine opportunity, and unshakeable confidence to excel in life.',
  //     theme_color: '#e17100',
  //   },

  //   injectManifest: {
  //     globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
  //   },

  //   devOptions: { 
  //     enabled: true, //The service worker on development will be only available if the enable development option is true.
  //     navigateFallback: 'index.html',
  //     suppressWarnings: true,
  //     type: 'module',
  //   },
  // })
],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})