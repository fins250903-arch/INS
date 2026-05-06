import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const regions = defineCollection({
  loader: glob({ pattern: '**/[^_]*.json', base: './src/content/regions' }),
  schema: z.object({
    prefName: z.string(),
    title: z.string(),
    description: z.string(),
    canonical: z.string(),
    aioDefinition: z.string(),
    problemCity: z.string(),
    reasonsCity: z.string(),
    flowCity: z.string(),
    voiceCity: z.string(),
    areaBlocks: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    faqItems: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })),
    pricingNote: z.string(),
    relatedRegions: z.array(z.object({
      name: z.string(),
      slug: z.string(),
      active: z.boolean().optional(),
    })),
    voiceItems: z.array(z.object({
      stars: z.string(),
      label: z.string(),
      text: z.string(),
    })).optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    date: z.coerce.date().optional(), // For migrated posts
    heroImage: z.union([z.string(), image()]).optional(),
    coverImage: z.union([z.string(), image()]).optional(), // For migrated posts
    categories: z.array(z.string()).optional(),
  }),
});

export const collections = { regions, blog };
