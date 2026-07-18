import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isDbConfigured } from "@/lib/db";
import { getStorageStatus } from "@/lib/storage";
import { getProjectWithImages } from "@/lib/admin/store";
import {
  updateProjectAction,
  deleteProjectAction,
  addImageAction,
  updateImageAction,
  deleteImageAction,
} from "@/lib/admin/actions";
import { projectSeoScore } from "@/lib/seo/project-score";
import { SaveForm } from "@/components/admin/SaveForm";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader, Card, Notice } from "@/components/admin/ui";
import type { GalleryProject } from "@/lib/types";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDbConfigured()) return <Notice tone="warn">Connect a database to edit projects.</Notice>;

  const data = await getProjectWithImages(id);
  if (!data) notFound();
  const { project, images } = data;
  const storage = getStorageStatus();

  const asProject: GalleryProject = {
    id: project.id,
    title: project.title,
    serviceCategory: project.serviceCategory,
    city: project.city,
    problem: project.problem,
    work: project.work,
    result: project.result,
    description: project.description,
    completedOn: project.completedOn,
    featured: project.featured,
    active: project.active,
    order: project.sortOrder,
    images: images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, kind: i.kind as GalleryProject["images"][number]["kind"], order: i.sortOrder })),
  };
  const score = projectSeoScore(asProject);

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/gallery" className="text-sm text-brand-accent hover:underline">
          ← Back to gallery
        </Link>
      </div>
      <PageHeader title={project.title || "Untitled project"} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-semibold">Project details</h2>
            <SaveForm action={updateProjectAction} hidden={{ id: project.id }} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="title" label="Title" value={project.title} />
                <Field name="serviceCategory" label="Service category" value={project.serviceCategory} />
                <Field name="city" label="City / general location" value={project.city} hint="A general area is fine — never a customer's full street address." />
                <div>
                  <label className="field-label">Completion date</label>
                  <input type="date" name="completedOn" defaultValue={project.completedOn ?? ""} className="field-input" />
                </div>
              </div>
              <Area name="problem" label="Problem / customer need" value={project.problem} />
              <Area name="work" label="Work completed" value={project.work} />
              <Area name="result" label="Result / outcome" value={project.result} />
              <Area name="description" label="Short public description" value={project.description} />
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="featured" defaultChecked={project.featured} /> Featured on homepage
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="active" defaultChecked={project.active} /> Visible on site
                </label>
              </div>
            </SaveForm>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Images</h2>
            {images.length === 0 && <p className="mb-3 text-sm text-black/55">No images yet. Add one below.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((img) => (
                <div key={img.id} className="rounded-md border border-black/10 p-3">
                  <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded bg-muted">
                    <Image src={img.url} alt={img.alt} fill sizes="300px" className="object-cover" />
                  </div>
                  <form action={updateImageAction} className="space-y-2">
                    <input type="hidden" name="id" value={img.id} />
                    <input
                      name="alt"
                      defaultValue={img.alt}
                      placeholder="Describe this photo (alt text)"
                      className="field-input text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <select name="kind" defaultValue={img.kind} className="field-input text-sm">
                        <option value="standard">Standard</option>
                        <option value="before">Before</option>
                        <option value="after">After</option>
                      </select>
                      <button className="btn btn-outline text-xs">Save</button>
                    </div>
                  </form>
                  <form action={deleteImageAction} className="mt-1 text-right">
                    <input type="hidden" name="id" value={img.id} />
                    <ActionButton label="Remove image" variant="danger" confirm="Remove this image?" />
                  </form>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-md bg-muted p-4">
              <h3 className="mb-2 text-sm font-semibold">Add an image</h3>
              <SaveForm action={addImageAction} submitLabel="Add image" hidden={{ projectId: project.id }} className="space-y-2">
                <input name="alt" placeholder="Alt text — describe the photo" className="field-input" />
                <div className="flex items-center gap-2">
                  <select name="kind" defaultValue="standard" className="field-input sm:w-40">
                    <option value="standard">Standard</option>
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>
                </div>
                <input name="url" placeholder="Image URL (https://…)" className="field-input" />
                {storage.configured ? (
                  <div>
                    <label className="field-label">…or upload a file</label>
                    <input type="file" name="file" accept="image/*" className="field-input" />
                  </div>
                ) : (
                  <p className="field-hint">File upload is disabled until image storage is configured. Paste a URL for now.</p>
                )}
              </SaveForm>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Project completeness</h2>
            <p className="mb-3 text-2xl font-bold text-brand-primary">{score.percent}%</p>
            <ul className="space-y-1.5 text-sm">
              {score.items.map((it) => (
                <li key={it.label} className="flex items-center gap-2">
                  <span className={it.done ? "text-green-600" : "text-black/30"}>{it.done ? "✓" : "○"}</span>
                  <span className={it.done ? "text-black/70" : "text-black/50"}>{it.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-red-700">Danger zone</h2>
            <form action={deleteProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <ActionButton label="Delete this project" variant="danger" confirm={`Delete "${project.title}" and its images? This cannot be undone.`} />
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ name, label, value, hint }: { name: string; label: string; value: string; hint?: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={value} className="field-input" />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
function Area({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea name={name} rows={2} defaultValue={value} className="field-input" />
    </div>
  );
}
