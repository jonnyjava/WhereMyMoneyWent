import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/contexts/*/infrastructure/*.model.ts',
  out: './drizzle',
  // Timestamp prefixes avoid name collisions when several agents each generate a migration.
  migrations: { prefix: 'timestamp' },
});
