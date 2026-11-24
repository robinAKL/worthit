# ADR: how WorthIt collects data

Status: accepted, 2026-11-24. Owner: Claude (T-20). Verifier: Grok.

## Decision

Keep our own small collector core in `scripts/collect/core/` (no new dependency) and put each site in one adapter file under `scripts/collect/adapters/`. The adapter shape follows Crawlee's router idea (URL tests plus a page handler), so a later move to Crawlee stays cheap.

The reason is control, not size. Our compliance rules must hold for every site with no option to turn them off. The popular frameworks are built to keep crawling when a site pushes back, and we want the opposite.

## Options compared

Star counts are from the GitHub API on 2026-11-24.

| Project | Stars | Licence | Language | robots.txt | Sitemaps | Pacing | What happens on 403 / 429 |
|---|---:|---|---|---|---|---|---|
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | 208,243 | AGPL-3.0 | TypeScript | Hosted service decides | Yes | Hosted | Hosted service; we cannot audit or pin the behaviour |
| [microsoft/playwright](https://github.com/microsoft/playwright) | 100,938 | Apache-2.0 | TypeScript | None (browser automation, not a crawler) | No | No | Up to us |
| [puppeteer/puppeteer](https://github.com/puppeteer/puppeteer) | 95,896 | Apache-2.0 | TypeScript | None | No | No | Up to us |
| [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | 87,739 | Apache-2.0 | Python | Optional | Yes | Yes | Built for LLM extraction; Python only |
| [scrapy/scrapy](https://github.com/scrapy/scrapy) | 65,554 | BSD-3-Clause | Python | `ROBOTSTXT_OBEY` setting | Yes | `DOWNLOAD_DELAY`, AutoThrottle | Retry middleware retries 429 by default |
| [apify/crawlee](https://github.com/apify/crawlee) | 26,530 | Apache-2.0 | TypeScript | `respectRobotsTxtFile`, **default false** | Yes | `sameDomainDelaySecs`, default 0 | `blockedStatusCodes` default `[401, 403, 429]` retire the session and retry (`maxRequestRetries` default 3); `retryOnBlocked` exists to "bypass any detected bot protection" |
| [gocolly/colly](https://github.com/gocolly/colly) | 25,608 | Apache-2.0 | Go | Yes | Partial | `LimitRule` | Up to us |
| Our core | n/a | repo | JS (Node) | Always on, RFC 9309 groups | Yes | Fixed 2 s floor, concurrency 1 | Stop the site for the rest of the run, no retry |

The Crawlee rows come from its source (`packages/basic-crawler/src/internals/basic-crawler.ts`, read 2026-11-24).

### Why not Crawlee now

Crawlee is the closest fit: it is TypeScript, maintained, and has sitemap and robots helpers. But compliance there is opt-in. robots.txt is ignored unless a flag is set, and a 403 or 429 by default rotates the session and tries again. Using it safely means turning off several defaults and trusting that no later version turns them back on. For about 20 sites and a few hundred pages a run, about 300 lines of our own code are easier to audit than that configuration.

### Why not Scrapy or crawl4ai

Both are Python. The repo, its tests and its types are TypeScript and Node, so a second runtime would double the toolchain. crawl4ai is aimed at feeding pages to an LLM, which we do not need for structured listings.

### Why not Firecrawl

It is a hosted or AGPL service. Pages would pass through a third party, and its fetch behaviour is outside our control.

### When to revisit

- **A site we may collect renders listings only with JavaScript.** Add Playwright behind `core/session.mjs` as a second fetch implementation. The same gate (robots, origin, pacing, stop) stays in front of it.
- **We pass about 100 sites, or need scheduled distributed runs.** Re-evaluate Crawlee with `respectRobotsTxtFile: true`, `maxConcurrency: 1`, `sameDomainDelaySecs: 2`, `maxRequestRetries: 0`, `useSessionPool: false`, and a `failedRequestHandler` that stops the domain.

## What the core guarantees

All of this is in `scripts/collect/core/` and is covered by `src/lib/collectCore.test.ts` and `src/lib/collect.test.ts`. An adapter cannot change any of it.

| Rule | Where |
|---|---|
| robots.txt is read first. If it fails, the site is skipped for the run. | `session.loadRobots` |
| robots.txt follows RFC 9309: consecutive `User-agent` lines share one group, every `*` group is merged, and a `WorthItBot` group wins. | `robots.mjs` |
| Every request is same-origin and allowed by robots. The URL is checked again after redirects. | `session.get`, `session.permits` |
| At least 2 seconds between requests to one site, and one request in flight. A lower interval throws. | `session.mjs`, `policy.mjs` |
| A 403, 429 or challenge page stops the site for the rest of the run, with no retry. | `policy.stopReason`, `session` |
| At most 200 rows per site per run. The pilot default is 50. | `policy.runCap`, `sites.json` |
| User-Agent is `WorthItBot/0.1 (+contact)`. The runner refuses to run without a contact. | `run.mjs`, `sites.json` |
| Only whitelisted facts are kept. Images, descriptions, reviews and seller details are dropped. A VIN or plate becomes a one-way `dedupeKey`. | `facts.mjs` |
| Vehicle rows without make, model, year, price or an https URL are skipped. | `facts.vehicleProblems` |
| An adapter that sets `fetch`, `headers`, `userAgent`, `minIntervalMs`, `concurrency`, `proxy` or `cookies` is rejected. | `runner.checkAdapter` |

Adapters receive HTML strings only. They never get `fetch` or the session.

## Layout

```text
scripts/collect/
  core/
    session.mjs     the only network access: robots, origin, pacing, stop
    robots.mjs      RFC 9309 parser and matcher
    policy.mjs      2 s floor, run cap, stop detection
    discover.mjs    sitemaps, then listing pages, through the session
    facts.mjs       product and vehicle whitelists, vehicle validation, dedupeKey
    runner.mjs      runAdapter: robots, discover, fetch, extract, whitelist
    extract/jsonld.mjs   JSON-LD Product and Car/Vehicle extraction
  adapters/
    _template.mjs   copy this
    index.mjs       registry
    ascent.mjs, baby-factory.mjs
  run.mjs           CLI
  sites.json        global settings: user agent, pacing, caps
  collect.mjs, robots.mjs, policy.mjs, jsonld.mjs   re-exports for older imports
```

Output goes to `src/data/feeds/<id>.json` for products (validated by `parseFeed`) and `src/data/feeds/cars/<id>.json` for vehicles (`{ "vehicles": Vehicle[] }`, see `src/lib/types.ts`).

## Adding a site in five steps

1. **Check the rules.** Read the site's live robots.txt and terms, and record the result in `docs/crawl-allowlist*.md`. If robots blocks the detail pages, still add the adapter with `enabled: false` and a `disabledReason`.
2. **Copy the template.** Copy `adapters/_template.mjs` to `adapters/<id>.mjs`. Set `id`, `name`, `origin` and `kind`. Write `isDetailUrl`, and if the sitemap lists only category pages, also write `isListingUrl` and `linksFromListing`.
3. **Write `extract`.** Start with the default JSON-LD extractor. If the page has none, read facts from the HTML. Return raw rows; the core whitelists them.
4. **Register and test.** Add the adapter to `adapters/index.mjs`. Add a parser test using a saved page from `src/lib/__fixtures__/`, with descriptions and personal details deleted from the fixture. Run `npm test`.
5. **Pilot run.** Run `node scripts/collect/run.mjs --site=<id> --limit=30`. Record the request, skip and error counts in the task, and check the output file before committing it.

## Migration check

The T-17 collector and this core were each run on the same recorded responses: one live run on 2026-11-24, 110 responses, replayed offline. The output was byte-identical. Ascent gave 49 rows from 54 requests, with 0 skipped and 1 error. Baby Factory gave 35 rows from 56 requests, with 7 skipped and 8 errors.
