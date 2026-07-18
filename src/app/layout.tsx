import type { Metadata } from "next";
import "./globals.css";
import { getSiteConfig } from "@/lib/data";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { ThemeStyle } from "@/components/ThemeStyle";
import { Analytics } from "@/components/Analytics";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildRootMetadata(config);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  const gsc = config.seo.gscVerification || process.env.NEXT_PUBLIC_GSC_VERIFICATION || "";
  const bing = config.seo.bingVerification || process.env.NEXT_PUBLIC_BING_VERIFICATION || "";

  return (
    <html lang="en">
      <head>
        <ThemeStyle branding={config.branding} />
        {gsc && <meta name="google-site-verification" content={gsc} />}
        {bing && <meta name="msvalidate.01" content={bing} />}
      </head>
      <body>
        {children}
        <Analytics seo={config.seo} />
      </body>
    </html>
  );
}
