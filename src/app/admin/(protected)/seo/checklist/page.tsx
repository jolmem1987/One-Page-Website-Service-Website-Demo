import Link from "next/link";
import { isDbConfigured } from "@/lib/db";
import { getSiteConfig } from "@/lib/data";
import { OFFSITE_TASKS, runSeoChecks } from "@/lib/seo/checks";
import { getChecklistProgress } from "@/lib/admin/store";
import { toggleChecklistAction } from "@/lib/admin/actions";
import { PageHeader, Card, Notice } from "@/components/admin/ui";

export default async function SeoChecklistPage() {
  const config = await getSiteConfig();
  const hasDb = isDbConfigured();

  let progress: { taskKey: string; completed: boolean }[] = [];
  if (hasDb) {
    try {
      progress = await getChecklistProgress();
    } catch {
      progress = [];
    }
  }
  const done = new Set(progress.filter((p) => p.completed).map((p) => p.taskKey));
  const completedCount = OFFSITE_TASKS.filter((t) => done.has(t.key)).length;

  const automated = runSeoChecks(config).filter((c) => c.automated && c.status === "complete");

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/seo" className="text-sm text-brand-accent hover:underline">
          ← Back to SEO Center
        </Link>
      </div>
      <PageHeader
        title="Local SEO Action Plan"
        description="These steps happen OFF your website — they can't be automated here. Working through them is how local businesses actually earn visibility on Google over time."
      />

      {!hasDb && <Notice tone="warn">Connect a database to save your checklist progress.</Notice>}

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Your progress</p>
            <p className="text-sm text-black/55">
              {completedCount} of {OFFSITE_TASKS.length} off-site tasks marked complete
            </p>
          </div>
          <div className="h-2 w-40 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-brand-accent"
              style={{ width: `${(completedCount / OFFSITE_TASKS.length) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {OFFSITE_TASKS.map((task, i) => {
          const isDone = done.has(task.key);
          return (
            <Card key={task.key} className={isDone ? "opacity-70" : ""}>
              <div className="flex items-start gap-3">
                <form action={toggleChecklistAction} className="pt-0.5">
                  <input type="hidden" name="taskKey" value={task.key} />
                  <input type="hidden" name="completed" value={isDone ? "false" : "true"} />
                  <button
                    type="submit"
                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                    disabled={!hasDb}
                    className={
                      "grid h-6 w-6 place-items-center rounded border-2 " +
                      (isDone ? "border-brand-accent bg-brand-accent text-white" : "border-black/25 bg-white")
                    }
                  >
                    {isDone && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </form>
                <div>
                  <h3 className={"font-semibold " + (isDone ? "line-through" : "")}>
                    {i + 1}. {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-black/65">{task.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <h2 className="font-semibold">Technical SEO handled automatically for you</h2>
        <p className="mb-3 text-sm text-black/55">You don&apos;t need to do anything for these — the template takes care of them.</p>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {automated.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-black/70">
              <span className="text-green-600">✓</span> {c.title}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
