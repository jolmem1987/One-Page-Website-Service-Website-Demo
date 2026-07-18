"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live character counter with gentle guidance. Attaches to the input or
 * textarea immediately preceding it in the DOM. Provides recommendations rather
 * than hard limits, so reasonable content is never blocked.
 */
export function CharCount({
  value,
  min,
  max,
  hint,
}: {
  value: string;
  min: number;
  max: number;
  hint?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [len, setLen] = useState(value.length);

  useEffect(() => {
    const el = ref.current?.previousElementSibling as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || !("value" in el)) return;
    const handler = () => setLen(el.value.length);
    handler();
    el.addEventListener("input", handler);
    return () => el.removeEventListener("input", handler);
  }, []);

  const withinRange = len >= min && len <= max;
  const tone = len === 0 ? "text-black/50" : withinRange ? "text-green-700" : "text-amber-700";

  return (
    <p ref={ref} className={`mt-1 text-xs ${tone}`}>
      {len} characters · recommended {min}–{max}
      {hint ? ` · ${hint}` : ""}
    </p>
  );
}
