import Link from "next/link";
import type { ReactNode } from "react";
import type { CheckStatus } from "@/lib/seo/checks";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-primary">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-black/60">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-black/10 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "success" | "danger";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "bg-blue-50 text-blue-800",
    warn: "bg-amber-50 text-amber-800",
    success: "bg-green-50 text-green-800",
    danger: "bg-red-50 text-red-700",
  };
  return <div className={`rounded-md p-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function StatusPill({ status }: { status: CheckStatus }) {
  const map: Record<CheckStatus, { label: string; cls: string }> = {
    complete: { label: "Complete", cls: "bg-green-100 text-green-800" },
    "needs-attention": { label: "Needs attention", cls: "bg-amber-100 text-amber-800" },
    missing: { label: "Missing", cls: "bg-red-100 text-red-700" },
    recommended: { label: "Recommended", cls: "bg-blue-100 text-blue-800" },
    external: { label: "Off-site action", cls: "bg-purple-100 text-purple-800" },
  };
  const { label, cls } = map[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={
        "rounded-md px-3 py-1.5 text-sm font-medium " +
        (active ? "bg-brand-primary text-white" : "bg-white text-ink hover:bg-muted")
      }
    >
      {children}
    </Link>
  );
}

/** A large circular score dial (0–100). */
export function ScoreDial({ score, label }: { score: number; label?: string }) {
  const color = score >= 80 ? "#16a34a" : score >= 55 ? "#d97706" : "#dc2626";
  const dash = `${(score / 100) * 283} 283`;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="h-28 w-28">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="24" fontWeight="700" fill="#1f2933">
          {score}
        </text>
      </svg>
      {label && <span className="mt-1 text-sm font-medium text-black/70">{label}</span>}
    </div>
  );
}
