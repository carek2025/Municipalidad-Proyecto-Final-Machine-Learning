import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/ml-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml-api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Configuración CSS forzada
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCase'
      }
    },
    rollupOptions: {
       output: {
         manualChunks: {
           vendor: ['react', 'react-dom'],
           charts: ['recharts'],
           utils: ['date-fns', 'axios']
         },
         // Forzar inclusión de CSS
         assetFileNames: (assetInfo) => {
           if (assetInfo.name && assetInfo.name.endsWith('.css')) {
             return 'assets/index-[hash].css'
           }
           return 'assets/[name]-[hash][extname]'
         }
       }
     }
   },
  // Configuración para producción
  base: '/',
  define: {
    'process.env': {}
  }
})
