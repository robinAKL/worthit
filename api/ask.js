// Vercel function for POST /api/ask. The logic lives in src/lib/ask and is bundled with the
// site's data into api-build/server.js by `npm run build` (vite build --ssr).
import { handleAsk } from '../api-build/server.js';

export async function POST(request) {
  return handleAsk(request);
}
