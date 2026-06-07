import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const XML_DIR = 'C:\\Users\\yu\\Desktop\\INS\\insblog20260523';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata'
});

const files = fs.readdirSync(XML_DIR).filter(f => f.endsWith('.xml'));
for (const file of files) {
  const xmlData = fs.readFileSync(path.join(XML_DIR, file), 'utf-8');
  const result = parser.parse(xmlData);
  
  const channel = result?.rss?.channel;
  if (!channel) {
    console.log(`No channel in ${file}`);
    continue;
  }
  
  const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);
  console.log(`${file}: Found ${items.length} items`);
  
  if (items.length > 0) {
    const item = items[0];
    console.log(`  Sample item keys: ${Object.keys(item).join(', ')}`);
    console.log(`  Sample item title:`, item.title);
    console.log(`  Sample item post_type:`, item['wp:post_type']);
    console.log(`  Sample item status:`, item['wp:status']);
  }
}
