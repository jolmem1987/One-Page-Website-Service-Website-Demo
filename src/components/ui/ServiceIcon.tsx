import type { SVGProps } from "react";

/**
 * A small set of inline, dependency-free line icons used for services and
 * feature points. Adding a new icon key just means adding a case here.
 */
const PATHS: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  wrench: "M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.5 2.5-2-2 2.5-2.5z",
  cloud: "M7 18a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0117 18H7z",
  droplet: "M12 3s6 6.5 6 10.5A6 6 0 016 13.5C6 9.5 12 3 12 3z",
  search: "M11 4a7 7 0 105 12l4 4M11 4a7 7 0 015 12",
  wind: "M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h9",
  shield: "M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3z",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  star: "M12 3l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 18l-5.8 3 1.1-6.5L2.5 9.9 9.1 9 12 3z",
  phone: "M4 4h4l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v4a2 2 0 01-2 2A16 16 0 012 6a2 2 0 012-2z",
  check: "M20 6L9 17l-5-5",
  leaf: "M11 3C6 3 3 7 3 12c0 3 2 6 6 6 7 0 11-6 11-15-3 0-6 0-9 0z",
  bolt: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  paint: "M4 7h16v5H4zM8 12v4a4 4 0 004 4",
  broom: "M14 3l7 7-4 4-7-7zM10 11l-6 6 3 3 6-6",
};

export function ServiceIcon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.wrench;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

export const SERVICE_ICON_KEYS = Object.keys(PATHS);
