const fs = require('fs');
const path = require('path');

const postsPath = path.join(process.cwd(), 'src', 'data', 'wp-posts.json');
const outPath = path.join(process.cwd(), 'thumbnail-audit.csv');

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

const firstImageFromContent = (html = '') => {
  const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || '';
};

const escapeCsv = (value) => {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;
};

const header = [
  'slug',
  'title',
  'thumbnail',
  'first_content_image',
  'chosen_image_for_card',
  'is_fallback_only'
];

const rows = posts.map((post) => {
  const firstContent = firstImageFromContent(post.content);
  const chosen = firstContent || post.thumbnail || '';
  return [
    post.slug,
    post.title,
    post.thumbnail || '',
    firstContent,
    chosen,
    chosen ? 'false' : 'true'
  ];
});

const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
fs.writeFileSync(outPath, `${csv}\n`, 'utf8');

const uniqueChosen = new Set(rows.map((r) => r[4]).filter(Boolean)).size;
const fallbackOnly = rows.filter((r) => r[5] === 'true').length;
console.log(`Wrote: ${outPath}`);
console.log(`Rows: ${rows.length}`);
console.log(`Unique chosen images: ${uniqueChosen}`);
console.log(`Fallback-only posts: ${fallbackOnly}`);
