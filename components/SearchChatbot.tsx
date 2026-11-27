"use client";

import { useRef, useState } from "react";
import { SpotlightCard } from "./SpotlightCard";
import type { SearchRunParams } from "@/lib/use-search-pipeline";
import { SOCIAL_SITES } from "@/lib/social-sites";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  params?: SearchRunParams;
};

type ParsedIntentResponse = {
  intent: {
    siteId: string;
    niche: string;
    regions: string[];
    startPage: number;
    endPage: number;
    categoryName?: string;
    summary: string;
  };
};

const EXAMPLES = [
  "Instagram photographer United Kingdom pages 1 to 5",
  "LinkedIn marketing consultant Germany pages 2 to 4",
  "TikTok fitness coach Spain from page 1 to 3",
];

type Props = {
  disabled?: boolean;
  onParsingChange?: (parsing: boolean) => void;
  onIntentApplied: (params: SearchRunParams) => void;
  onAutoStart: (params: SearchRunParams) => Promise<void>;
};

export function SearchChatbot({
  disabled,
  onParsingChange,
  onIntentApplied,
  onAutoStart,
}: Props) {
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "Tell me how you want to search — site, niche, country, and page range. I’ll configure the pipeline and start automation for you.",
    },
  ]);
  const msgId = useRef(1);
  const listRef = useRef<HTMLUListElement>(null);

  function appendMessage(msg: Omit<ChatMessage, "id">) {
    msgId.current += 1;
    const entry = { ...msg, id: msgId.current };
    setMessages((prev) => [...prev, entry]);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
    return entry;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || parsing || disabled) return;

    setInput("");
    appendMessage({ role: "user", content: text });
    setParsing(true);
    onParsingChange?.(true);

    try {
      const res = await fetch("/api/search/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as ParsedIntentResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not parse request");
      }

      const { intent } = data;
      const params: SearchRunParams = {
        siteId: intent.siteId,
        niche: intent.niche,
        regions: intent.regions,
        startPage: intent.startPage,
        endPage: intent.endPage,
        categoryName: intent.categoryName,
      };

      onIntentApplied(params);

      appendMessage({
        role: "assistant",
        content: intent.summary,
        params,
      });

      appendMessage({
        role: "assistant",
        content: "Starting automation now — watch the log on the right.",
      });

      await onAutoStart(params);
    } catch (err) {
      appendMessage({
        role: "assistant",
        content:
          err instanceof Error
            ? err.message
            : "Something went wrong. Try rephrasing your search.",
      });
    } finally {
      setParsing(false);
      onParsingChange?.(false);
    }
  }

  function siteLabel(siteId: string) {
    return SOCIAL_SITES.find((s) => s.id === siteId)?.label ?? siteId;
  }

  return (
    <SpotlightCard
      title="Search assistant"
      subtitle="Natural language → auto pipeline"
      variant="cyber"
    >
      <ul
        ref={listRef}
        className="mb-4 max-h-[280px] space-y-3 overflow-y-auto pr-1 text-sm text-slate-200"
      >
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-tr-md bg-slate-900 px-4 py-2.5 text-slate-100"
                : "mr-8 rounded-2xl rounded-tl-md border border-white/10 bg-[#101e2c] px-4 py-2.5 text-slate-200 shadow-sm"
            }
          >
            <p>{m.content}</p>
            {m.params && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2 py-0.5 text-[11px] font-medium text-fuchsia-200">
                  {siteLabel(m.params.siteId)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                  {m.params.niche}
                </span>
                {m.params.regions.slice(0, 3).map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-100"
                  >
                    {r}
                  </span>
                ))}
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100">
                  p.{m.params.startPage}–{m.params.endPage}
                </span>
              </div>
            )}
          </li>
        ))}
        {parsing && (
          <li className="mr-8 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex gap-1">
              <span className="chat-dot h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span className="chat-dot chat-dot-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span className="chat-dot chat-dot-3 h-1.5 w-1.5 rounded-full bg-violet-500" />
            </span>
            Parsing your request…
          </li>
        )}
      </ul>

      <div className="mb-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={disabled || parsing}
            onClick={() => setInput(ex)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400 hover:border-cyan-400/40 hover:text-cyan-100 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Instagram photographer UK, pages 1–5"
          disabled={disabled || parsing}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#07111c] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          type="submit"
          disabled={disabled || parsing || !input.trim()}
          className="shrink-0 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-[#07111c] hover:bg-cyan-300 disabled:opacity-50"
        >
          {parsing ? "…" : "Go"}
        </button>
      </form>
    </SpotlightCard>
  );
}
