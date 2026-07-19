import Link from "next/link";
import { getSiteConfig } from "@/lib/data";
import { isDbConfigured } from "@/lib/db";
import { getStorageStatus } from "@/lib/storage";
import { createProjectAction } from "@/lib/admin/actions";
import { SaveForm } from "@/components/admin/SaveForm";
import { PageHeader, Card, Notice } from "@/components/admin/ui";
import { projectSeoScore } from "@/lib/seo/project-score";

export default async function GalleryAdminPage() {
  const config = await getSiteConfig();
  const storage = getStorageStatus();
  const hasDb = isDbConfigured();

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Add and manage real project photos. A specific description (problem → work → result) is far more useful than “new roof completed.”"
      />

      {!hasDb && <Notice tone="warn">Connect a database to save gallery projects.</Notice>}
      {!storage.configured && (
        <div className="mb-4">
          <Notice tone="info">
            Image uploads are disabled ({storage.reason}) You can still add images by pasting an image URL. Seeded demo
            images remain in place.
          </Notice>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.projects
          .sort((a, b) => a.order - b.order)
          .map((p) => {
            const score = projectSeoScore(p);
            return (
              <Link key={p.id} href={`/admin/gallery/${p.id}`}>
                <Card className="h-full hover:ring-2 hover:ring-brand-accent">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    {!p.active && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">Hidden</span>}
                  </div>
                  <p className="mt-1 text-xs text-black/55">
                    {p.serviceCategory} · {p.city} · {p.images.length} image(s)
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${score.percent}%`,
                          backgroundColor: score.percent >= 80 ? "#16a34a" : score.percent >= 50 ? "#d97706" : "#dc2626",
                        }}
                      />
                    </div>
                    <span className="text-xs text-black/55">{score.percent}% complete</span>
                  </div>
                  {p.featured && <span className="mt-2 inline-block text-xs text-brand-accent">★ Featured</span>}
                </Card>
              </Link>
            );
          })}
        {config.projects.length === 0 && <p className="text-sm text-black/55">No projects yet. Add your first below.</p>}
      </div>

      <Card>
        <h2 className="font-heading text-lg font-bold">Add a project</h2>
        <p className="mb-4 text-sm text-black/55">You&apos;ll be able to add images and full details after creating it.</p>
        <SaveForm action={createProjectAction} submitLabel="Create project" className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">Project title</label>
            <input name="title" className="field-input" placeholder="e.g. Full Architectural Shingle Replacement" />
          </div>
          <div>
            <label className="field-label">Service category</label>
            <input name="serviceCategory" className="field-input" placeholder="e.g. Roof Replacement" />
          </div>
          <div>
            <label className="field-label">City / general location</label>
            <input name="city" className="field-input" placeholder="e.g. Kenosha, WI" />
          </div>
          <div>
            <label className="field-label">Completion date</label>
            <input name="completedOn" type="date" className="field-input" />
          </div>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="featured" /> Feature on homepage
          </label>
        </SaveForm>
      </Card>
    </>
  );
}
