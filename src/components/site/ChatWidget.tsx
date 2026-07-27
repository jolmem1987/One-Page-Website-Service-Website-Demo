"use client";

/**
 * The on-site assistant.
 *
 * A small launcher in the corner opens a panel that talks to this site's own
 * `/api/chat` endpoint. Nothing is loaded from a third party and no chat data
 * leaves this deployment — answers are composed from the site's published
 * content (services, FAQs, service area, hours, projects).
 *
 * Styling uses the same brand CSS variables as the rest of the site, so it
 * rebrands automatically along with everything else.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Cta {
  label: string;
  href: string;
}

interface Source {
  title: string;
  href: string;
}

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  cta?: Cta;
  sources?: Source[];
  error?: boolean;
}

interface ApiReply {
  ok: boolean;
  error?: string;
  reply?: {
    text: string;
    suggestions: string[];
    cta?: Cta;
    sources?: Source[];
  };
}

export interface ChatWidgetProps {
  businessName: string;
  greeting: string;
  /** Opening quick-reply chips, generated from the site's real FAQs. */
  suggestions: string[];
}

export function ChatWidget({ businessName, greeting, suggestions }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", text: greeting },
  ]);
  const [chips, setChips] = useState<string[]>(suggestions);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || pending) return;

      const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      setMessages((prev) => [...prev, { id: nextId.current++, role: "user", text }]);
      setInput("");
      setChips([]);
      setPending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: text,
            page: { path: window.location.pathname, title: document.title },
            history,
          }),
        });
        const data = (await res.json()) as ApiReply;

        if (!data.ok || !data.reply) {
          throw new Error(data.error || "Request failed");
        }

        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: "bot",
            text: data.reply!.text,
            cta: data.reply!.cta,
            sources: data.reply!.sources,
          },
        ]);
        setChips(data.reply.suggestions ?? []);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: "bot",
            error: true,
            text:
              err instanceof Error && err.message
                ? err.message
                : "Sorry — I couldn't reach the site just now. Please try again.",
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [messages, pending],
  );

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-chat-panel"
        className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg",
          "transition-transform hover:scale-[1.03] focus:outline-none",
          open && "hidden sm:flex",
        )}
        style={{ backgroundColor: "rgb(var(--brand-accent))", color: "rgb(var(--brand-on-primary))" }}
      >
        <ChatIcon className="h-5 w-5" />
        <span>{open ? "Close chat" : "Ask a question"}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          id="site-chat-panel"
          role="dialog"
          aria-label={`Chat with ${businessName}`}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-t-xl border border-black/10 bg-white shadow-2xl",
            "inset-x-0 bottom-0 h-[85vh] sm:inset-x-auto sm:bottom-20 sm:right-4 sm:h-[32rem] sm:w-[24rem] sm:rounded-xl",
          )}
        >
          <header
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: "rgb(var(--brand-primary))" }}
          >
            <div>
              <p className="font-heading text-base font-bold leading-tight">{businessName}</p>
              <p className="text-xs text-white/75">Answers from this site&rsquo;s own content</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-muted px-4 py-4"
            aria-live="polite"
          >
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}

            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-black/50 shadow-sm">
                  <span className="sr-only">Looking that up</span>
                  <Dots />
                </div>
              </div>
            )}

            {!pending && chips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => void send(c)}
                    className="rounded-full border border-brand-accent/50 bg-white px-3 py-1.5 text-left text-xs font-medium text-brand-primary hover:border-brand-accent hover:bg-brand-accent/5"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-black/10 bg-white px-3 py-3"
          >
            <label htmlFor="site-chat-input" className="sr-only">
              Your question
            </label>
            <input
              id="site-chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder="Ask about services, areas, estimates…"
              className="field-input flex-1"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="btn btn-primary px-4 py-2"
              aria-label="Send message"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <p
          className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
          style={{ backgroundColor: "rgb(var(--brand-secondary))" }}
        >
          {message.text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[92%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm",
          message.error && "border border-red-200 bg-red-50",
        )}
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{message.text}</p>

        {message.cta && (
          <a href={message.cta.href} className="btn btn-primary mt-3 w-full text-xs">
            {message.cta.label}
          </a>
        )}

        {message.sources && message.sources.length > 0 && (
          <p className="mt-2 text-[11px] text-black/50">
            From:{" "}
            {message.sources.map((s, i) => (
              <span key={`${s.href}-${s.title}`}>
                {i > 0 && ", "}
                <a href={s.href} className="underline hover:text-brand-accent">
                  {s.title}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/30"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
