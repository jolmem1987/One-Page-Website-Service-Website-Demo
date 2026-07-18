import { brandingToCssVars } from "@/lib/theme";
import type { BrandingSettings } from "@/lib/types";

/**
 * Injects the customer's branding as CSS variables at the top of the document,
 * so colors and fonts can be changed from the admin panel without editing code.
 */
export function ThemeStyle({ branding }: { branding: BrandingSettings }) {
  const css = `:root{${brandingToCssVars(branding)}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
