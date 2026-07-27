/**
 * Deterministic intent classification for a local service business.
 *
 * Ordered keyword rules — first match wins, so specific intents are checked
 * before general ones. No model, no API call, no per-message cost.
 */
import type { ChunkKind, Intent } from "./types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "greeting",
    patterns: [/^\s*(hi|hey|hello|yo|howdy|good (morning|afternoon|evening))\b/i],
  },
  {
    // Checked early: an emergency should never be answered with a pricing FAQ.
    intent: "urgent_damage",
    patterns: [
      /\b(emergency|urgent|asap|right now|leak(ing|s)?|water damage|storm|hail|wind|tarp|caved?|collapse)\b/i,
    ],
  },
  {
    intent: "estimate_pricing",
    patterns: [
      /\b(price|pricing|pricy|cost|costs|how much|quote|estimate|budget|afford|expensive|cheap|charge|financ(e|ing)|deposit|payment)\b/i,
    ],
  },
  {
    intent: "timeline",
    patterns: [
      /\b(how long|how soon|how fast|timeline|turnaround|lead time|when can|how quickly|take to|duration|days? does)\b/i,
    ],
  },
  {
    intent: "credentials",
    patterns: [
      /\b(licen[sc]ed?|licen[sc]e|insur(ed|ance)|bonded|warrant(y|ies)|guarantee|certifi(ed|cation)|credential|qualif|references|reviews?|testimonial)\b/i,
    ],
  },
  {
    intent: "service_area",
    patterns: [
      /\b(service area|do you (serve|cover|work in|come to|travel)|areas?|near me|my area|located|location|zip|county|counties|how far)\b/i,
    ],
  },
  {
    intent: "hours",
    patterns: [/\b(hours?|open|closed|weekend|saturday|sunday|what time|after hours)\b/i],
  },
  {
    intent: "booking",
    patterns: [
      /\b(book|schedule|appointment|come (out|over|by)|set up|sign up|get started|next step|inspect(ion)?|walk ?through)\b/i,
    ],
  },
  {
    intent: "contact",
    patterns: [
      /\b(contact|phone|number|call|email|text|reach|talk to|speak (to|with)|human|person|someone|address)\b/i,
    ],
  },
  {
    intent: "projects",
    patterns: [
      /\b(gallery|photos?|pictures?|portfolio|examples?|past work|previous|before and after|case stud)\b/i,
    ],
  },
  {
    intent: "services",
    patterns: [
      /\b(services?|what do you (do|offer)|what can you|do you (do|offer|install|replace|repair|handle))\b/i,
    ],
  },
  {
    intent: "about",
    patterns: [
      /\b(who are you|about (you|your)|your (story|company|team|owner)|how long have you|years? in business|family owned|experience)\b/i,
      /\b(who (owns|runs|started|founded)|owner|founder|established|since when)\b/i,
    ],
  },
  {
    intent: "smalltalk",
    patterns: [/\b(thanks|thank you|thx|bye|goodbye|what can you do|are you (a )?(bot|human|real))\b/i],
  },
];

/**
 * Messages that match no rule fall through to "fallback", which answers from
 * the best-matching page content when there is one and admits it doesn't know
 * when there isn't.
 */
export function classifyIntent(message: string): Intent {
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(message))) return rule.intent;
  }
  return "fallback";
}

/** Which parts of the site each intent should prefer when ranking matches. */
export const INTENT_KINDS: Record<Intent, ChunkKind[]> = {
  greeting: [],
  estimate_pricing: ["faq", "process"],
  services: ["service"],
  service_area: ["area"],
  hours: ["hours"],
  contact: ["contact"],
  booking: ["process", "contact"],
  urgent_damage: ["service", "faq"],
  credentials: ["trust", "faq"],
  timeline: ["faq", "process"],
  projects: ["project"],
  about: ["about"],
  smalltalk: [],
  // An unclassified question is usually about the work itself, so prefer the
  // services and FAQs over incidental matches in project write-ups.
  fallback: ["service", "faq"],
};
