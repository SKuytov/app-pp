import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';

const isDev = process.env.NODE_ENV !== 'production';

let inlineEditPlugin, editModeDevPlugin;
if (isDev) {
  inlineEditPlugin = (await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js')).default;
  editModeDevPlugin = (await import('./plugins/visual-editor/vite-plugin-edit-mode.js')).default;
}

const configHorizonsViteErrorHandler = `
// ...existing error handler scripts...
`;

const addTransformIndexHtml = {
  name: 'add-transform-index-html',
  transformIndexHtml(html) {
    const tags = [
      {
        tag: 'script',
        attrs: { type: 'module' },
        children: configHorizonsViteErrorHandler,
        injectTo: 'head',
      },
      // ...other tags...
    ];
    return { html, tags };
  }
};

const logger = createLogger();
const originalLoggerError = logger.error;
logger.error = (msg, options) => {
  if (!options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
    originalLoggerError(msg, options);
  }
};

export default defineConfig({
  customLogger: logger,
  plugins: [
    ...(isDev ? [inlineEditPlugin(), editModeDevPlugin()] : []),
    react(),
    addTransformIndexHtml
  ],
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    cors: true,
    headers: { 'Cross-Origin-Embedder-Policy': 'credentialless' },
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      external: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types'
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          charts: ['recharts', 'react-chartjs-2']
        }
      }
    }
  }
});