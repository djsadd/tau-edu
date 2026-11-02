"use client";

import { Bot, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Message = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "tau-chat";
const INTERNAL_LINK = /^\/(?!\/)/;

/** Только жирный текст и ссылки. Ответ модели не вставляется как HTML. */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[3]) {
      out.push(<strong key={out.length}>{match[3]}</strong>);
    } else if (INTERNAL_LINK.test(match[2])) {
      out.push(<Link key={out.length} href={match[2]} className="font-medium text-burgundy-700 underline">{match[1]}</Link>);
    } else if (/^https:\/\//.test(match[2])) {
      out.push(<a key={out.length} href={match[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-burgundy-700 underline">{match[1]}</a>);
    } else {
      out.push(match[1]);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Answer({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const content = renderInline(line.replace(/^\s*[-*•]\s+/, ""));
        if (!line.trim()) return <div key={i} className="h-2" />;
        return bullet ? (
          <div key={i} className="flex gap-2 pl-1"><span className="text-burgundy-700" aria-hidden="true">•</span><span>{content}</span></div>
        ) : (
          <Fragment key={i}><span className="block">{content}</span></Fragment>
        );
      })}
    </>
  );
}

export function ChatWidget({ locale, labels, closeLabel }: { locale: Locale; labels: Dictionary["chat"]; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // Хранилище недоступно: диалог просто не переживёт перезагрузку страницы.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // См. выше.
    }
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    const history: Message[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const setAnswer = (answer: string) =>
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", content: answer }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, locale }),
      });
      if (response.status === 429) {
        setAnswer(labels.rateLimited);
        return;
      }
      if (!response.ok || !response.body) throw new Error("chat failed");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setAnswer(answer);
      }
      if (!answer) setAnswer(labels.error);
    } catch {
      setAnswer(labels.error);
    } finally {
      setStreaming(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  return (
    <>
      {!open && (
        <button
          ref={launcher}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={labels.open}
          title={labels.open}
          className="group animate-pop fixed bottom-5 left-5 z-40 flex h-14 items-center rounded-full bg-burgundy-700 px-4 font-semibold text-white shadow-lift ring-4 ring-white transition-colors hover:bg-burgundy-900 focus-visible:bg-burgundy-900"
        >
          <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span aria-hidden="true" className="max-w-0 overflow-hidden whitespace-nowrap text-sm transition-all duration-200 group-hover:ml-2.5 group-hover:max-w-48 group-focus-visible:ml-2.5 group-focus-visible:max-w-48">{labels.open}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={labels.title}
          onKeyDown={(e) => { if (e.key === "Escape") close(); }}
          className="animate-pop fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col border border-line bg-white shadow-lift sm:inset-x-auto sm:bottom-5 sm:left-5 sm:h-[min(38rem,calc(100dvh-2.5rem))] sm:w-[25rem]"
        >
          <header className="flex items-center gap-3 bg-burgundy-800 px-4 py-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"><Bot className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-serif font-semibold leading-tight">{labels.title}</div>
              <div className="mt-0.5 text-xs text-burgundy-200">{labels.subtitle}</div>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => setMessages([])} disabled={streaming} aria-label={labels.clear} title={labels.clear} className="p-1.5 opacity-80 hover:opacity-100 disabled:opacity-40">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <button type="button" onClick={close} aria-label={closeLabel} className="p-1.5 opacity-80 hover:opacity-100">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-burgundy-50/60 p-4 text-[0.9375rem] leading-relaxed" aria-live="polite">
            <div className="max-w-[90%] border border-line bg-white px-3.5 py-2.5">{labels.greeting}</div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {labels.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="border border-burgundy-300 bg-white px-3 py-1.5 text-sm font-medium text-burgundy-800 hover:bg-burgundy-100">{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words bg-burgundy-700 px-3.5 py-2.5 text-white">{m.content}</div>
              ) : (
                <div key={i} className="w-fit max-w-[90%] break-words border border-line bg-white px-3.5 py-2.5">
                  {m.content ? <Answer text={m.content} /> : (
                    <span className="flex gap-1 py-1.5" aria-hidden="true">
                      {[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-burgundy-400" style={{ animationDelay: `${d}ms` }} />)}
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-line p-3">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={labels.placeholder}
              aria-label={labels.placeholder}
              className="field max-h-28 min-h-11 flex-1 resize-none"
            />
            <button type="submit" disabled={streaming || !input.trim()} aria-label={labels.send} className="flex h-11 w-11 shrink-0 items-center justify-center bg-burgundy-700 text-white hover:bg-burgundy-900 disabled:opacity-40">
              <Send className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[0.6875rem] leading-snug text-muted">{labels.disclaimer}</p>
        </div>
      )}
    </>
  );
}
