/** Consecutive User-agent lines share one rule group (RFC 9309). */
export function parseRobots(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const groups = [];
  let current = null;
  const sitemaps = [];
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const split = line.indexOf(':');
    if (split < 0) continue;
    const key = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (key === 'user-agent') {
      if (current && current.rules.length === 0) {
        current.agents.push(value.toLowerCase());
      } else {
        current = { agents: [value.toLowerCase()], rules: [] };
        groups.push(current);
      }
      continue;
    }
    if (!current) continue;
    if (key === 'allow' || key === 'disallow') {
      current.rules.push({ allow: key === 'allow', path: value });
    }
  }
  const own = groups.filter((group) => group.agents.some((agent) => agent.split('/')[0] === 'worthitbot'));
  const chosen = own.length > 0 ? own : groups.filter((group) => group.agents.includes('*'));
  return { rules: chosen.flatMap((group) => group.rules), sitemaps };
}

export function isAllowed(target, robots) {
  const path = targetPath(target);
  let winner = null;
  for (const rule of robots.rules) {
    if (!rule.path) continue;
    if (!ruleMatches(rule.path, path)) continue;
    if (!winner || rule.path.length > winner.path.length || (rule.path.length === winner.path.length && rule.allow && !winner.allow)) {
      winner = rule;
    }
  }
  return winner ? winner.allow : true;
}

function ruleMatches(rule, path) {
  if (rule.includes('*') || rule.endsWith('$')) {
    const end = rule.endsWith('$');
    const body = end ? rule.slice(0, -1) : rule;
    const source = `^${body.split('*').map(escapeRegex).join('.*')}${end ? '$' : ''}`;
    return new RegExp(source).test(path);
  }
  return path.startsWith(rule);
}

function targetPath(target) {
  if (!target.startsWith('http')) return target;
  const url = new URL(target);
  return `${url.pathname}${url.search}`;
}

function escapeRegex(value) {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}
