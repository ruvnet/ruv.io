import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__test__/**/*.spec.ts'],
    exclude: ['node_modules', 'target'],
    testTimeout: 30000,
  },
})
