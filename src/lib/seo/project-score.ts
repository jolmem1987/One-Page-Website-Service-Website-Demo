import type { GalleryProject } from "../types";

/**
 * Per-project SEO/completeness indicator. Encourages descriptions that explain
 * the problem, the work, and the result — not just "new roof completed".
 */
export function projectSeoScore(p: GalleryProject): {
  percent: number;
  items: { label: string; done: boolean }[];
} {
  const items = [
    { label: "Title", done: p.title.trim().length > 3 },
    { label: "Service category", done: p.serviceCategory.trim().length > 1 },
    { label: "City / location", done: p.city.trim().length > 1 },
    { label: "Problem described", done: p.problem.trim().length >= 15 },
    { label: "Work described", done: p.work.trim().length >= 15 },
    { label: "Result described", done: p.result.trim().length >= 15 },
    { label: "At least one image", done: p.images.length > 0 },
    { label: "All images have alt text", done: p.images.length > 0 && p.images.every((i) => i.alt.trim().length >= 5) },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), items };
}
