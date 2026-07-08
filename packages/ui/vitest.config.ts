import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Unit tests run in jsdom, so RN primitives are backed by react-native-web.
    alias: {
      'react-native': 'react-native-web',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
