# On-Site Assistant (chat widget)

A chat bubble in the corner of every public page. It answers visitor questions
from **this site's own published content** — services, FAQs, process, service
area, hours, projects, and business details — and pushes toward the estimate
form or a phone call.

It needs **no API key, no external service, and costs nothing per message**.

## Why it can't make things up

The assistant is a *retrieval* system, not a text generator. At request time the
site's live config is compiled into a small searchable index, and every reply is
assembled from two things only:

1. fixed connective phrasing ("Here's what we handle:"), and
2. copy lifted **verbatim** from the site's own content.

There is no path by which it can state a price, a timeline, a credential, or a
service that isn't already published on the page. When nothing matches well
enough it says so and hands off to the phone number and estimate form.

## How grounding works

```
getSiteConfig()          the same content the pages render (DB, or the demo config)
  → buildKnowledgeBase() ~40 chunks: one per service, FAQ, process step, project,
                         about section, plus service area / hours / contact / trust
  → retrieve()           BM25 keyword search, biased by intent and current page
  → classifyIntent()     ordered keyword rules (pricing, service area, urgent, …)
  → respond()            templated reply + CTA + quick replies + source links
```

Because the knowledge base is rebuilt per request, **content edited in the admin
panel changes the bot's answers immediately**. There is no crawl step, no index
file to regenerate, and nothing to keep in sync.

| File | Role |
|---|---|
| `src/lib/chatbot/knowledge.ts` | turns `SiteConfig` into searchable chunks — **the grounding** |
| `src/lib/chatbot/bm25.ts`, `tokenizer.ts` | the whole search engine, no dependencies |
| `src/lib/chatbot/retrieve.ts` | ranking + the two confidence thresholds |
| `src/lib/chatbot/intents.ts` | keyword intent rules for a local service business |
| `src/lib/chatbot/respond.ts` | reply templates, CTAs, quick replies |
| `src/lib/chatbot/llm.ts` | optional OpenAI rewrite (off by default) |
| `src/app/api/chat/route.ts` | the endpoint (rate limited, same-origin) |
| `src/components/site/ChatWidget.tsx` | the UI, themed by the brand CSS variables |

Mounted once in `src/app/(public)/layout.tsx`, so it appears on the public site
but never in the admin panel.

## Confidence thresholds

Two loose tiers in `retrieve.ts` decide how boldly the bot answers:

- `MIN_CONFIDENT_SCORE` — show the match, hedged as "the closest thing I found".
- `MIN_STRONG_SCORE` — required before answering questions where a tangential
  match would read as a commitment (pricing, timelines). Below it the bot says
  the detail isn't published and points to a human.

If the bot feels too cautious or too eager for a particular customer's content,
these are the two numbers to tune.

## Tuning for a new customer

Nothing in the chatbot is roofing-specific — it reads whatever services and FAQs
are configured. Two optional touch-ups when launching a new site:

1. **FAQs do the heavy lifting.** Every FAQ you add becomes a verbatim answer the
   bot can give. The fastest way to make the bot smarter is to add FAQs in
   `/admin/content`.
2. **Trade vocabulary.** `intents.ts` recognises words like *leak*, *storm*, and
   *hail* as urgent. For a plumber or an electrician, swap those for the terms
   that trade's customers actually type.

## Optional: OpenAI phrasing

Off by default. When enabled, retrieval is unchanged — only the *wording* of the
reply is generated, and strictly from the retrieved site copy. CTAs, quick
replies, and source links still come from the rules engine, and any API error
(bad key, rate limit, timeout) silently falls back to the templates so the bot
never goes dark.

```bash
CHATBOT_AI="true"
OPENAI_API_KEY="sk-…"
# optional
CHATBOT_AI_MODEL="gpt-4o-mini"
CHATBOT_AI_PROMPT="Extra instructions appended to the grounding prompt."
OPENAI_BASE_URL="https://api.openai.com/v1"
```

The key is read server-side only, inside the API route — it is never sent to the
browser. Each deployment pays for its own usage; leaving `CHATBOT_AI` unset keeps
the bot free and deterministic.

## Demo behaviour

While `isDemo` is on, the assistant's opening message discloses that the business
is fictional, and sample testimonials are labelled as sample content when quoted.
Turning demo mode off for a real customer removes both.
