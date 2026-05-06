import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDir = 'src/content/blog';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.md')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(blogDir);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const { data, content: body } = matter(content);
    let changed = false;

    // Normalize date -> pubDate
    if (data.date && !data.pubDate) {
        data.pubDate = data.date;
        delete data.date;
        changed = true;
    }

    // Normalize coverImage -> heroImage
    if (data.coverImage && !data.heroImage) {
        data.heroImage = data.coverImage;
        delete data.coverImage;
        changed = true;
    }

    // Fix image path if it's a local file and in a subdirectory
    if (data.heroImage && !data.heroImage.startsWith('/') && !data.heroImage.startsWith('http')) {
        const dir = path.dirname(file);
        if (dir !== blogDir) {
            // Check if it's in images/
            if (fs.existsSync(path.join(dir, 'images', data.heroImage))) {
                data.heroImage = `./images/${data.heroImage}`;
                changed = true;
            } else if (fs.existsSync(path.join(dir, data.heroImage))) {
                data.heroImage = `./${data.heroImage}`;
                changed = true;
            }
        }
    }

    // Add default description if missing
    if (!data.description) {
        // Extract first paragraph as description
        const firstPara = body.trim().split('\n')[0].substring(0, 160);
        data.description = firstPara || "施工実績のご紹介です。";
        changed = true;
    }

    if (changed) {
        const newContent = matter.stringify(body, data);
        fs.writeFileSync(file, newContent);
        console.log(`Updated ${file}`);
    }
});
