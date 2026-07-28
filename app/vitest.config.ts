import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Mirror the `@/*` -> `src/*` path alias from tsconfig.json. Route handlers import
    // via `@/lib/...` like the rest of the app; without this, any test that imports a
    // route module fails to resolve its unmocked imports.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
