/**
 * Minimal implementation of the Cloudflare `_redirects` matching rules, used for the host-scoped
 * entries of redirects.config.json that `_redirects` cannot express.
 *
 * Supported source syntax:
 * - `*` matches any number of characters, including `/`, and is exposed to the target as `:splat`.
 * - `:name` matches exactly one path segment and never matches across `/` or a trailing slash.
 */
export interface RedirectRule {
  from: string;
  to: string;
  status: number;
  host?: string;
}

interface CompiledRule {
  rule: RedirectRule;
  pattern: RegExp;
  /** Placeholder names in capture-group order. */
  params: string[];
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(rule: RedirectRule): CompiledRule {
  const params: string[] = [];
  let pattern = '';
  const tokens = rule.from.matchAll(/(\*)|:([A-Za-z0-9_]+)|([^*:]+)/g);

  for (const [, splat, name, literal] of tokens) {
    if (splat) {
      params.push('splat');
      pattern += '(.*)';
    } else if (name) {
      params.push(name);
      pattern += '([^/]+)';
    } else {
      pattern += escapeRegExp(literal);
    }
  }

  return { rule, pattern: new RegExp(`^${pattern}$`), params };
}

export function createMatcher(rules: RedirectRule[]) {
  const compiled = rules.map(compile);

  return function match(host: string, pathname: string): { to: string; status: number } | undefined {
    for (const { rule, pattern, params } of compiled) {
      if (rule.host && rule.host !== host) continue;
      const found = pattern.exec(pathname);
      if (!found) continue;

      let to = rule.to;
      params.forEach((name, index) => {
        to = to.replace(`:${name}`, found[index + 1] ?? '');
      });
      return { to, status: rule.status };
    }
    return undefined;
  };
}
