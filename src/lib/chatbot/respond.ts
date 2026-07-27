/**
 * Turns an intent plus retrieval hits into a reply.
 *
 * Every sentence here is either (a) fixed connective phrasing, or (b) copy
 * lifted verbatim from the site's own content. The bot never states a price, a
 * timeline, a credential, or a service it cannot point to on the page — when
 * nothing matches, it says so and hands off to a human.
 */
import type {
  ChatCta,
  ChatResponse,
  ChunkKind,
  Intent,
  KnowledgeBase,
  KnowledgeChunk,
  RetrievalHit,
} from "./types";
import { confidentTop, firstOfKind, strongTop } from "./retrieve";

export interface RespondInput {
  intent: Intent;
  hits: RetrievalHit[];
  kb: KnowledgeBase;
}

export function respond({ intent, hits, kb }: RespondInput): ChatResponse {
  const p = kb.persona;
  const estimateCta: ChatCta = { label: "Get a free estimate", href: p.estimateHref };
  const callCta: ChatCta = { label: `Call ${p.phone}`, href: p.telHref };
  const top = confidentTop(hits);

  switch (intent) {
    case "greeting":
      return reply({
        text: p.isDemo
          ? `${p.greeting}\n\n(Heads up: ${p.businessName} is a fictional business used to demonstrate this website template.)`
          : p.greeting,
        intent,
        kb,
        used: [],
        cta: estimateCta,
      });

    case "services": {
      const service = firstOfKind(hits, "service");
      const text = service
        ? `${service.chunk.answer}\n\nWe also handle:\n${serviceList(
            p.serviceNames.filter((n) => n !== service.chunk.title),
          )}`
        : `Here's what we handle:\n${serviceList(p.serviceNames)}\n\nWhich one are you looking into?`;
      return reply({ text, intent, kb, used: service ? [service.chunk] : [], cta: estimateCta });
    }

    case "estimate_pricing": {
      // Only answer from an unambiguous match — a loosely related page would
      // read as a pricing commitment.
      const priced = strongTop(hits);
      if (priced) {
        return reply({
          text: priced.chunk.answer,
          intent,
          kb,
          used: [priced.chunk],
          cta: estimateCta,
        });
      }
      return reply({
        text:
          `I don't have pricing details published on the site, and I'd rather not guess at a number ` +
          `for your project. The fastest way to real figures is a free estimate — or call us at ${p.phone}.`,
        intent,
        kb,
        used: [],
        cta: estimateCta,
      });
    }

    case "timeline": {
      const timed = strongTop(hits);
      if (timed) {
        return reply({
          text: timed.chunk.answer,
          intent,
          kb,
          used: [timed.chunk],
          cta: estimateCta,
        });
      }
      return reply({
        text:
          `Timelines depend on the specific job, and I don't want to promise a date I can't back up. ` +
          `Ask us directly at ${p.phone} and we'll give you a realistic answer for your project.`,
        intent,
        kb,
        used: [],
        cta: callCta,
      });
    }

    case "credentials": {
      // The published FAQ answer (if the question matched one) reads better than
      // the trust badges alone, so lead with it and back it with the badges.
      const faq = firstOfKind(hits, "faq")?.chunk;
      const trust = firstOfKind(hits, "trust")?.chunk ?? kindChunk(kb, "trust");
      const used = [faq, trust].filter(Boolean) as KnowledgeChunk[];
      const parts = [faq?.answer, trust ? `Where we stand:\n${trust.answer}` : undefined].filter(
        Boolean,
      ) as string[];
      return reply({
        text: parts.length ? parts.join("\n\n") : notFound(kb),
        intent,
        kb,
        used,
        cta: estimateCta,
      });
    }

    case "service_area": {
      const area = kindChunk(kb, "area");
      return reply({
        text: area ? area.answer : notFound(kb),
        intent,
        kb,
        used: area ? [area] : [],
        cta: estimateCta,
      });
    }

    case "hours": {
      const hours = kindChunk(kb, "hours");
      return reply({
        text: hours
          ? `${hours.answer}\n\nOutside those hours you can still send a request and we'll follow up.`
          : notFound(kb),
        intent,
        kb,
        used: hours ? [hours] : [],
        cta: estimateCta,
      });
    }

    case "contact": {
      const contact = kindChunk(kb, "contact");
      return reply({
        text: contact ? contact.answer : notFound(kb),
        intent,
        kb,
        used: contact ? [contact] : [],
        cta: callCta,
      });
    }

    case "booking": {
      const process = kb.byId["process:all"];
      const tail = `\n\nStart with the free estimate request on this page, or call ${p.phone}.`;
      return reply({
        text: process
          ? `Happy to get you on the schedule.\n\n${process.answer}${tail}`
          : `Happy to get you on the schedule.${tail}`,
        intent,
        kb,
        used: process ? [process] : [],
        cta: estimateCta,
      });
    }

    case "urgent_damage": {
      const related = (firstOfKind(hits, "service") ?? firstOfKind(hits, "faq"))?.chunk;
      const lead = `If something is actively leaking or unsafe, calling ${p.phone} is the fastest way to reach us.`;
      return reply({
        text: related ? `${lead}\n\n${related.answer}` : lead,
        intent,
        kb,
        used: related ? [related] : [],
        cta: callCta,
      });
    }

    case "projects": {
      const index = kb.byId["project:index"];
      const specific = firstOfKind(hits, "project");
      const chunk = specific && specific.chunk.id !== "project:index" ? specific.chunk : index;
      return reply({
        text: chunk ? chunk.answer : notFound(kb),
        intent,
        kb,
        used: chunk ? [chunk] : [],
        cta: { label: "See the gallery", href: p.galleryHref },
      });
    }

    case "about": {
      const about = top?.chunk.kind === "about" ? top.chunk : kb.byId["about:story"];
      return reply({
        text: about ? about.answer : notFound(kb),
        intent,
        kb,
        used: about ? [about] : [],
        cta: { label: "Read our story", href: "/about" },
      });
    }

    case "smalltalk":
      return reply({
        text:
          `Happy to help. I'm the ${p.businessName} assistant — I answer from what's published on this ` +
          `site: services, service area, licensing, hours, and how estimates work.`,
        intent,
        kb,
        used: [],
        cta: estimateCta,
      });

    case "fallback":
    default: {
      if (top) {
        // A strong match answers plainly. A weaker one is flagged as a guess
        // and followed by the real service list, so an off-topic question
        // ("do you sell hot tubs?") still gets a useful, honest reply.
        return reply({
          text: strongTop(hits)
            ? top.chunk.answer
            : `Here's the closest thing I found on our site:\n\n${top.chunk.answer}\n\n` +
              `If you were asking about something else, here's what we handle:\n${serviceList(p.serviceNames)}`,
          intent: "fallback",
          kb,
          used: [top.chunk],
          cta: estimateCta,
        });
      }
      // Nothing matched. Say so, then show what this business actually does —
      // that answers "do you also do X?" honestly instead of guessing.
      return reply({
        text: `${notFound(kb)}\n\nWhat we do handle:\n${serviceList(p.serviceNames)}`,
        intent: "fallback",
        kb,
        used: [],
        cta: callCta,
      });
    }
  }
}

