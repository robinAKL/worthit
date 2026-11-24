import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serves POST /api/ask in `npm run dev` with the same handler the Vercel function uses.
 * Without AI_GATEWAY_API_KEY it answers 503 unless WORTHIT_ASK_MOCK=1 (canned preview replies).
 */
function askApi(): Plugin {
  return {
    name: 'worthit-ask-api',
    configureServer(server) {
      server.middlewares.use('/api/ask', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request(`http://localhost${req.url ?? ''}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const mod = await server.ssrLoadModule('/src/lib/ask/server.ts');
        const response: Response = await mod.handleAsk(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), askApi()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as never);
