"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/admin/actions";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/seo", label: "Local SEO Center", exact: true },
  { href: "/admin/seo/checklist", label: "SEO Action Plan" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/onboarding", label: "Setup Wizard" },
];

export function AdminNav({ businessName, userName }: { businessName: string; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: (typeof ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 lg:hidden">
        <span className="font-heading font-bold text-brand-primary">{businessName}</span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <nav
        className={`${open ? "block" : "hidden"} border-b border-black/10 bg-brand-primary text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0`}
        aria-label="Admin"
      >
        <div className="hidden px-5 py-5 lg:block">
          <div className="font-heading text-lg font-bold">{businessName}</div>
          <div className="text-xs text-white/60">Admin panel</div>
        </div>
        <ul className="space-y-0.5 px-3 py-2">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "block rounded px-3 py-2 text-sm " +
                  (isActive(item) ? "bg-white/15 font-semibold text-white" : "text-white/80 hover:bg-white/10")
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-white/15 px-3 py-3">
          <p className="px-3 text-xs text-white/60">Signed in as {userName}</p>
          <div className="mt-2 flex flex-col gap-1">
            <Link href="/" className="rounded px-3 py-2 text-sm text-white/80 hover:bg-white/10" target="_blank">
              View website ↗
            </Link>
            <form action={logoutAction}>
              <button className="w-full rounded px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}
