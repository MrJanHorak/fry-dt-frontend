import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'
  const isAnalyze = process.env.ANALYZE_BUNDLE === 'true'

  return {
    server: {
      allowedHosts: ['.localhost'],
      host: true,
      port: 3001
    },
    plugins: [
      react(),
      // Bundle analyzer for production builds
      ...(isAnalyze
        ? [
            {
              name: 'bundle-analyzer',
              generateBundle() {
                if (isProduction) {
                  import('vite-bundle-analyzer').then(
                    ({ default: analyzer }) => {
                      analyzer()
                    }
                  )
                }
              }
            }
          ]
        : [])
    ],

    // Build optimization
    build: {
      outDir: 'dist',
      sourcemap: !isProduction || process.env.GENERATE_SOURCEMAP === 'true',
      minify: isProduction ? 'terser' : false,
      target: 'es2018',

      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            icons: ['react-icons'],
            socket: ['socket.io-client'],

            // Feature chunks
            qr: ['react-qr-code', 'react-qr-reader'],
            speech: ['react-speech-kit'],
            ui: ['react-select', 'react-collapsible']
          },

          // Asset naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()
              : 'chunk'
            return `js/${facadeModuleId}-[hash].js`
          },
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.').pop()
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `images/[name]-[hash][extname]`
            }
            if (/css/i.test(extType)) {
              return `css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
        }
      },

      // Terser options for production
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug']
            },
            mangle: {
              safari10: true
            },
            format: {
              comments: false
            }
          }
        : undefined,

      // Chunk size warnings
      chunkSizeWarningLimit: 1000
    },

    // Environment-specific settings
    define: {
      __DEV__: !isProduction,
      __STAGING__: isStaging,
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@services': resolve(__dirname, 'src/services'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@contexts': resolve(__dirname, 'src/contexts'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@styles': resolve(__dirname, 'src/styles')
      }
    },

    // CSS optimization
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    },

    // Performance optimizations
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'socket.io-client'],
      exclude: ['@vite/client', '@vite/env']
    },

    // Preview server config
    preview: {
      port: 3000,
      host: true
    }
  }
})
