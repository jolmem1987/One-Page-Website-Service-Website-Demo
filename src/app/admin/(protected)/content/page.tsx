import { getSiteConfig } from "@/lib/data";
import {
  saveHeroAction,
  saveAboutAction,
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  createProcessStepAction,
  deleteProcessStepAction,
} from "@/lib/admin/actions";
import { SaveForm } from "@/components/admin/SaveForm";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader, Card, Notice } from "@/components/admin/ui";
import { SERVICE_ICON_KEYS } from "@/components/ui/ServiceIcon";
import { CharCount } from "@/components/admin/CharCount";

export default async function ContentPage() {
  const config = await getSiteConfig();

  return (
    <>
      <PageHeader
        title="Content"
        description="Edit the words on your public website. Changes appear immediately after saving. Write specifically and honestly — it's better for customers and for SEO."
      />

      <div className="space-y-8">
        {/* HERO */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Homepage hero</h2>
          <p className="mb-4 text-sm text-black/55">
            The first thing visitors see. A great headline names your main service and city, e.g. “Roof Repair &
            Replacement in Kenosha, WI.”
          </p>
          <SaveForm action={saveHeroAction} className="space-y-4">
            <div>
              <label className="field-label">Headline (used as the page&apos;s single H1)</label>
              <input name="headline" defaultValue={config.hero.headline} className="field-input" />
              <CharCount value={config.hero.headline} min={20} max={70} hint="Include your service and city." />
            </div>
            <div>
              <label className="field-label">Supporting copy</label>
              <textarea name="subheadline" rows={3} defaultValue={config.hero.subheadline} className="field-input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Primary button label</label>
                <input name="primaryCtaLabel" defaultValue={config.hero.primaryCtaLabel} className="field-input" />
              </div>
              <div>
                <label className="field-label">Call button label</label>
                <input name="secondaryCtaLabel" defaultValue={config.hero.secondaryCtaLabel} className="field-input" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Hero image</label>
                <input type="file" name="imageFile" accept="image/*" className="field-input" />
                <p className="field-hint">Upload a photo from your device — it saves to your site when you hit Save.</p>
              </div>
              <div>
                <label className="field-label">Hero image alt text</label>
                <input name="imageAlt" defaultValue={config.hero.imageAlt} className="field-input" />
                <p className="field-hint">Describe the image for accessibility and SEO.</p>
              </div>
            </div>
            <div>
              <label className="field-label">…or paste an image URL instead</label>
              <input name="imageUrl" defaultValue={config.hero.imageUrl} className="field-input" />
            </div>
            {config.hero.imageUrl && (
              <div>
                <p className="field-hint mb-1">Current hero image:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.hero.imageUrl} alt="" className="h-24 rounded border border-black/10 object-cover" />
              </div>
            )}
          </SaveForm>
        </Card>

        {/* SERVICES */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Services</h2>
          <p className="mb-4 text-sm text-black/55">
            Describe what each service includes and the problem it solves. Avoid vague phrases like “quality work.”
          </p>
          <div className="space-y-4">
            {config.services
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <div key={s.id} className="rounded-md border border-black/10 p-4">
                  <SaveForm action={updateServiceAction} submitLabel="Save" hidden={{ id: s.id }} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input name="name" defaultValue={s.name} className="field-input" placeholder="Service name" />
                      <select name="icon" defaultValue={s.icon} className="field-input sm:w-40">
                        {SERVICE_ICON_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea name="description" rows={2} defaultValue={s.description} className="field-input" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="active" defaultChecked={s.active} /> Active (shown on site)
                    </label>
                  </SaveForm>
                  <form action={deleteServiceAction} className="mt-2 text-right">
                    <input type="hidden" name="id" value={s.id} />
                    <ActionButton label="Delete service" variant="danger" confirm={`Delete "${s.name}"?`} />
                  </form>
                </div>
              ))}
          </div>
          <div className="mt-5 rounded-md bg-muted p-4">
            <h3 className="mb-2 text-sm font-semibold">Add a service</h3>
            <SaveForm action={createServiceAction} submitLabel="Add service" className="space-y-2">
              <input name="name" placeholder="Service name" className="field-input" />
              <textarea name="description" rows={2} placeholder="Short, specific description" className="field-input" />
              <select name="icon" className="field-input sm:w-40" defaultValue="wrench">
                {SERVICE_ICON_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </SaveForm>
          </div>
        </Card>

        {/* ABOUT */}
        <Card>
          <h2 className="font-heading text-lg font-bold">About page</h2>
          <p className="mb-4 text-sm text-black/55">
            Original, genuine content builds trust and gives search engines something unique. Tell your real story.
          </p>
          <SaveForm action={saveAboutAction} className="space-y-4">
            <TextArea name="story" label="Company story" value={config.about.story} rows={5} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="ownerName" label="Owner / team name" value={config.about.ownerName} />
              <Input name="ownerTitle" label="Owner title" value={config.about.ownerTitle} />
            </div>
            <TextArea name="ownerBio" label="Owner bio" value={config.about.ownerBio} rows={3} />
            <TextArea name="experience" label="Experience summary" value={config.about.experience} rows={2} />
            <TextArea name="mission" label="Mission" value={config.about.mission} rows={2} />
            <TextArea name="safety" label="Safety & workmanship" value={config.about.safety} rows={2} />
            <TextArea name="community" label="Community involvement" value={config.about.community} rows={2} />
          </SaveForm>
        </Card>

        {/* PROCESS */}
        <Card>
          <h2 className="font-heading text-lg font-bold">How it works (process steps)</h2>
          <div className="mt-3 space-y-2">
            {config.process
              .sort((a, b) => a.order - b.order)
              .map((p, i) => (
                <div key={p.id} className="flex items-center justify-between rounded border border-black/10 px-3 py-2">
                  <span className="text-sm">
                    <span className="font-semibold">{i + 1}. {p.title}</span> — {p.description}
                  </span>
                  <form action={deleteProcessStepAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <ActionButton label="Delete" variant="danger" confirm="Delete this step?" />
                  </form>
                </div>
              ))}
          </div>
          <div className="mt-4 rounded-md bg-muted p-4">
            <SaveForm action={createProcessStepAction} submitLabel="Add step" className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input name="title" placeholder="Step title" className="field-input" />
              <input name="description" placeholder="What happens in this step" className="field-input" />
            </SaveForm>
          </div>
        </Card>

        {/* FAQS */}
        <Card>
          <h2 className="font-heading text-lg font-bold">FAQs</h2>
          <p className="mb-4 text-sm text-black/55">
            Answer questions customers actually ask. Good FAQs can also earn rich results in Google (added automatically
            when eligible).
          </p>
          <div className="space-y-4">
            {config.faqs
              .sort((a, b) => a.order - b.order)
              .map((f) => (
                <div key={f.id} className="rounded-md border border-black/10 p-4">
                  <SaveForm action={updateFaqAction} submitLabel="Save" hidden={{ id: f.id }} className="space-y-2">
                    <input name="question" defaultValue={f.question} className="field-input" placeholder="Question" />
                    <textarea name="answer" rows={3} defaultValue={f.answer} className="field-input" placeholder="Answer" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="active" defaultChecked={f.active} /> Active
                    </label>
                  </SaveForm>
                  <form action={deleteFaqAction} className="mt-2 text-right">
                    <input type="hidden" name="id" value={f.id} />
                    <ActionButton label="Delete FAQ" variant="danger" confirm="Delete this FAQ?" />
                  </form>
                </div>
              ))}
          </div>
          <div className="mt-5 rounded-md bg-muted p-4">
            <h3 className="mb-2 text-sm font-semibold">Add a FAQ</h3>
            <SaveForm action={createFaqAction} submitLabel="Add FAQ" className="space-y-2">
              <input name="question" placeholder="Question" className="field-input" />
              <textarea name="answer" rows={3} placeholder="Honest, helpful answer" className="field-input" />
            </SaveForm>
          </div>
        </Card>

        {/* TESTIMONIALS */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Testimonials</h2>
          <Notice tone="warn">
            Never use fake reviews. Only publish genuine testimonials from real customers. Sample ones are clearly
            marked and are never turned into review/rating structured data.
          </Notice>
          <div className="mt-4 space-y-4">
            {config.testimonials
              .sort((a, b) => a.order - b.order)
              .map((t) => (
                <div key={t.id} className="rounded-md border border-black/10 p-4">
                  <SaveForm action={updateTestimonialAction} submitLabel="Save" hidden={{ id: t.id }} className="space-y-2">
                    <textarea name="quote" rows={2} defaultValue={t.quote} className="field-input" />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input name="author" defaultValue={t.author} className="field-input" placeholder="Author" />
                      <input name="location" defaultValue={t.location} className="field-input" placeholder="City, ST" />
                      <select name="rating" defaultValue={t.rating ?? ""} className="field-input">
                        <option value="">No rating</option>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            {r} stars
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="active" defaultChecked={t.active} /> Active
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="isSample" defaultChecked={t.isSample} /> Sample content
                      </label>
                    </div>
                  </SaveForm>
                  <form action={deleteTestimonialAction} className="mt-2 text-right">
                    <input type="hidden" name="id" value={t.id} />
                    <ActionButton label="Delete" variant="danger" confirm="Delete this testimonial?" />
                  </form>
                </div>
              ))}
          </div>
          <div className="mt-5 rounded-md bg-muted p-4">
            <h3 className="mb-2 text-sm font-semibold">Add a testimonial</h3>
            <SaveForm action={createTestimonialAction} submitLabel="Add testimonial" className="space-y-2">
              <textarea name="quote" rows={2} placeholder="What the customer said" className="field-input" />
              <div className="grid gap-2 sm:grid-cols-3">
                <input name="author" placeholder="Author" className="field-input" />
                <input name="location" placeholder="City, ST" className="field-input" />
                <select name="rating" className="field-input" defaultValue="">
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} stars
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isSample" /> This is sample/demo content
              </label>
            </SaveForm>
          </div>
        </Card>
      </div>
    </>
  );
}

function Input({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={value} className="field-input" />
    </div>
  );
}
function TextArea({ name, label, value, rows }: { name: string; label: string; value: string; rows: number }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea name={name} rows={rows} defaultValue={value} className="field-input" />
    </div>
  );
}
