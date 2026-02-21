import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'native-modules-fix',
        transform(code, id) {
          if (id.includes('node_modules') && id.endsWith('.js') && (id.includes('expo-av') || id.includes('react-native'))) {
            return {
              code: code
                .replace(/import type {/g, 'import {')
                .replace(/import type /g, 'import ')
                .replace(/export type /g, 'export ')
                .replace(/import typeof /g, '// import typeof ')
                .replace(/<([A-Z][a-zA-Z0-9]*)/g, 'React.createElement($1')
                .replace(/\/>/g, ', null)')
                .replace(/ as ReactNativePublicAPI/g, '')
                .replace(/opaque\s+type/g, 'type'),
              map: null
            };
          }
          return null;
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'global': 'window',
      '__DEV__': mode !== 'production',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react-native': path.resolve(__dirname, './src/web-stubs.jsx'),
        'expo-av': path.resolve(__dirname, './src/web-stubs.jsx'),
      }
    },
    optimizeDeps: {
      exclude: ['react-native', 'expo-av', 'react-native-safe-area-context', 'react-native-screens'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
