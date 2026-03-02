import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ base: './src/content', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroTitle: z.string().optional(),
    heroTagline: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    author: z.string().optional(),
    heroImage: z.string().optional(),
    ogImage: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const collections = { pages };
