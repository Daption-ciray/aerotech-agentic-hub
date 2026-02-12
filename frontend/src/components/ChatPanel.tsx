import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendQuestion } from "@/lib/api";
import { ReferenceCard } from "./ReferenceCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: { type: "AMM" | "EASA" | "FAA"; title: string; ref: string }[];
}

// Parse assistant response for potential reference markers
function parseReferences(content: string): {
  text: string;
  references: { type: "AMM" | "EASA" | "FAA"; title: string; ref: string }[];
} {
  const references: { type: "AMM" | "EASA" | "FAA"; title: string; ref: string }[] = [];
  let text = content;

  // Match patterns like [AMM: Title - Ref] or [EASA: ...]
  const refRegex = /\[(AMM|EASA|FAA):\s*([^\]]+)\]/g;
  let match;
  while ((match = refRegex.exec(content)) !== null) {
    const [, type, rest] = match;
    const parts = rest.split(" - ");
    const title = parts[0]?.trim() || "Reference";
    const ref = parts[1]?.trim() || rest;
    references.push({
      type: type as "AMM" | "EASA" | "FAA",
      title,
      ref,
    });
  }
  text = content.replace(refRegex, "").trim();

  return { text, references };
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Merhaba. AeroTech Intelligence asistanına hoş geldiniz. Uçak bakımı, AMM prosedürleri, EASA/FAA sertifikasyon gereksinimleri ve teknik sorularınız için size yardımcı olacağım. Örneğin: «Aileron/Elevator nedir?» veya «A320 elevator trim sisteminin bakım adımları nelerdir?»",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { answer } = await sendQuestion(q);
      const { text, references } = parseReferences(answer);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text || answer,
        references: references.length > 0 ? references : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Bağlantı hatası. Lütfen API sunucusunun çalıştığından emin olun (uvicorn app.main:app).",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-zinc-800">
          Akıllı Sohbet Paneli
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Teknik sorular, AMM referansları ve EASA/FAA gereksinimleri
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-6"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-thy-red/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-thy-red" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-3",
                msg.role === "user"
                  ? "bg-thy-red/15 border border-thy-red/30 text-zinc-800"
                  : "bg-slate-100 border border-slate-200 text-zinc-800"
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              {msg.references && msg.references.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {msg.references.map((r, i) => (
                    <ReferenceCard
                      key={i}
                      type={r.type}
                      title={r.title}
                      reference={r.ref}
                    />
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-zinc-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-thy-red/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-thy-red" />
            </div>
            <div className="rounded-lg px-4 py-3 bg-slate-100 border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-thy-red" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 p-4 border-t border-slate-200"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Aileron/Elevator nedir? veya teknik bir soru sorun..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-thy-red/50 focus:border-thy-red/50 font-sans"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-thy-red px-4 py-3 text-sm font-semibold text-white hover:bg-thy-red-hover focus:outline-none focus:ring-2 focus:ring-thy-red/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Gönder
          </button>
        </div>
      </form>
    </div>
  );
}
