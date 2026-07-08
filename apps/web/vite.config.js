/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const NODE_MODULES_SEGMENT = '/node_modules/';
const CSP_EXTRA_CONNECT_SOURCES_MARKER = '__CGRAPH_CSP_EXTRA_CONNECT_SOURCES__';
const DEV_TURNSTILE_BYPASS_HEADER = 'x-cgraph-dev-turnstile-bypass';
const BASE_CONNECT_SOURCES = new Set([
  'https://cgraph-backend-prod-v3.fly.dev',
  'wss://cgraph-backend-prod-v3.fly.dev',
]);

function normalizeModuleId(id) {
  return id.replace(/\\/g, '/');
}

function getAbsoluteUrlOrigin(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getCspExtraConnectSources(env) {
  return [
    env.VITE_API_URL,
    env.VITE_SOCKET_URL,
    env.VITE_WS_URL,
    env.VITE_DEV_API_TARGET,
    env.VITE_DEV_WS_TARGET,
  ]
    .map(getAbsoluteUrlOrigin)
    .filter(Boolean)
    .filter((origin) => !BASE_CONNECT_SOURCES.has(origin))
    .filter((origin, index, origins) => origins.indexOf(origin) === index)
    .join(' ');
}

function cspConnectSourcesPlugin(env) {
  return {
    name: 'cgraph-csp-connect-sources',
    transformIndexHtml(html) {
      return html.replace(CSP_EXTRA_CONNECT_SOURCES_MARKER, getCspExtraConnectSources(env));
    },
  };
}

function shouldInjectDevTurnstileBypass(env) {
  return (
    env.VITE_DEV_DISABLE_TURNSTILE === 'true' &&
    typeof env.CGRAPH_DEV_TURNSTILE_BYPASS_TOKEN === 'string' &&
    env.CGRAPH_DEV_TURNSTILE_BYPASS_TOKEN.length > 0
  );
}

function configureApiProxy(proxy, env) {
  if (!shouldInjectDevTurnstileBypass(env)) {
    return;
  }

  proxy.on('proxyReq', (proxyReq) => {
    proxyReq.setHeader(DEV_TURNSTILE_BYPASS_HEADER, env.CGRAPH_DEV_TURNSTILE_BYPASS_TOKEN);
  });
}

function getPackageNameFromModuleId(id) {
  const normalized = normalizeModuleId(id);
  const nodeModulesIndex = normalized.lastIndexOf(NODE_MODULES_SEGMENT);
  if (nodeModulesIndex < 0) {
    return null;
  }

  const packagePath = normalized.slice(nodeModulesIndex + NODE_MODULES_SEGMENT.length);
  const segments = packagePath.split('/');

  if (segments[0] && segments[0].startsWith('@')) {
    return `${segments[0]}/${segments[1] || ''}`;
  }

  return segments[0] || null;
}

function isPublishedCgraphPackageModule(id, packageName) {
  return getPackageNameFromModuleId(id) === `@cgraph-dev/${packageName}`;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const coverageMinimum = Number(env.WEB_COVERAGE_MIN ?? 65);

  return {
    plugins: [
      cspConnectSourcesPlugin(env),
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
    ],
    resolve: {
    alias: {
      // LiveKit ships a single large ESM file; source modules keep the call vendor chunk under budget.
      'livekit-client': path.resolve(__dirname, './node_modules/livekit-client/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
    },
    test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    // Coverage configuration with thresholds (matching mobile at 60%)
    coverage: {
      enabled: true,
      provider: 'v8',
      all: false,
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
        '**/mocks/**',
      ],
      thresholds: {
        statements: coverageMinimum,
        branches: coverageMinimum,
        functions: coverageMinimum,
        lines: coverageMinimum,
      },
    },
    },
    server: {
    port: 3000,
    allowedHosts: ['web.cgraph.org'],
    proxy: {
      '/api': {
        target: env.VITE_DEV_API_TARGET || 'https://cgraph-backend-prod-v3.fly.dev',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => configureApiProxy(proxy, env),
      },
      '/socket': {
        target: env.VITE_DEV_WS_TARGET || 'wss://cgraph-backend-prod-v3.fly.dev',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
    },
    build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          const normalizedId = normalizeModuleId(id);

          // Keep store barrels and implementations in one chunk to avoid execution-order issues.
          if (
            normalizedId.includes('/settings/store/customization/') ||
            normalizedId.includes('/chat/store/')
          ) {
            return 'app-runtime';
          }

          // Published shared packages that heavily contribute to common index chunks.
          if (isPublishedCgraphPackageModule(normalizedId, 'api-client')) {
            return 'api-client';
          }
          if (isPublishedCgraphPackageModule(normalizedId, 'animation-constants')) {
            return 'animation-constants';
          }

          // Conversation-heavy UI slices.
          if (normalizedId.includes('/src/modules/chat/components/message-bubble/')) {
            return 'chat-message-bubble';
          }
          if (normalizedId.includes('/src/modules/chat/components/chat-info-panel/')) {
            return 'chat-info-panel';
          }
          if (normalizedId.includes('/src/modules/chat/components/audio/')) {
            return 'chat-audio';
          }
          if (normalizedId.includes('/src/modules/chat/components/rich-media-embed')) {
            return 'chat-media-embed';
          }
          if (normalizedId.includes('/src/modules/') && normalizedId.includes('/store/')) {
            return 'app-runtime';
          }
          if (normalizedId.includes('/src/lib/socket/')) {
            return 'app-runtime';
          }
          if (normalizedId.includes('/src/layouts/app-layout/')) {
            return 'app-runtime';
          }
          if (normalizedId.includes('/src/modules/auth/components/auth-effects/')) {
            return 'auth-effects';
          }
          if (
            normalizedId.includes('/src/lib/theme/') ||
            normalizedId.includes('/src/providers/theme-enhanced/')
          ) {
            return 'app-runtime';
          }
          if (normalizedId.includes('/src/lib/security/')) {
            return 'security-utils';
          }
          if (normalizedId.includes('/src/lib/store-helpers/')) {
            return 'store-helpers';
          }
          if (
            normalizedId.includes('/src/data/titlesCollection') ||
            normalizedId.includes('/src/data/profileThemes') ||
            normalizedId.includes('/src/data/avatar-borders')
          ) {
            return 'profile-catalogs';
          }
          if (normalizedId.includes('/src/lib/animation-presets/')) {
            return 'animation-presets';
          }
          if (normalizedId.includes('/src/lib/animations/animation-engine')) {
            return 'animation-engine';
          }
          const packageName = getPackageNameFromModuleId(normalizedId);
          if (!packageName) {
            return undefined;
          }

          if (
            packageName === 'i18next' ||
            packageName.startsWith('i18next-') ||
            packageName === 'react-i18next' ||
            packageName === 'intl-messageformat' ||
            packageName.startsWith('@formatjs/')
          ) {
            return 'i18n';
          }

          if (packageName === 'react-hot-toast' || packageName === 'goober') {
            return 'toast-vendor';
          }

          if (
            packageName === 'tailwind-merge' ||
            packageName === 'clsx' ||
            packageName === 'class-variance-authority'
          ) {
            return 'style-utils';
          }

          if (
            packageName === 'react' ||
            packageName === 'react-dom' ||
            packageName === 'scheduler'
          ) {
            return 'react-vendor';
          }

          if (packageName === 'react-router' || packageName === 'react-router-dom') {
            return 'router';
          }

          if (packageName.startsWith('@radix-ui/')) {
            return 'radix-ui';
          }

          if (packageName === '@headlessui/react') {
            return 'headless-ui';
          }

          if (
            packageName === 'framer-motion' ||
            packageName === 'motion-dom' ||
            packageName === 'motion-utils'
          ) {
            return 'animation-motion';
          }

          if (packageName === 'gsap') {
            return 'animation-gsap';
          }

          if (
            packageName === '@tanstack/react-query' ||
            packageName === '@tanstack/query-core' ||
            packageName === '@tanstack/query-sync-storage-persister' ||
            packageName === '@tanstack/query-persist-client-core'
          ) {
            return 'tanstack-query';
          }

          if (
            packageName === '@tanstack/react-virtual' ||
            packageName === '@tanstack/virtual-core'
          ) {
            return 'tanstack-virtual';
          }

          if (packageName === 'zustand') {
            return 'state';
          }

          if (
            packageName === 'react-markdown' ||
            packageName.startsWith('remark-') ||
            packageName.startsWith('rehype-') ||
            packageName === 'unified' ||
            packageName.startsWith('mdast') ||
            packageName.startsWith('hast') ||
            packageName.startsWith('micromark')
          ) {
            return 'markdown';
          }

          if (packageName === 'date-fns') {
            return 'utils-date';
          }

          if (packageName === 'lodash' || packageName === 'lodash-es') {
            return 'utils-lodash';
          }

          if (packageName === 'lucide-react' || packageName === '@heroicons/react') {
            return 'icons';
          }

          if (packageName === 'recharts' || packageName === 'recharts-scale') {
            return 'charts-recharts';
          }

          if (
            packageName.startsWith('d3-') ||
            packageName === 'd3' ||
            packageName === 'internmap' ||
            packageName === 'delaunator' ||
            packageName === 'robust-predicates'
          ) {
            return 'charts-d3';
          }

          if (packageName === 'victory-vendor' || packageName.startsWith('victory-')) {
            return 'charts-victory';
          }

          if (
            packageName === 'viem' ||
            packageName === 'wagmi' ||
            packageName.startsWith('@wagmi/') ||
            packageName === 'mipd'
          ) {
            return 'web3';
          }

          if (
            packageName === '@sentry/core' ||
            packageName === '@sentry/browser' ||
            packageName === '@sentry/react' ||
            packageName.startsWith('@sentry-internal/')
          ) {
            return 'sentry';
          }

          if (packageName === 'dompurify') {
            return 'sanitize';
          }

          if (packageName === 'axios') {
            return 'http';
          }

          if (packageName === 'phoenix') {
            return 'socket';
          }

          if (packageName.startsWith('@opentelemetry/')) {
            return 'tracing';
          }

          if (packageName === 'livekit-client') {
            return 'livekit';
          }

          if (packageName.startsWith('@use-gesture/')) {
            return 'gesture';
          }

          if (packageName === 'lottie-web') {
            return 'lottie-web';
          }

          return undefined;
        },
      },
    },
    },
  };
});
