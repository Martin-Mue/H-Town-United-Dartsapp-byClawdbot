import { createApp } from './app.js';

/** Starts the HTTP API server for local development and production runtime. */
async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen({ port: 8080, host: '0.0.0.0' });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
