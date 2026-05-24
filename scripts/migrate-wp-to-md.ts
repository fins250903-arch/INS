import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import https from 'node:https';
import http from 'node:http';

const XML_DIR = 'C:\\Users\\yu\\Desktop\\INS\\insblog20260523';
const OUTPUT_DIR = path.join(process.cwd(), 'src/content/blog');
const IMAGE_DIR = path.join(process.cwd(), 'public/images/blog');

// Ensure directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(filepath)) {
      resolve(true);
      return;
    }
    const client = url.startsWith('https') ? https : http;
    const options: https.RequestOptions = {
      rejectUnauthorized: false
    };
    client.get(url, options, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
      } else {
        console.warn(`Failed to download ${url}: HTTP ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.warn(`Error downloading ${url}:`, err.message);
      resolve(false);
    });
  });
}

async function run() {
  const files = fs.readdirSync(XML_DIR).filter(f => f.endsWith('.xml'));
  let totalPosts = 0;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata'
  });

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const xmlData = fs.readFileSync(path.join(XML_DIR, file), 'utf-8');
    const result = parser.parse(xmlData);

    const channel = result?.rss?.channel;
    if (!channel) continue;

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];

    for (const item of items) {
      if (!item) continue;
      let postType = item['wp:post_type'];
      if (typeof postType === 'object' && postType.__cdata) postType = postType.__cdata;
      
      let status = item['wp:status'];
      if (typeof status === 'object' && status.__cdata) status = status.__cdata;

      if (postType !== 'post' || status !== 'publish') {
        continue;
      }

      let title = item.title;
      if (typeof title === 'object' && title.__cdata) title = title.__cdata;
      if (!title) title = 'Untitled';

      let slug = item['wp:post_name'];
      if (typeof slug === 'object' && slug.__cdata) slug = slug.__cdata;
      if (!slug) slug = `post-${item['wp:post_id']}`;
      
      // Some slugs might be URL encoded, decode them for filename if needed, but safe to keep as is if they are ascii
      slug = decodeURIComponent(slug).replace(/[^a-zA-Z0-9\-\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!slug) slug = `post-${item['wp:post_id']}`;

      let date = item['wp:post_date'];
      if (typeof date === 'object' && date.__cdata) date = date.__cdata;

      // Categories
      const categories: string[] = [];
      const cats = Array.isArray(item.category) ? item.category : [item.category];
      for (const cat of cats) {
        if (cat && cat['@_domain'] === 'category') {
          let catName = cat['#text'] || cat.__cdata || cat;
          if (typeof catName === 'object' && catName.__cdata) catName = catName.__cdata;
          if (catName && typeof catName === 'string') {
            categories.push(catName);
          }
        }
      }

      let content = item['content:encoded'];
      if (typeof content === 'object' && content.__cdata) content = content.__cdata;
      if (!content) content = '';

      let markdown = turndownService.turndown(content);

      // Extract images and download them
      const imgRegex = /!\[.*?\]\((http.*?)\)/g;
      let match;
      const downloadedImages = new Set<string>();

      while ((match = imgRegex.exec(markdown)) !== null) {
        const imgUrl = match[1];
        if (downloadedImages.has(imgUrl)) continue;
        downloadedImages.add(imgUrl);

        try {
          const urlObj = new URL(imgUrl);
          const filename = path.basename(urlObj.pathname) || 'image.jpg';
          // Make filename uniqueish
          const safeFilename = `${slug}-${filename}`;
          const localPath = path.join(IMAGE_DIR, safeFilename);
          
          console.log(`  Downloading image: ${imgUrl} -> ${safeFilename}`);
          const success = await downloadImage(imgUrl, localPath);
          if (success) {
            // Replace globally in markdown
            const publicPath = `/images/blog/${safeFilename}`;
            markdown = markdown.split(imgUrl).join(publicPath);
          }
        } catch (e) {
          console.warn(`  Failed to parse or download image URL: ${imgUrl}`);
        }
      }

      // Frontmatter
      const frontmatter = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `date: ${date}`,
      ];
      if (categories.length > 0) {
        frontmatter.push('categories:');
        categories.forEach(c => frontmatter.push(`  - "${c.replace(/"/g, '\\"')}"`));
      }
      frontmatter.push('---', '');

      const fileContent = frontmatter.join('\n') + '\n' + markdown;
      fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.md`), fileContent);
      totalPosts++;
    }
  }

  console.log(`Migration complete. Generated ${totalPosts} posts.`);
}

run().catch(console.error);
