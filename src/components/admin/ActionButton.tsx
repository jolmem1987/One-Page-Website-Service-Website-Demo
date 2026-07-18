"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button for simple void server actions (delete/toggle). Supports an
 * optional confirmation dialog before submitting, satisfying "confirm before
 * destructive deletion".
 */
export function ActionButton({
  label,
  confirm,
  variant = "default",
}: {
  label: string;
  confirm?: string;
  variant?: "default" | "danger" | "ghost";
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "danger"
      ? "text-red-600 hover:bg-red-50"
      : variant === "ghost"
      ? "text-black/60 hover:bg-muted"
      : "text-brand-primary hover:bg-muted";

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={`rounded px-2.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}
    >
      {pending ? "…" : label}
    </button>
  );
}
