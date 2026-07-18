/**
 * A tasteful, unobtrusive demonstration banner shown while the site is in demo
 * mode. Remove/disable this by turning off "demo mode" in admin settings for a
 * real customer (see the New Customer Launch Checklist).
 */
export function DemoDisclaimer() {
  return (
    <div className="bg-brand-secondary text-center text-xs text-white">
      <p className="container-page py-2">
        <span className="font-semibold">Demonstration site.</span> This is a fictional business used to
        showcase the Contractor Website Starter. Testimonials and projects are sample content.
      </p>
    </div>
  );
}
