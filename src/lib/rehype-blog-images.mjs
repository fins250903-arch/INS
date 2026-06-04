import { visit } from 'unist-util-visit';

/**
 * Normalizes image src in rendered blog markdown to /blog-images/ paths.
 */
export function normalizeBlogImageSrc(src) {
  const trimmed = String(src || '').trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/blog-images/')) return trimmed;
  if (trimmed.startsWith('blog-images/')) return `/${trimmed}`;
  if (trimmed.startsWith('/')) return trimmed;
  const name = trimmed.replace(/^.*\//, '');
  return `/blog-images/${name.replace(/^blog-images\//, '')}`;
}

/** @type {import('unified').Plugin[]} */
export function rehypeBlogImages() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img' || !node.properties?.src) return;
      const raw = node.properties.src;
      const src = Array.isArray(raw) ? raw[0] : raw;
      node.properties.src = normalizeBlogImageSrc(String(src));
    });
  };
}
