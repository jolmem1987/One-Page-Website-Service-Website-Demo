"use client";

import { useActionState, useState } from "react";
import { savePageSeoAction } from "@/lib/admin/actions";
import type { ActionResult } from "@/lib/admin/types";
import type { PageSeo } from "@/lib/types";

const initial: ActionResult = { ok: false };

function counter(len: number, min: number, max: number) {
  const ok = len >= min && len <= max;
  return { cls: len === 0 ? "text-black/50" : ok ? "text-green-700" : "text-amber-700", text: `${len} chars · aim ${min}–${max}` };
}

/**
 * Per-page SEO editor with a live Google-style search preview and social-share
 * preview. Provides character guidance rather than hard blocking.
 */
export function PageSeoEditor({
  page,
  seo,
  fallbackTitle,
  fallbackDescription,
  siteUrl,
  path,
}: {
  page: "home" | "about" | "gallery";
  seo: PageSeo;
  fallbackTitle: string;
  fallbackDescription: string;
  siteUrl: string;
  path: string;
}) {
  const [state, action] = useActionState(savePageSeoAction, initial);
  const [title, setTitle] = useState(seo.title);
  const [description, setDescription] = useState(seo.description);
  const [socialTitle, setSocialTitle] = useState(seo.socialTitle ?? "");
  const [noindex, setNoindex] = useState(seo.noindex);

  const shownTitle = title || fallbackTitle;
  const shownDesc = description || fallbackDescription;
  const displayUrl = `${siteUrl.replace(/^https?:\/\//, "")}${path === "/" ? "" : path}`;
  const tc = counter(title.length, 30, 60);
  const dc = counter(description.length, 70, 160);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={action} className="space-y-3">
        <input type="hidden" name="page" value={page} />
        <div>
          <label className="field-label">Search title</label>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
          <p className={`mt-1 text-xs ${tc.cls}`}>{tc.text}</p>
        </div>
        <div>
          <label className="field-label">Search description</label>
          <textarea name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="field-input" />
          <p className={`mt-1 text-xs ${dc.cls}`}>{dc.text}</p>
        </div>
        <div>
          <label className="field-label">Primary topic / target phrase</label>
          <input name="targetPhrase" defaultValue={seo.targetPhrase ?? ""} className="field-input" placeholder="e.g. roof repair Kenosha WI" />
        </div>
        <details className="rounded border border-black/10 p-3 text-sm">
          <summary className="cursor-pointer font-medium">Social sharing & advanced</summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label">Social title</label>
              <input name="socialTitle" value={socialTitle} onChange={(e) => setSocialTitle(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Social description</label>
              <textarea name="socialDescription" rows={2} defaultValue={seo.socialDescription ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Social image URL</label>
              <input name="socialImage" defaultValue={seo.socialImage ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Canonical URL override (leave blank unless needed)</label>
              <input name="canonicalOverride" defaultValue={seo.canonicalOverride ?? ""} className="field-input" placeholder="Usually leave blank" />
              <p className="field-hint">A canonical URL is the official web address of a page. Only set this if this page&apos;s content also lives at another address.</p>
            </div>
          </div>
        </details>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="noindex" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />
          Hide this page from search engines
        </label>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary text-sm">Save {page} SEO</button>
          {state.message && <span className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</span>}
        </div>
      </form>

      {/* Previews */}
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-black/50">Google search preview</p>
          <div className="rounded-md border border-black/10 bg-white p-3">
            <p className="text-xs text-[#202124]">{displayUrl}</p>
            <p className="truncate text-lg text-[#1a0dab]">{shownTitle}</p>
            <p className="line-clamp-2 text-sm text-[#4d5156]">{shownDesc}</p>
            {noindex && <p className="mt-1 text-xs font-semibold text-red-600">⚠ Hidden from search — will not appear in Google.</p>}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-black/50">Social share preview</p>
          <div className="overflow-hidden rounded-md border border-black/10 bg-white">
            <div className="grid h-28 place-items-center bg-brand-primary text-xs text-white/70">
              {seo.socialImage ? "Custom social image" : "Default social image"}
            </div>
            <div className="p-3">
              <p className="text-xs uppercase text-black/40">{displayUrl}</p>
              <p className="truncate font-semibold">{socialTitle || shownTitle}</p>
              <p className="line-clamp-2 text-sm text-black/60">{shownDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
