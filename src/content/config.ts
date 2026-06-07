import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(), // ISO 8601 format: 2026-02-22
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['publish', 'draft']).default('draft'),
  }),
});

export const collections = {
  blog: blogCollection,
};
