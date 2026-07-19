"use client";

import { useState } from "react";
import Link from "next/link";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { telHref } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
];

export function Header({
  businessName,
  logoUrl,
  phone,
  showAdminLink = false,
}: {
  businessName: string;
  logoUrl: string | null;
  phone: string;
  /** Show an "Admin" link (demo deployments only) so visitors can try the panel. */
  showAdminLink?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-brand-primary">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className="h-9 w-auto" />
          ) : (
            <span
              className="grid h-9 w-9 place-items-center rounded bg-brand-primary text-white"
              aria-hidden
            >
              {businessName.charAt(0)}
            </span>
          )}
          <span className="truncate">{businessName}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-ink hover:text-brand-accent">
              {item.label}
            </Link>
          ))}
          {showAdminLink && (
            <Link
              href="/admin"
              className="rounded-full border border-brand-accent px-3 py-1 text-sm font-semibold text-brand-accent hover:bg-brand-accent hover:text-white"
            >
              Admin demo
            </Link>
          )}
          <a href={telHref(phone)} className="btn btn-dark text-sm">
            <ServiceIcon name="phone" className="h-4 w-4" /> {phone}
          </a>
        </nav>

        <button
          type="button"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/10 bg-white md:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-2 py-3 text-base font-medium hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {showAdminLink && (
              <Link
                href="/admin"
                className="rounded px-2 py-3 text-base font-semibold text-brand-accent hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Admin demo
              </Link>
            )}
            <a href={telHref(phone)} className="btn btn-dark mt-2">
              <ServiceIcon name="phone" className="h-4 w-4" /> Call {phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
