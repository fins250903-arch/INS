#!/usr/bin/env node
/**
 * wp-posts.json を src/content/blog/*.md に変換するスクリプト
 */

import fs from 'fs';
import path from 'path';

interface WpPost {
  title: string;
  slug: string;
  status: string;
  date: string;
  categories?: string[];
  tags?: string[];
  content: string;
}

async function convertJsonToMarkdown() {
  // JSONを読み込み
  const jsonPath = path.join(process.cwd(), 'src/data/wp-posts.json');
  const posts: WpPost[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // 出力ディレクトリを作成
  const outputDir = path.join(process.cwd(), 'src/content/blog');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const post of posts) {
    try {
      // 日付をISO形式に変換 (例: "2026-02-22 17:35:13" → "2026-02-22")
      const dateISO = post.date.split(' ')[0];

      // Front matter（YAML）を作成
      const escapedTitle = post.title.replace(/"/g, '\\"');
      const escapedDescription = (post.title).replace(/"/g, '\\"');
      
      let frontmatter = `---
title: "${escapedTitle}"
description: "${escapedDescription}"
date: "${dateISO}"
status: "${post.status}"
`;

      if (post.categories && post.categories.length > 0) {
        frontmatter += `categories:
${post.categories.map(c => `  - "${c}"`).join('\n')}
`;
      }

      if (post.tags && post.tags.length > 0) {
        frontmatter += `tags:
${post.tags.map(t => `  - "${t}"`).join('\n')}
`;
      }

      frontmatter += `---

`;

      // HTMLコンテンツをMarkdownに変換（簡易版）
      let markdownContent = post.content
        .replace(/<p[^>]*>/g, '') // <p> タグを削除
        .replace(/<\/p>/g, '\n\n') // </p> を改行に
        .replace(/<br\s*\/?>/g, '\n') // <br> を改行に
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<h([1-6])>/g, (match, level) => '#'.repeat(parseInt(level)) + ' ')
        .replace(/<\/h[1-6]>/g, '')
        .replace(/<figure[^>]*>/g, '')
        .replace(/<\/figure>/g, '')
        .replace(/<[^>]+>/g, ''); // 残りのHTMLタグを削除

      const mdContent = frontmatter + markdownContent;

      // ファイルに書き込み
      const filename = `${post.slug}.md`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, mdContent, 'utf-8');

      console.log(`✅ Created: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${post.slug}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 変換完了: ${successCount}件成功、${errorCount}件失敗`);
}

convertJsonToMarkdown().catch(console.error);
