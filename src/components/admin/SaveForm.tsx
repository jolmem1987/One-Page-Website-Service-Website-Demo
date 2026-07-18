"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/admin/types";

const initial: ActionResult = { ok: false };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * A reusable form wrapper for admin server actions that return an ActionResult.
 * Renders inline success/error feedback and a pending-aware submit button.
 * The render-prop exposes fieldErrors so inputs can show validation messages.
 */
export function SaveForm({
  action,
  submitLabel = "Save changes",
  children,
  hidden,
  className,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  submitLabel?: string;
  children: ReactNode | ((errors: Record<string, string>) => ReactNode);
  hidden?: Record<string, string>;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={className}>
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {typeof children === "function" ? children(errors) : children}
      <div className="mt-4 flex items-center gap-3">
        <Submit label={submitLabel} />
        {state.message && (
          <span
            role="status"
            className={
              "text-sm " + (state.ok ? "text-green-700" : "text-red-600")
            }
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
