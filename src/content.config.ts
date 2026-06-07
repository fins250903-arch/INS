import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** 地域識別子（osaka / fukuoka など） */
    region: z.enum(['fukuoka', 'osaka', 'hyougo', 'siga']),
    /** 地域の正式名称（例: 大阪府） */
    regionFull: z.string(),
    /** 地域の件名・表示ラベル（未指定時は regionFull を使用） */
    areaLabel: z.string().optional(),
    /** サムネイル画像（/blog-images/ 配下または絶対パス） */
    thumbnail: z.string().optional(),
    /** 記事内で参照する画像（Pages CMS メディアライブラリ） */
    images: z.array(z.string()).optional(),
    /** Decap CMS: ファイル名用スラッグ（未使用時はファイル名から推定） */
    urlSlug: z.string().optional(),
    /** SEO 用カノニカル URL（未指定時は Astro.site + パスから自動生成） */
    canonicalUrl: z.string().url().optional(),
    /** SEO settings edited via Decap CMS */
    seo: z
      .object({
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
        keywords: z.string().optional(),
        noindex: z.boolean().optional()
      })
      .optional(),
    /** OGP settings edited via Decap CMS */
    ogp: z
      .object({
        og_image: z.string().optional(),
        og_type: z.enum(['article', 'website']).optional()
      })
      .optional(),
    draft: z.boolean().default(false),
    categories: z
      .preprocess(
        (val) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val.trim()) {
            return val.split(',').map((item) => item.trim()).filter(Boolean);
          }
          return [];
        },
        z.array(z.string())
      )
      .default([]),
    tags: z
      .preprocess(
        (val) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val.trim()) {
            return val.split(',').map((item) => item.trim()).filter(Boolean);
          }
          return [];
        },
        z.array(z.string())
      )
      .default([])
  })
});

export const collections = { blog };
