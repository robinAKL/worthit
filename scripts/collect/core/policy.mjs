export const MIN_INTERVAL_MS = 2000;
export const MAX_PRODUCTS_PER_RUN = 200;
export const USER_AGENT = 'WorthItBot/0.1 (+https://github.com/robinAKL/worthit)';

export function waitMs(lastAt, now, minInterval = MIN_INTERVAL_MS) {
  if (!lastAt) return 0;
  return Math.max(0, minInterval - (now - lastAt));
}

export function runCap(requested, hardCap = MAX_PRODUCTS_PER_RUN) {
  const count = Number(requested);
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.min(Math.floor(count), hardCap);
}

/** 403, 429, or a challenge page stops the site. There is no second client. */
export function stopReason(status, body) {
  if (status === 403 || status === 429) return `HTTP ${status}`;
  const text = String(body ?? '');
  const sample = text.slice(0, 8000);
  if (/<(urlset|sitemapindex)\b/i.test(sample)) return '';
  if (/cf-challenge|cf-turnstile/i.test(sample)) return 'captcha';
  if (/just a moment|verify you are human/i.test(sample) && !/<title>[^<]{8,}<\/title>/i.test(text.slice(0, 4000))) {
    return 'captcha';
  }
  // A captcha wall is a short challenge page. A normal shop page can load recaptcha.js.
  if (/g-recaptcha|recaptcha/i.test(sample) && text.length < 2500) return 'captcha';
  return '';
}
