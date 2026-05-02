/// <reference types="vitest" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

const NODE_MODULES_SEGMENT = '/node_modules/';
const currentDir = fileURLToPath(new URL('.', import.meta.url));

function normalizeModuleId(id: string): string {
  return id.replace(/\\/g, '/');
}

function getPackageNameFromModuleId(id: string): string | null {
  const normalized = normalizeModuleId(id);
  const nodeModulesIndex = normalized.lastIndexOf(NODE_MODULES_SEGMENT);
  if (nodeModulesIndex < 0) {
    return null;
  }

  const packagePath = normalized.slice(nodeModulesIndex + NODE_MODULES_SEGMENT.length);
  const segments = packagePath.split('/');

  if (segments[0]?.startsWith('@')) {
    return `${segments[0]}/${segments[1] ?? ''}`;
  }

  return segments[0] ?? null;
}

function isWorkspacePackageModule(id: string, packageName: string): boolean {
  return normalizeModuleId(id).includes(`/packages/${packageName}/`);
}

export default defineConfig({
  plugins: [
    react(),
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
      '@': path.resolve(currentDir, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
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
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'https://cgraph-backend-prod-v2.fly.dev',
        changeOrigin: true,
        secure: true,
      },
      '/socket': {
        target: process.env.VITE_DEV_WS_TARGET || 'wss://cgraph-backend-prod-v2.fly.dev',
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
        manualChunks: (id: string): string | undefined => {
          const normalizedId = normalizeModuleId(id);

          if (
            normalizedId.includes('/settings/store/customization/') ||
            normalizedId.includes('/chat/store/')
          ) {
            return 'stores-app';
          }

          if (isWorkspacePackageModule(normalizedId, 'api-client')) {
            return 'api-client';
          }
          if (isWorkspacePackageModule(normalizedId, 'animation-constants')) {
            return 'animation-constants';
          }

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

          const packageName = getPackageNameFromModuleId(normalizedId);
          if (!packageName) {
            return undefined;
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
});
