/**
 * Match blog thumbnails to files in src/assets/images (and optional extra dirs),
 * copy into public/blog-images/, and set localImage on wp-posts.json.
 */
const fs = require('fs');
const path = require('path');

const postsPath = path.join(process.cwd(), 'src', 'data', 'wp-posts.json');
const assetsDir = path.join(process.cwd(), 'src', 'assets', 'images');
const outDir = path.join(process.cwd(), 'public', 'blog-images');

const EXTRA_DIRS = (process.env.BLOG_IMAGE_DIRS || '')
  .split(path.delimiter)
  .map((d) => d.trim())
  .filter(Boolean);

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

function normalizeBasename(name) {
  try {
    return decodeURIComponent(String(name || ''))
      .toLowerCase()
      .replace(/_t(?=\.[a-z0-9]+$)/i, '');
  } catch {
    return String(name || '').toLowerCase();
  }
}

function isBlocked(url) {
  const l = String(url).toLowerCase();
  return l.includes('illust4847') || l.includes('hikakutenpo');
}

function basenameFromUrl(url) {
  if (!url) return '';
  try {
    return path.basename(new URL(url).pathname);
  } catch {
    return path.basename(String(url).split('?')[0]);
  }
}

function collectFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, acc);
      continue;
    }
    if (IMAGE_EXT.test(entry.name)) acc.push(full);
  }
  return acc;
}

function buildIndex() {
  const index = new Map();
  const allPaths = [
    ...collectFiles(assetsDir),
    ...EXTRA_DIRS.flatMap((d) => collectFiles(d))
  ];
  for (const filePath of allPaths) {
    const base = path.basename(filePath);
    const key = normalizeBasename(base);
    if (!key || index.has(key)) continue;
    index.set(key, filePath);
  }
  return index;
}

function extractContentUrls(html) {
  const urls = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRe.exec(String(html || '')))) urls.push(m[1]);
  const directRe = /https?:\/\/[^"' \n)]+\/wp-content\/uploads\/[^"' \n)]+/gi;
  while ((m = directRe.exec(String(html || '')))) urls.push(m[0]);
  return urls;
}

function findLocal(index, url) {
  const base = normalizeBasename(basenameFromUrl(url));
  if (!base) return '';
  return index.get(base) || '';
}

const CATEGORY_FALLBACK_FILE = {
  車内で嘔吐: '嘔吐シミダレ-1.jpg',
  '車内の汚れ　お掃除方法': 'シート.jpg',
  車内清掃: 'carclean15kb.jpg',
  Blog: 'images-1-e1756888161530.jpg',
  未分類: 'carclean15kb.jpg'
};

function fallbackPool(index) {
  return Array.from(index.values()).filter((p) => {
    const base = path.basename(p).toLowerCase();
    return !base.includes('logo') && !base.includes('badge') && !base.includes('representative');
  });
}

const REGION_CATEGORIES = new Set([
  '愛知', '兵庫', '福岡', '沖縄', '埼玉', '千葉', '東京', '大阪', '京都', '群馬', '茨城', '滋賀', '静岡'
]);

function pickFromIndex(index, fileName) {
  const key = normalizeBasename(fileName);
  return key ? index.get(key) || '' : '';
}

function pickCategoryFallback(index, post) {
  const cats = post.categories || [];
  for (const cat of cats) {
    const file = CATEGORY_FALLBACK_FILE[cat];
    if (file) {
      const hit = pickFromIndex(index, file);
      if (hit) return hit;
    }
  }
  if (cats.some((c) => REGION_CATEGORIES.has(c))) {
    const regional = pickFromIndex(index, '202604-724x1024.jpg');
    if (regional) return regional;
  }
  const pool = fallbackPool(index);
  if (!pool.length) return '';
  let hash = 0;
  for (const ch of String(post.slug || '')) hash = (hash + ch.charCodeAt(0)) % pool.length;
  return pool[hash];
}

function pickLocalFile(index, post) {
  for (const url of extractContentUrls(post.content)) {
    if (isBlocked(url)) continue;
    const hit = findLocal(index, url);
    if (hit) return hit;
  }
  if (post.thumbnail && !isBlocked(post.thumbnail)) {
    const hit = findLocal(index, post.thumbnail);
    if (hit) return hit;
  }
  return pickCategoryFallback(index, post);
}

function main() {
  if (!fs.existsSync(postsPath)) {
    throw new Error(`Missing ${postsPath}`);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const index = buildIndex();
  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  let ok = 0;
  let skip = 0;

  for (const post of posts) {
    const source = pickLocalFile(index, post);
    if (!source) {
      post.localImage = '';
      skip++;
      continue;
    }
    const ext = path.extname(source).toLowerCase() || '.jpg';
    const destName = `${post.slug}${ext}`;
    const destPath = path.join(outDir, destName);
    fs.copyFileSync(source, destPath);
    post.localImage = `/blog-images/${destName}`;
    ok++;
  }

  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  console.log(
    `Local images: matched=${ok}, no-match=${skip}, index-size=${index.size}, dirs=${[assetsDir, ...EXTRA_DIRS].join(', ')}`
  );
}

main();
