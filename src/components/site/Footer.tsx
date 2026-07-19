import Link from "next/link";
import type { SiteConfig } from "@/lib/types";
import { activeServices } from "@/lib/data";
import { dayName, formatTime, telHref } from "@/lib/utils";

/** Consistent footer built from the single source of truth. */
export function Footer({ config }: { config: SiteConfig }) {
  const b = config.business;
  const services = activeServices(config).slice(0, 6);
  const year = b.foundedYear;

  return (
    <footer className="mt-4 bg-brand-primary text-white/90">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="mb-3 font-heading text-lg font-bold text-white">{b.name}</div>
          <p className="text-sm leading-relaxed text-white/70">{config.footer.aboutBlurb}</p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Services</h2>
          <ul className="space-y-1 text-sm text-white/70">
            {services.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact</h2>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <a href={telHref(b.phone)} className="hover:text-white">
                {b.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${b.email}`} className="hover:text-white">
                {b.email}
              </a>
            </li>
            {b.showAddress && b.addressLine && (
              <li>
                {b.addressLine}, {b.city}, {b.state} {b.zip}
              </li>
            )}
            {!b.showAddress && (
              <li>
                Serving {b.city}, {b.state} and surrounding areas
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Hours</h2>
          <ul className="space-y-1 text-sm text-white/70">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const h = config.hours.find((x) => x.day === d);
              return (
                <li key={d} className="flex justify-between gap-4">
                  <span>{dayName(d)}</span>
                  <span>
                    {h && h.open && h.close ? `${formatTime(h.open)}–${formatTime(h.close)}` : "Closed"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year}–present {b.legalName || b.name}. {b.licenseInfo}
          </p>
          <nav className="flex gap-4" aria-label="Footer">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/gallery" className="hover:text-white">
              Gallery
            </Link>
            {/* Owner sign-in. Logging in here (unlike the visitor "Admin demo"
                button) gives full edit access where changes are saved for real. */}
            <Link href="/admin/login" className="hover:text-white">
              Owner login
            </Link>
          </nav>
        </div>
        {config.isDemo && (
          <div className="bg-black/25">
            <p className="container-page py-3 text-center text-xs text-white/70">{config.footer.legalDisclaimer}</p>
          </div>
        )}
      </div>
    </footer>
  );
}
