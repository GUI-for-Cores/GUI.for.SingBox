import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/src/bridge/wailsjs/**'],
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@wails': fileURLToPath(new URL('./src/bridge/wailsjs', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  build: {
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4096, // 4MB
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            { name: 'vue', test: /node_modules\/vue/ },
            { name: 'codemirror', test: /node_modules\/@codemirror/ },
            { name: 'prettier', test: /node_modules\/prettier/ },
            { name: 'vendor', test: /node_modules/ },
            { name: 'index' },
          ],
        },
      },
    },
  },
})
