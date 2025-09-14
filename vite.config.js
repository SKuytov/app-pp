import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig, loadEnv } from 'vite';

const isDev = process.env.NODE_ENV !== 'production';

// Enhanced error handling for production
const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const addedNode of mutation.addedNodes) {
      if (
        addedNode.nodeType === Node.ELEMENT_NODE &&
        (
          addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
          addedNode.classList?.contains('backdrop')
        )
      ) {
        handleViteOverlay(addedNode);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

function handleViteOverlay(node) {
  if (!node.shadowRoot) return;

  const backdrop = node.shadowRoot.querySelector('.backdrop');
  if (backdrop) {
    const overlayHtml = backdrop.outerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(overlayHtml, 'text/html');
    const messageBodyElement = doc.querySelector('.message-body');
    const fileElement = doc.querySelector('.file');
    const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
    const fileText = fileElement ? fileElement.textContent.trim() : '';
    const error = messageText + (fileText ? ' File:' + fileText : '');

    window.parent.postMessage({
      type: 'horizons-vite-error',
      error,
    }, '*');
  }
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
  const errorDetails = errorObj ? JSON.stringify({
    name: errorObj.name,
    message: errorObj.message,
    stack: errorObj.stack,
    source,
    lineno,
    colno,
  }) : null;

  window.parent.postMessage({
    type: 'horizons-runtime-error',
    message,
    error: errorDetails
  }, '*');
};

window.addEventListener('unhandledrejection', (event) => {
  window.parent.postMessage({
    type: 'horizons-promise-rejection',
    reason: event.reason?.toString() || 'Unknown promise rejection'
  }, '*');
});
`;

const configHorizonsConsoleErrorHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);

  let errorString = '';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg instanceof Error) {
      errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
      break;
    }
  }

  if (!errorString) {
    errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  }

  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'horizons-console-error',
      error: errorString
    }, '*');
  }
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const url = args[0] instanceof Request ? args[0].url : args[0];

  // Skip WebSocket URLs and relative paths
  if (url.startsWith('ws:') || url.startsWith('wss:') || url.startsWith('/')) {
    return originalFetch.apply(this, args);
  }

  return originalFetch.apply(this, args)
    .then(async response => {
      const contentType = response.headers.get('Content-Type') || '';
      const isDocumentResponse = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');

      if (!response.ok && !isDocumentResponse) {
        const responseClone = response.clone();
        try {
          const errorFromRes = await responseClone.text();
          const requestUrl = response.url;
          console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
        } catch (e) {
          console.error(\`Fetch error from \${response.url}: \${response.status} \${response.statusText}\`);
        }
      }

      return response;
    })
    .catch(error => {
      if (!url.match(/\\.html?$/i)) {
        console.error('Fetch error:', error);
      }
      throw error;
    });
};
`;

const addTransformIndexHtml = {
  name: 'add-transform-index-html',
  transformIndexHtml(html, ctx) {
    const env = loadEnv(ctx.command === 'build' ? 'production' : 'development', process.cwd(), '');
    
    const tags = [
      {
        tag: 'script',
        attrs: { type: 'module' },
        children: configHorizonsRuntimeErrorHandler,
        injectTo: 'head',
      },
      {
        tag: 'script',
        attrs: { type: 'module' },
        children: configHorizonsConsoleErrorHandler,
        injectTo: 'head',
      },
      {
        tag: 'script',
        attrs: { type: 'module' },
        children: configWindowFetchMonkeyPatch,
        injectTo: 'head',
      }
    ];

    if (isDev) {
      tags.push({
        tag: 'script',
        attrs: { type: 'module' },
        children: configHorizonsViteErrorHandler,
        injectTo: 'head',
      });
    }

    // Add performance monitoring in production
    if (!isDev && env.VITE_ENABLE_ANALYTICS === 'true') {
      tags.push({
        tag: 'script',
        attrs: { type: 'module' },
        children: `
          // Performance monitoring
          if ('performance' in window && 'observe' in window.PerformanceObserver.prototype) {
            const observer = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                if (entry.entryType === 'navigation') {
                  console.log('Page load time:', entry.loadEventEnd - entry.fetchStart, 'ms');
                }
                if (entry.entryType === 'largest-contentful-paint') {
                  console.log('LCP:', entry.startTime, 'ms');
                }
              });
            });
            observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
          }
        `,
        injectTo: 'head',
      });
    }

    return {
      html,
      tags,
    };
  },
};

// Enhanced logger with error filtering
const logger = createLogger();
const loggerError = logger.error;

logger.error = (msg, options) => {
  // Filter out known non-critical errors
  const ignoredErrors = [
    'CssSyntaxError: [postcss]',
    'sourcemap for',
    'Failed to resolve import'
  ];
  
  if (ignoredErrors.some(error => msg.includes(error))) {
    return;
  }
  
  loggerError(msg, options);
};

// Suppress non-critical warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  const ignoredWarnings = [
    'punycode',
    'deprecated',
    'sourcemap'
  ];
  
  if (!ignoredWarnings.some(warning => message.includes(warning))) {
    originalWarn.apply(console, args);
  }
};

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    customLogger: logger,
    
    plugins: [
      react({
        // React Fast Refresh configuration
        fastRefresh: true,
        babel: {
          plugins: isProduction ? [] : [
            // Add development-only babel plugins here
          ]
        }
      }),
      addTransformIndexHtml
    ],

    // Development server configuration
    server: {
      port: 3000,
      host: true,
      cors: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
      allowedHosts: true,
      // Proxy configuration for API calls
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },

    // Path resolution
    resolve: {
      extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },

    // Build configuration
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      
      // Rollup options for optimization
      rollupOptions: {
        external: [
          '@babel/parser',
          '@babel/traverse', 
          '@babel/generator',
          '@babel/types'
        ],
        output: {
          // Code splitting for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
            charts: ['recharts'],
            utils: ['date-fns', 'uuid', 'clsx']
          },
          // Asset naming for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },

      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
      } : {},

      // Asset handling
      assetsInlineLimit: 4096, // 4kb
      
      // CSS code splitting
      cssCodeSplit: true,
    },

    // CSS configuration
    css: {
      postcss: {
        plugins: []
      },
      devSourcemap: !isProduction,
    },

    // Optimization configuration
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'zod',
        'react-hook-form',
        '@hookform/resolvers'
      ],
      exclude: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator', 
        '@babel/types'
      ]
    },

    // Preview server configuration (for production testing)
    preview: {
      port: 4173,
      host: true,
      cors: true,
    },

    // ESBuild configuration
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
  };
});