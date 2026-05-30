const fs = require('fs');
const path = require('path');

const postsPath = path.join(process.cwd(), 'src', 'data', 'wp-posts.json');
const outDir = path.join(process.cwd(), 'public', 'blog-images');

const SUBDOMAIN_TO_REGION = { osak: 'osaka', hyg: 'hyougo', siga: 'siga' };

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

function resolveInsbsImageUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) return url;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const host = parsed.hostname.toLowerCase();
  let pathname = parsed.pathname;
  if (host === 'insbs.net' || host === 'www.insbs.net') {
    if (pathname.startsWith('/ok2/')) {
      pathname = `/fukuoka${pathname.slice('/ok2'.length)}`;
    }
    return `https://insbs.net${pathname}${parsed.search}`;
  }
  const subMatch = host.match(/^([a-z0-9-]+)\.insbs\.net$/);
  if (subMatch && pathname.startsWith('/wp1/')) {
    const region = SUBDOMAIN_TO_REGION[subMatch[1]] || subMatch[1];
    pathname = pathname.slice('/wp1'.length);
    return `https://insbs.net/${region}${pathname}${parsed.search}`;
  }
  return url;
}

function pickSourceImage(post) {
  const html = String(post.content || '');
  const fromImg = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || '';
  return (fromImg || post.thumbnail || '').trim();
}

function isBlocked(url) {
  const l = String(url).toLowerCase();
  return l.includes('illust4847') || l.includes('hikakutenpo');
}

async function fetchImage(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; INS-Blog-Cache/1.0)',
      accept: 'image/*,*/*;q=0.8',
      referer: 'https://insbs.net/'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = String(res.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!contentType.startsWith('image/')) throw new Error(`Not image: ${contentType}`);
  const ext = MIME_EXT[contentType] || url.match(/\.([a-z0-9]{3,4})(?:$|[?#])/i)?.[1]?.toLowerCase() || 'jpg';
  return { bytes: Buffer.from(await res.arrayBuffer()), ext };
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  let ok = 0;
  let ng = 0;

  for (const post of posts) {
    const raw = pickSourceImage(post);
    if (!raw || isBlocked(raw)) {
      post.localImage = '';
      ng++;
      continue;
    }
    const resolved = resolveInsbsImageUrl(raw);
    try {
      const { bytes, ext } = await fetchImage(resolved);
      const filename = `${post.slug}-${post.id}.${ext}`;
      fs.writeFileSync(path.join(outDir, filename), bytes);
      post.localImage = `/blog-images/${filename}`;
      ok++;
    } catch (e) {
      post.localImage = '';
      ng++;
      if (ok + ng <= 5) {
        console.log(`fail ${post.slug}: ${e.message} :: ${resolved}`);
      }
    }
  }

  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  console.log(`Cached images: success=${ok}, failed=${ng}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
