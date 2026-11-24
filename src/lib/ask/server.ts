/**
 * Entry built by `vite build --ssr` into api-build/server.js, so the serverless function gets
 * the site's data bundled (the feeds are loaded with import.meta.glob, which only Vite resolves).
 */
import { modelFromEnv } from './claude';
import { makeHandler } from './handler';

let handler: ((request: Request) => Promise<Response>) | null = null;

export async function handleAsk(request: Request): Promise<Response> {
  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
  if (!handler) handler = makeHandler(await modelFromEnv(env));
  return handler(request);
}
