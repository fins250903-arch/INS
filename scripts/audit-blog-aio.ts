/**
 * 100-point AIO / internal-link / conversion audit for published blogs.
 * Frontmatter `region` is the source of truth when it differs from the folder name.
 */
import fs from 'node:fs';
import path from 'node:path';
import { AIO_ANSWER_END, AIO_ANSWER_START } from '../src/data/blog-topics.ts';
import { BLOG_REGION_SLUGS } from '../src/data/blog-regions.ts';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');
const LEGACY =
  /https?:\/\/(?:osak|hyg|siga)\.insbs\.net\/wp1\/(?:contact|blog)|https?:\/\/insbs\.net\/ok2\/(?:contact|blog)/i;

type Finding = { file: string; check: string };

function listMarkdownFiles(dir: string, base = dir): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(full, base));
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return files;
}

function parseFrontmatterRegionAndSlug(rel: string, raw: string): { region: string; slug: string } {
  const folderRegion = rel.split('/')[0];
  const fileSlug = path.basename(rel, '.md');
  const quoted = raw.match(/^region:\s*["']([a-z]+)["']/m)?.[1];
  const bare = raw.match(/^region:\s*([a-z]+)\s*$/m)?.[1];
  const value = quoted || bare || folderRegion;
  const region = (BLOG_REGION_SLUGS as string[]).includes(value) ? value : folderRegion;
  return { region, slug: fileSlug };
}

function relatedTargetsExist(raw: string, canonical: Set<string>): { ok: boolean; href?: string } {
  const matches = [...raw.matchAll(/\]\(\/blog\/([a-z0-9-]+)\/([^)/]+)\/\)/g)];
  if (matches.length === 0) return { ok: false };
  for (const match of matches) {
    const href = `/blog/${match[1]}/${match[2]}/`;
    if (!canonical.has(href)) return { ok: false, href };
  }
  return { ok: true };
}

const files = listMarkdownFiles(BLOG_ROOT).filter((rel) => !rel.endsWith('/.md') && rel !== '.md');
const canonical = new Set<string>();
for (const rel of files) {
  const raw = fs.readFileSync(path.join(BLOG_ROOT, rel), 'utf8');
  const parsed = parseFrontmatterRegionAndSlug(rel, raw);
  canonical.add(`/blog/${parsed.region}/${parsed.slug}/`);
}
const findings: Finding[] = [];
const stats = {
  total: files.length,
  aio: 0,
  conclusion: 0,
  earlyTel: 0,
  contact: 0,
  lpHeading: 0,
  relatedBlog: 0,
  pricing: 0,
  conversionCta: 0,
  legacy: 0
};

for (const rel of files) {
  const raw = fs.readFileSync(path.join(BLOG_ROOT, rel), 'utf8');
  const bodyStart = raw.indexOf('\n---', 3);
  const body = bodyStart >= 0 ? raw.slice(bodyStart) : raw;
  const head = body.split('\n').slice(0, 50).join('\n');
  const folderRegion = rel.split('/')[0];
  const { region } = parseFrontmatterRegionAndSlug(rel, raw);

  if (raw.includes(AIO_ANSWER_START) && raw.includes(AIO_ANSWER_END)) stats.aio += 1;
  else findings.push({ file: rel, check: 'missing-aio-block' });

  if (raw.includes('## 結論（先に読む）')) stats.conclusion += 1;
  else findings.push({ file: rel, check: 'missing-conclusion' });

  if (/tel:070-8428-0866/.test(head)) stats.earlyTel += 1;
  else findings.push({ file: rel, check: 'missing-early-tel' });

  if (raw.includes('/contact/')) stats.contact += 1;
  else findings.push({ file: rel, check: 'missing-contact' });

  if (raw.includes(`/${region}/#heading-`) || raw.includes(`/${folderRegion}/#heading-`)) {
    stats.lpHeading += 1;
  } else {
    findings.push({ file: rel, check: 'missing-lp-heading' });
  }

  const related = relatedTargetsExist(raw, canonical);
  if (related.ok) stats.relatedBlog += 1;
  else findings.push({ file: rel, check: related.href ? `broken-related:${related.href}` : 'missing-related-blog' });

  if (raw.includes('#heading-pricing')) stats.pricing += 1;
  else findings.push({ file: rel, check: 'missing-pricing' });

  if (raw.includes('今すぐ') && raw.includes(region === folderRegion ? `/${region}/#heading-pricing` : '#heading-pricing')) {
    stats.conversionCta += 1;
  } else if (raw.includes('今すぐ') && raw.includes('#heading-pricing')) {
    stats.conversionCta += 1;
  } else {
    findings.push({ file: rel, check: 'missing-conversion-cta' });
  }

  if (LEGACY.test(raw)) {
    stats.legacy += 1;
    findings.push({ file: rel, check: 'legacy-url' });
  }
}

const checks: [string, boolean][] = [
  ['aio-block-coverage', stats.aio === stats.total],
  ['conclusion-coverage', stats.conclusion === stats.total],
  ['early-tel-coverage', stats.earlyTel === stats.total],
  ['contact-coverage', stats.contact === stats.total],
  ['lp-heading-coverage', stats.lpHeading === stats.total],
  ['related-blog-coverage', stats.relatedBlog === stats.total],
  ['pricing-coverage', stats.pricing === stats.total],
  ['conversion-cta-coverage', stats.conversionCta === stats.total],
  ['no-legacy-urls', stats.legacy === 0],
  ['has-posts', stats.total >= 180]
];

const passed = checks.filter(([, ok]) => ok).length;
const score = Math.round((passed / checks.length) * 100);

const payload = {
  score,
  passed,
  totalChecks: checks.length,
  stats,
  failedChecks: checks.filter(([, ok]) => !ok).map(([name]) => name),
  sampleFindings: findings.slice(0, 30),
  findingCount: findings.length
};

console.log(JSON.stringify(payload, null, 2));

if (score < 100) process.exitCode = 1;
