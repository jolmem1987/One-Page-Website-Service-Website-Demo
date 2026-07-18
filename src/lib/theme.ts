import type { BrandingSettings } from "./types";

/**
 * Brand theming helpers.
 *
 * The public site is driven by CSS variables so branding can change from the
 * admin panel without editing source. This module also provides WCAG contrast
 * checks so the admin can warn when a chosen color may be hard to read.
 */

/** A curated list of safe, widely-supported font stacks offered in the admin. */
export const FONT_CHOICES: { label: string; stack: string }[] = [
  { label: "System Sans (default body)", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { label: "Georgia (serif)", stack: "Georgia, 'Times New Roman', serif" },
  { label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica Neue", stack: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", stack: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Palatino (serif)", stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { label: "Courier (mono)", stack: "'Courier New', Courier, monospace" },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Returns "r g b" (space separated) for use in `rgb(var(--x) / <alpha>)`. */
export function hexToRgbTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastCheck {
  ratio: number;
  passesAA: boolean; // normal text
  passesAALarge: boolean; // large text / UI
  bestTextColor: "#ffffff" | "#111111";
}

/** Evaluates whether a background color is readable and which text color to use. */
export function evaluateContrast(background: string): ContrastCheck {
  const white = contrastRatio(background, "#ffffff");
  const black = contrastRatio(background, "#111111");
  const ratio = Math.max(white, black);
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
    bestTextColor: white >= black ? "#ffffff" : "#111111",
  };
}

/** Produces the inline CSS-variable block injected into <html> for theming. */
export function brandingToCssVars(b: BrandingSettings): string {
  const onBrand = evaluateContrast(b.primaryColor).bestTextColor;
  return [
    `--brand-primary: ${hexToRgbTriplet(b.primaryColor)};`,
    `--brand-secondary: ${hexToRgbTriplet(b.secondaryColor)};`,
    `--brand-accent: ${hexToRgbTriplet(b.accentColor)};`,
    `--brand-on-primary: ${hexToRgbTriplet(onBrand)};`,
    `--font-heading: ${b.headingFont};`,
    `--font-body: ${b.bodyFont};`,
  ].join(" ");
}
