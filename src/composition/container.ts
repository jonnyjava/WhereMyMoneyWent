import 'server-only';
import { createContainer, type Container } from './create-container';

// Cached on globalThis so Next.js hot reload does not open a new connection
// pool and duplicate event subscriptions on every edit in development.
const globalForContainer = globalThis as unknown as { __appContainer?: Container };

export function getContainer(): Container {
  if (!globalForContainer.__appContainer) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required');
    globalForContainer.__appContainer = createContainer({ databaseUrl });
  }
  return globalForContainer.__appContainer;
}
