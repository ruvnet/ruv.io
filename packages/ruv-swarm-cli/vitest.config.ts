import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__test__/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'target'],
  },
})
