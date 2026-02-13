import { useState } from "react";
import {
  Wrench,
  BookOpen,
  Shield,
  HelpCircle,
  Send,
  Loader2,
  Bot,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendQuestion } from "@/lib/api";
import { ReferenceCard } from "@/components/ReferenceCard";

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  question: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "tool",
    icon: Wrench,
    label: "Hangi Tool Gerekli?",
    question: "Bu iş için hangi tool ve ekipman gerekiyor?",
    color: "bg-thy-red/10 border-thy-red/30 text-thy-red",
  },
  {
    id: "easa",
    icon: Shield,
    label: "EASA Kuralı Nedir?",
    question: "Bu bakım işlemi için EASA gereksinimleri nelerdir?",
    color: "bg-amber-500/10 border-amber-500/30 text-amber-700",
  },
  {
    id: "amm",
    icon: BookOpen,
    label: "AMM Prosedürü",
    question: "Bu işlem için AMM prosedür adımları nelerdir?",
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700",
  },
  {
    id: "help",
    icon: HelpCircle,
    label: "Genel Yardım",
    question: "Bu bakım işlemi hakkında genel bilgi ver",
    color: "bg-slate-100 border-slate-300 text-zinc-700",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: { type: "AMM" | "EASA" | "FAA"; title: string; ref: string }[];
}

function parseReferences(content: string): {
  text: string;
  references: { type: "AMM" | "EASA" | "FAA"; title: string; ref: string }[];
} {
  const references: { type: "AMM" | "EASA" | "FAA"; title: string; ref: string }[] = [];
  let text = content;

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

export function MobileAICompanion() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  const handleQuickAction = async (action: QuickAction) => {
    if (loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: action.question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { answer } = await sendQuestion(action.question);
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
        content: "Bağlantı hatası. Lütfen tekrar deneyin.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

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
        content: "Bağlantı hatası. Lütfen tekrar deneyin.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-800 mb-1">
            AI Companion
          </h2>
          <p className="text-sm text-zinc-500 font-mono">
            Hızlı aksiyonlar ve teknik sorular
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className={cn(
                  "rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all",
                  "hover:shadow-md active:scale-95 disabled:opacity-50",
                  action.color
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold text-center leading-tight">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-3 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-xl border-2 p-4",
                  msg.role === "user"
                    ? "bg-thy-red/10 border-thy-red/30 ml-8"
                    : "bg-white border-slate-200 mr-8"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-thy-red/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-thy-red" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-600">
                      AI Asistan
                    </span>
                  </div>
                )}
                <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                {msg.references && msg.references.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.references.map((r, i) => (
                      <ReferenceCard
                        key={i}
                        type={r.type}
                        title={r.title}
                        reference={r.ref}
                        className="text-xs"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4 mr-8">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-thy-red/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-thy-red" />
                  </div>
                  <Loader2 className="w-4 h-4 animate-spin text-thy-red" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Input */}
        <form onSubmit={handleSubmit} className="mt-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Özel soru sorun..."
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-thy-red/50 focus:border-thy-red/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-thy-red px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[56px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
