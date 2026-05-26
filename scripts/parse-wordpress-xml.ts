import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

type Post = {
  id: number;
  title: string;
  slug: string;
  date: string;
  status: string;
  content: string;
  categories: string[];
  thumbnail_id?: number;
  featured_image?: string;
};

async function parseWordPressXml() {
  const dataDir = path.join(process.cwd(), 'src/data');
  const outputFile = path.join(dataDir, 'wp-posts.json');

  // XML ファイルのパターンを定義（複数ファイルをマージ）
  const xmlPatterns = [
    'ins.WordPress.2026-05-12.xml',
    'ins.WordPress.2026-05-12 (1).xml',
    'ins.WordPress.2026-05-12 (2).xml',
    'ins.WordPress.2026-05-12 (3).xml',
    'WordPress.2026-05-12.xml'
  ];

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true,
    parseAttributeValue: false
  });

  const allPosts: Post[] = [];
  const processedIds = new Set<number>();
  const attachmentMap = new Map<number, string>(); // ID -> featured image URL

  for (const pattern of xmlPatterns) {
    const xmlFile = path.join(dataDir, pattern);
    if (!fs.existsSync(xmlFile)) {
      console.log(`⊘ Skipping: ${pattern} (not found)`);
      continue;
    }

    console.log(`✓ Processing: ${pattern}`);
    const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
    const xmlData = parser.parse(xmlContent);
    let items = xmlData.rss.channel.item;

    // item が単一オブジェクトの場合は配列にする
    if (!Array.isArray(items)) {
      items = items ? [items] : [];
    }

    // First pass: collect attachments
    for (const item of items) {
      if (item['wp:post_type'] === 'attachment') {
        const attachmentId = parseInt(item['wp:post_id'], 10);
        const attachmentUrl = String(item['wp:attachment_url'] || '').trim();
        if (attachmentId && attachmentUrl) {
          attachmentMap.set(attachmentId, attachmentUrl);
        }
      }
    }

    const filePosts = items
      .filter(
        (item: any) =>
          item['wp:post_type'] === 'post' && item['wp:status'] === 'publish'
      )
      .map((item: any) => {
        let categories: string[] = [];
        if (item.category) {
          const cats = Array.isArray(item.category)
            ? item.category
            : [item.category];
          categories = cats
            .filter((cat: any) => cat['@_domain'] === 'category')
            .map((cat: any) => cat['#text'] || '')
            .filter(c => c);
        }

        // Extract featured image ID from post meta
        let thumbnailId: number | undefined;
        let featuredImage: string | undefined;

        if (item['wp:postmeta']) {
          const metas = Array.isArray(item['wp:postmeta'])
            ? item['wp:postmeta']
            : [item['wp:postmeta']];
          
          for (const meta of metas) {
            if (meta['wp:meta_key'] === '_thumbnail_id') {
              thumbnailId = parseInt(meta['wp:meta_value'], 10);
              if (thumbnailId && attachmentMap.has(thumbnailId)) {
                featuredImage = attachmentMap.get(thumbnailId);
              }
              break;
            }
          }
        }

        const postId = parseInt(item['wp:post_id'], 10);
        const postSlug = String(item['wp:post_name'] || '').trim();
        const postTitle = String(item.title || '').trim();
        const postDate = String(item.pubDate || item['wp:post_date'] || '').trim();
        const postContent = String(item['content:encoded'] || '').trim();

        // スラッグが空、または URL エンコード形式の場合はスキップ
        if (!postSlug || postSlug.includes('%')) {
          console.warn(`⚠ Skipping post ID ${postId} with invalid slug: "${postSlug}" (title: "${postTitle}")`);
          return null;
        }

        return {
          id: postId,
          title: postTitle,
          slug: postSlug,
          date: postDate,
          status: 'publish',
          content: postContent,
          categories,
          thumbnail_id: thumbnailId,
          featured_image: featuredImage,
        };
      })
      .filter((p: Post | null): p is Post => p !== null);

    // 重複排除（IDで判定）
    for (const post of filePosts) {
      if (!processedIds.has(post.id)) {
        allPosts.push(post);
        processedIds.add(post.id);
      }
    }
  }

  // 日付でソート（新しい順）
  allPosts.sort(
    (a: Post, b: Post) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  fs.writeFileSync(outputFile, JSON.stringify(allPosts, null, 2));
  console.log(`\n✓ Generated ${allPosts.length} posts to ${outputFile}`);
  console.log('\nRecent posts:');
  allPosts.slice(0, 5).forEach((p) => {
    console.log(`  - ${p.slug}: ${p.title}`);
  });
}

parseWordPressXml().catch(console.error);
