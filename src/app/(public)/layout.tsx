import { getSiteConfig } from "@/lib/data";
import { isOpenAdminDemo } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DemoDisclaimer } from "@/components/site/DemoDisclaimer";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessJsonLd } from "@/lib/seo/structured-data";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();

  return (
    <>
      {/* LocalBusiness structured data is site-wide (one source of truth). */}
      <JsonLd data={localBusinessJsonLd(config)} />
      {config.isDemo && <DemoDisclaimer />}
      <Header
        businessName={config.business.name}
        logoUrl={config.branding.logoUrl}
        phone={config.business.phone}
        showAdminLink={isOpenAdminDemo()}
      />
      <main id="main">{children}</main>
      <Footer config={config} />
    </>
  );
}
