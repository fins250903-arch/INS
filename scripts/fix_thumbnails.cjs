const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/data');
const postsPath = path.join(dataDir, 'wp-posts.json');

function normalizeWpImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  return trimmed;
}

function normalizeWpContentImageUrls(html) {
  if (!html || typeof html !== 'string') return '';
  return html;
}

// Read existing posts
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xml'));

let attachments = {}; // id -> url
let postThumbnails = {}; // post_name -> thumbnail_id

for (const file of files) {
  const xml = fs.readFileSync(path.join(dataDir, file), 'utf8');
  
  // Quick and dirty regex parsing to avoid large DOM overhead
  
  // Find attachments
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    
    const idMatch = /<wp:post_id>(\d+)<\/wp:post_id>/.exec(item);
    const typeMatch = /<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/.exec(item);
    const nameMatch = /<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/.exec(item);
    
    if (!idMatch || !typeMatch) continue;
    
    const id = idMatch[1];
    const type = typeMatch[1];
    
    if (type === 'attachment') {
      const urlMatch = /<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/.exec(item);
      if (urlMatch) {
        attachments[id] = urlMatch[1];
      }
    } else if (type === 'post' && nameMatch) {
      const slug = nameMatch[1];
      const metaRegex = /<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/;
      const metaMatch = metaRegex.exec(item);
      if (metaMatch) {
        postThumbnails[slug] = metaMatch[1];
      }
    }
  }
}

// Update posts
let updatedCount = 0;
let normalizedThumbCount = 0;
let normalizedContentCount = 0;
for (const post of posts) {
  const thumbId = postThumbnails[post.slug];
  if (thumbId && attachments[thumbId]) {
    post.thumbnail = normalizeWpImageUrl(attachments[thumbId]);
    updatedCount++;
  }

  const normalizedThumb = normalizeWpImageUrl(post.thumbnail);
  if (post.thumbnail !== normalizedThumb) {
    post.thumbnail = normalizedThumb;
    normalizedThumbCount++;
  }

  const normalizedContent = normalizeWpContentImageUrls(post.content);
  if (post.content !== normalizedContent) {
    post.content = normalizedContent;
    normalizedContentCount++;
  }
}

console.log(`Found ${Object.keys(attachments).length} attachments.`);
console.log(`Found ${Object.keys(postThumbnails).length} post thumbnails.`);
console.log(`Updated ${updatedCount} posts with thumbnail URLs.`);
console.log(`Normalized ${normalizedThumbCount} thumbnail URLs to insbs.net.`);
console.log(`Normalized ${normalizedContentCount} post contents to insbs.net image URLs.`);

fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
