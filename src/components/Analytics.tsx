import Script from "next/script";
import type { SeoSettings } from "@/lib/types";

/**
 * Loads analytics/tag scripts ONLY when a valid ID is configured. Nothing is
 * loaded (and no cookies are set) until the customer supplies an ID in the
 * admin SEO settings or via environment variables.
 */
export function Analytics({ seo }: { seo: SeoSettings }) {
  const ga = seo.gaMeasurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  const gtm = seo.gtmContainerId || process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || "";

  return (
    <>
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
    </>
  );
}
