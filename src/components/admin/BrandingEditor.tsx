"use client";

import { useActionState, useState } from "react";
import { saveBrandingAction } from "@/lib/admin/actions";
import { evaluateContrast, FONT_CHOICES } from "@/lib/theme";
import type { ActionResult } from "@/lib/admin/types";
import type { BrandingSettings } from "@/lib/types";

const initial: ActionResult = { ok: false };

function ContrastNote({ bg, label }: { bg: string; label: string }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(bg);
  if (!valid) return null;
  const c = evaluateContrast(bg);
  return (
    <p className={`mt-1 text-xs ${c.passesAA ? "text-green-700" : "text-amber-700"}`}>
      {c.passesAA
        ? `Good contrast for ${label} (ratio ${c.ratio.toFixed(1)}:1).`
        : `⚠ Low contrast for ${label} (ratio ${c.ratio.toFixed(1)}:1). Text on this color may be hard to read — consider a darker/lighter shade.`}
    </p>
  );
}

/** Branding editor with live color preview and WCAG contrast warnings. */
export function BrandingEditor({ branding }: { branding: BrandingSettings }) {
  const [state, action] = useActionState(saveBrandingAction, initial);
  const [primary, setPrimary] = useState(branding.primaryColor);
  const [secondary, setSecondary] = useState(branding.secondaryColor);
  const [accent, setAccent] = useState(branding.accentColor);

  const onText = evaluateContrast(primary).bestTextColor;
  const accentText = evaluateContrast(accent).bestTextColor;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <ColorField name="primaryColor" label="Primary (dark base)" value={primary} onChange={setPrimary} />
        <ColorField name="secondaryColor" label="Secondary" value={secondary} onChange={setSecondary} />
        <ColorField name="accentColor" label="Accent (buttons)" value={accent} onChange={setAccent} />
      </div>

      <ContrastNote bg={primary} label="text on the primary color" />
      <ContrastNote bg={accent} label="text on buttons" />

      {/* Live preview */}
      <div className="rounded-lg border border-black/10 p-4">
        <p className="mb-2 text-xs font-semibold uppercase text-black/50">Preview</p>
        <div className="rounded-md p-5" style={{ backgroundColor: primary, color: onText }}>
          <p className="font-heading text-lg font-bold">{branding.logoUrl ? "Your Logo" : "Your Business Name"}</p>
          <p className="text-sm opacity-80">A headline in your brand colors.</p>
          <span
            className="mt-3 inline-block rounded px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: accent, color: accentText }}
          >
            Get a Free Estimate
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Heading font</label>
          <select name="headingFont" defaultValue={branding.headingFont} className="field-input">
            {FONT_CHOICES.map((f) => (
              <option key={f.stack} value={f.stack}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Body font</label>
          <select name="bodyFont" defaultValue={branding.bodyFont} className="field-input">
            {FONT_CHOICES.map((f) => (
              <option key={f.stack} value={f.stack}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Logo (optional)</label>
          <input type="file" name="logoFile" accept="image/*" className="field-input" />
          <p className="field-hint">Upload a logo image — or paste a URL below.</p>
          <input name="logoUrl" defaultValue={branding.logoUrl ?? ""} className="field-input mt-2" placeholder="https://…/logo.png" />
          {branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="mt-2 h-10 rounded border border-black/10 object-contain" />
          )}
        </div>
        <div>
          <label className="field-label">Favicon URL (optional)</label>
          <input name="faviconUrl" defaultValue={branding.faviconUrl ?? ""} className="field-input" placeholder="https://…/favicon.ico" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary">Save branding</button>
        {state.message && <span className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}

function ColorField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-black/20"
          aria-label={`${label} color picker`}
        />
        <input name={name} value={value} onChange={(e) => onChange(e.target.value)} className="field-input" />
      </div>
    </div>
  );
}
