import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    categories: z.array(z.string()).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