/* ------------------------------- helpers -------------------------------- */

function serviceList(names: string[]): string {
  return names.map((n) => `• ${n}`).join("\n");
}

function notFound(kb: KnowledgeBase): string {
  const p = kb.persona;
  return (
    `I couldn't find that on our site, and I'd rather point you to a person than guess. ` +
    `Call ${p.phone}, email ${p.email}, or send an estimate request and we'll get back to you.`
  );
}

function reply(args: {
  text: string;
  intent: Intent;
  kb: KnowledgeBase;
  used: KnowledgeChunk[];
  cta?: ChatCta;
}): ChatResponse {
  const { text, intent, kb, used, cta } = args;
  return {
    text: text.trim(),
    intent,
    suggestions: suggestions(kb, used.map((c) => c.title)),
    cta,
    sources: dedupeSources(used),
    mode: "rules",
  };
}

/**
 * Quick-reply chips, always real questions this site can answer: published FAQs
 * first, then a nudge toward the actual service list.
 */
function suggestions(kb: KnowledgeBase, exclude: string[]): string[] {
  const p = kb.persona;
  const pool = [
    ...p.faqQuestions,
    p.serviceNames[0] ? `Do you do ${p.serviceNames[0].toLowerCase()}?` : "",
    "What areas do you serve?",
    "How do I get an estimate?",
  ].filter(Boolean);

  const seen = new Set(exclude.map((e) => e.toLowerCase()));
  const out: string[] = [];
  for (const q of pool) {
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length === 3) break;
  }
  return out;
}

function dedupeSources(chunks: KnowledgeChunk[]): { title: string; href: string }[] {
  const seen = new Set<string>();
  const out: { title: string; href: string }[] = [];
  for (const c of chunks) {
    const key = `${c.title}|${c.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title: c.title, href: c.href });
  }
  return out;
}

function kindChunk(kb: KnowledgeBase, kind: ChunkKind): KnowledgeChunk | undefined {
  return Object.values(kb.byId).find((c) => c.kind === kind);
}
