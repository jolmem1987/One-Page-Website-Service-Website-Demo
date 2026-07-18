import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig, activeProjects } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/JsonLd";
import { GalleryGrid } from "@/components/site/GalleryGrid";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildPageMetadata(config, "gallery");
}

export default async function GalleryPage() {
  const config = await getSiteConfig();
  const projects = activeProjects(config);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(config, [
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />

      <section className="bg-brand-primary py-14 text-white">
        <div className="container-page">
          <p className="eyebrow">Our work</p>
          <h1 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">Project Gallery</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            A look at recent {config.business.primaryService.toLowerCase()} projects across{" "}
            {config.serviceArea.primaryCity} and nearby communities. Tap any photo to view it larger.
          </p>
        </div>
      </section>

      <section className="section">
        <GalleryGrid projects={projects} />
      </section>

      <section className="pb-20">
        <div className="container-page rounded-2xl bg-muted px-8 py-10 text-center">
          <h2 className="font-heading text-2xl font-bold">Want results like these?</h2>
          <p className="mx-auto mt-2 max-w-lg text-black/70">
            Get a free, no-pressure estimate for your project today.
          </p>
          <Link href="/#estimate" className="btn btn-primary mt-5 text-base">
            Get a Free Estimate
          </Link>
        </div>
      </section>
    </>
  );
}
