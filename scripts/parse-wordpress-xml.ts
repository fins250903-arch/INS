import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { normalizeWpContentImageUrls, normalizeWpImageUrl } from '../src/lib/wp-image-url';

type ImportedPost = {
  id: number;
  title: string;
  slug: string;
  date: string;
  status: string;
  content: string;
  categories: string[];
  tags: string[];
  thumbnail: string;
};

async function parseWordPressXml() {
  const xmlDir = path.join(process.cwd(), 'INSDATA');
  const outputFile = path.join(process.cwd(), 'src', 'data', 'wp-posts.json');

  if (!fs.existsSync(xmlDir)) {
    throw new Error(`INSDATA folder not found: ${xmlDir}`);
  }

  const xmlFiles = fs
    .readdirSync(xmlDir)
    .filter((name) => name.toLowerCase().endsWith('.xml'))
    .sort((a, b) => a.localeCompare(b, 'ja'));

  if (xmlFiles.length === 0) {
    throw new Error(`No XML files found under: ${xmlDir}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true,
    parseAttributeValue: false
  });

  const allPosts: ImportedPost[] = [];
  const processedIds = new Set<number>();
  const attachmentMap = new Map<number, string>(); // attachment_id -> url

  for (const filename of xmlFiles) {
    const xmlFile = path.join(xmlDir, filename);
    console.log(`Processing: ${filename}`);
    const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
    const xmlData = parser.parse(xmlContent);
    let items = xmlData?.rss?.channel?.item;

    if (!Array.isArray(items)) {
      items = items ? [items] : [];
    }

    // 1st pass: collect attachment URLs
    for (const item of items) {
      if (item['wp:post_type'] === 'attachment') {
        const attachmentId = parseInt(item['wp:post_id'], 10);
        const attachmentUrl = String(item['wp:attachment_url'] || '').trim();
        if (attachmentId && attachmentUrl) {
          attachmentMap.set(attachmentId, normalizeWpImageUrl(attachmentUrl));
        }
      }
    }

    const filePosts = items
      .filter(
        (item: any) =>
          item['wp:post_type'] === 'post' && item['wp:status'] === 'publish'
      )
      .map((item: any) => {
        const categories: string[] = [];
        const tags: string[] = [];
        if (item.category) {
          const cats = Array.isArray(item.category)
            ? item.category
            : [item.category];
          for (const cat of cats) {
            const label = String(cat['#text'] || '').trim();
            if (!label) continue;
            if (cat['@_domain'] === 'category') categories.push(label);
            if (cat['@_domain'] === 'post_tag') tags.push(label);
          }
        }

        // Extract featured image ID
        let thumbnailId: number | undefined;

        if (item['wp:postmeta']) {
          const metas = Array.isArray(item['wp:postmeta'])
            ? item['wp:postmeta']
            : [item['wp:postmeta']];
          
          for (const meta of metas) {
            if (meta['wp:meta_key'] === '_thumbnail_id') {
              thumbnailId = parseInt(meta['wp:meta_value'], 10);
              break;
            }
          }
        }

        const postId = parseInt(item['wp:post_id'], 10);
        const postSlug = String(item['wp:post_name'] || '').trim();
        const postTitle = String(item.title || '').trim();
        const postDate = String(item.pubDate || item['wp:post_date'] || '').trim();
        const postContent = normalizeWpContentImageUrls(String(item['content:encoded'] || '').trim());
        const thumbnail = thumbnailId ? attachmentMap.get(thumbnailId) || '' : '';

        // Skip empty or URL encoded slug
        if (!postSlug || postSlug.includes('%')) {
          console.warn(`Skipping post ID ${postId} with invalid slug: "${postSlug}"`);
          return null;
        }

        return {
          id: postId,
          title: postTitle,
          slug: postSlug,
          date: postDate,
          status: 'publish',
          content: postContent,
          categories: Array.from(new Set(categories)),
          tags: Array.from(new Set(tags)),
          thumbnail
        };
      })
      .filter((p: ImportedPost | null): p is ImportedPost => p !== null);

    for (const post of filePosts) {
      if (!processedIds.has(post.id)) {
        allPosts.push(post);
        processedIds.add(post.id);
      }
    }
  }

  allPosts.sort(
    (a: ImportedPost, b: ImportedPost) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  fs.writeFileSync(outputFile, JSON.stringify(allPosts, null, 2));
  console.log(`Generated ${allPosts.length} posts -> ${outputFile}`);
  console.log('Recent posts:');
  allPosts.slice(0, 5).forEach((p) => {
    console.log(`  - ${p.slug}: ${p.title}`);
  });
}

parseWordPressXml().catch(console.error);
