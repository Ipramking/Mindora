"use client";

import { useRef, useState } from "react";
import type { ChatCitation, ChatMessage, ChatTone } from "@/lib/supabase/types";

type DisplayMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[] | null;
};

const TONE_OPTIONS: { value: ChatTone; label: string }[] = [
  { value: "explain_like_5", label: "Explain like I'm 5" },
  { value: "standard", label: "Standard" },
  { value: "expert", label: "Expert" },
];

export function ChatPanel({
  courseId,
  initialSessionId,
  initialMessages,
  initialTone,
}: {
  courseId: string;
  initialSessionId: string | null;
  initialMessages: ChatMessage[];
  initialTone: ChatTone;
}) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<DisplayMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content, citations: m.cited_chunks }))
  );
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<ChatTone>(initialTone);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, sessionId, message: text, tone }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to get a response.");
      }

      const newSessionId = res.headers.get("X-Chat-Session-Id");
      if (newSessionId) setSessionId(newSessionId);

      let citations: ChatCitation[] = [];
      const citationsHeader = res.headers.get("X-Chat-Citations");
      if (citationsHeader) {
        try {
          citations = JSON.parse(atob(citationsHeader));
        } catch {
          citations = [];
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, citations };
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="tone" className="text-sm text-zinc-500 dark:text-zinc-400">
          Tone
        </label>
        <select
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value as ChatTone)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {TONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ask me anything about this course&apos;s materials — I&apos;ll explain it, cite
            sources, and check your understanding along the way.
          </p>
        )}

        {messages.map((message, i) => (
          <div key={i} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                message.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              }`}
            >
              {message.content || (pending && i === messages.length - 1 ? "Thinking..." : "")}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  {message.citations.map((c, idx) => (
                    <span
                      key={c.chunk_id}
                      className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                      title={c.material_title}
                    >
                      [{idx + 1}] {c.material_title}
                      {c.page_number != null ? `, p.${c.page_number}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your materials..."
          disabled={pending}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
