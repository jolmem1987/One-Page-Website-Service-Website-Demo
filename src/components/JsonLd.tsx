import { jsonLdString } from "@/lib/seo/structured-data";

/** Renders a JSON-LD structured-data script tag safely. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}
