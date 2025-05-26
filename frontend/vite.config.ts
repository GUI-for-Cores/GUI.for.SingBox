import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Components({
      types: [],
      dts: 'src/components/components.d.ts',
      globs: ['src/components/*/index.vue'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@wails': fileURLToPath(new URL('./wailsjs', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 2048, // 2MB
    // __ROLLUP_MANUAL_CHUNKS__
  },
})
