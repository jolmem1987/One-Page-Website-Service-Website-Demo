"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { GalleryProject } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface FlatImage {
  url: string;
  alt: string;
  projectTitle: string;
}

export function GalleryGrid({ projects }: { projects: GalleryProject[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.serviceCategory && set.add(p.serviceCategory));
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? projects : projects.filter((p) => p.serviceCategory === filter);

  // Flatten all visible images for lightbox navigation.
  const images: FlatImage[] = useMemo(
    () =>
      visible.flatMap((p) =>
        p.images.map((img) => ({ url: img.url, alt: img.alt, projectTitle: p.title })),
      ),
    [visible],
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const open = lightboxIndex !== null;

  const close = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, next, prev]);

  if (projects.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-lg font-semibold">No projects to show yet.</p>
        <p className="mt-2 text-black/60">Check back soon — we add new work regularly.</p>
      </div>
    );
  }

  let runningIndex = -1;

  return (
    <div className="container-page">
      {/* Filters */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter projects by category">
        {categories.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={filter === c}
            onClick={() => setFilter(c)}
            className={
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
              (filter === c
                ? "border-brand-accent bg-brand-accent text-white"
                : "border-black/15 bg-white text-ink hover:border-brand-accent")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-black/60">No projects in this category yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => {
            const before = p.images.find((i) => i.kind === "before");
            const after = p.images.find((i) => i.kind === "after");
            const cover = after ?? p.images[0];
            return (
              <article key={p.id} className="card overflow-hidden p-0">
                {cover &&
                  (() => {
                    runningIndex++;
                    const idx = runningIndex;
                    return (
                      <button
                        type="button"
                        className="group relative block aspect-[4/3] w-full overflow-hidden"
                        onClick={() => setLightboxIndex(images.findIndex((im) => im.url === cover.url))}
                        aria-label={`View larger image: ${cover.alt}`}
                      >
                        <Image
                          src={cover.url}
                          alt={cover.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {before && after && (
                          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                            Before / After
                          </span>
                        )}
                        <span className="sr-only">{idx}</span>
                      </button>
                    );
                  })()}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
                    {p.serviceCategory}
                  </p>
                  <h3 className="mt-1 font-semibold">{p.title}</h3>
                  <p className="text-sm text-black/60">
                    {p.city}
                    {p.completedOn && ` · ${formatDate(p.completedOn)}`}
                  </p>
                  {p.problem && (
                    <p className="mt-3 text-sm text-black/70">
                      <span className="font-medium">Problem:</span> {p.problem}
                    </p>
                  )}
                  {p.result && (
                    <p className="mt-1 text-sm text-black/70">
                      <span className="font-medium">Result:</span> {p.result}
                    </p>
                  )}
                  {before && after && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[before, after].map((img, i) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setLightboxIndex(images.findIndex((im) => im.url === img.url))}
                          className="relative aspect-[4/3] overflow-hidden rounded"
                          aria-label={`${i === 0 ? "Before" : "After"}: ${img.alt}`}
                        >
                          <Image src={img.url} alt={img.alt} fill sizes="20vw" className="object-cover" />
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {i === 0 ? "Before" : "After"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {open && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={close}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={close}
            aria-label="Close image viewer"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}
          <figure className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt}
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/80">
              {images[lightboxIndex].alt} — {images[lightboxIndex].projectTitle}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
