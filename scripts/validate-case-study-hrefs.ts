import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'src/data');
const postsFile = path.join(dataDir, 'wp-posts.json');
const caseStudiesFile = path.join(dataDir, 'lp-region-case-studies.ts');

// Load posts
const posts: Array<{ slug: string; title: string }> = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
const slugToPostMap = new Map(posts.map(p => [p.slug, p]));

// Load case studies file
let caseStudiesContent = fs.readFileSync(caseStudiesFile, 'utf-8');
const originalContent = caseStudiesContent;

// Find all href patterns: href: '/blog/slug/'
const hrefPattern = /href:\s*['"]\/blog\/([^/']+)\/['"]/g;

let matches;
const failedRefs: Array<{ href: string; slug: string; found: boolean }> = [];

while ((matches = hrefPattern.exec(caseStudiesContent)) !== null) {
  const slug = matches[1];
  const found = slugToPostMap.has(slug);
  
  if (!found) {
    console.warn(`⚠ Broken ref: /blog/${slug}/`);
    failedRefs.push({ href: matches[0], slug, found: false });
  } else {
    console.log(`✓ /blog/${slug}/ → ${slugToPostMap.get(slug)?.title}`);
  }
}

if (failedRefs.length > 0) {
  console.error(`\n❌ Found ${failedRefs.length} broken references!`);
  failedRefs.forEach(ref => {
    console.error(`  - ${ref.slug}: ${ref.href}`);
  });
  process.exit(1);
} else {
  console.log(`\n✓ All ${posts.length} blog posts are valid, all href references are correct!`);
}
