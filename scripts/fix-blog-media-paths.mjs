/**
 * Moves images mistakenly saved under src/content/blog/** to public/blog-images/.
 */
import fs from 'fs';
import path from 'path';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');
const OUT_DIR = path.join(process.cwd(), 'public/blog-images');
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && IMAGE_EXT.test(entry.name)) files.push(full);
  }
  return files;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let moved = 0;
for (const filePath of walk(BLOG_ROOT)) {
  const name = path.basename(filePath);
  const dest = path.join(OUT_DIR, name);
  if (fs.existsSync(dest)) {
    console.warn(`Skip (already exists in blog-images): ${name}`);
    fs.unlinkSync(filePath);
    continue;
  }
  fs.renameSync(filePath, dest);
  console.log(`Moved ${path.relative(process.cwd(), filePath)} -> public/blog-images/${name}`);
  moved += 1;
}

if (moved === 0) console.log('No stray blog images to move.');
else console.log(`Moved ${moved} image(s).`);
