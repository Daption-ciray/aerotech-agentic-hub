import { useEffect, useState } from "react";
import { Loader2, LayoutList, User, Calendar, ArrowRight, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWorkPackages, updateWorkPackage, sprintPlan } from "@/lib/api";
import { notifyDataUpdated, DATA_UPDATED } from "@/lib/events";

const EXAMPLE_COMMANDS = [
  "Tüm backlog öğelerini listele",
  "Yeni item ekle: A320 elevator trim kontrolü",
  "Todo durumundaki işleri göster",
  "Aileron hinge bracket controlünü devam ediyora al",
];

type WpStatus = "pending" | "in_progress" | "approved";
type Wp = { id: string; title: string; aircraft?: string; ata?: string; status: string; assigned_to?: string | null; due_date?: string };

const COLUMNS: { id: WpStatus; label: string }[] = [
  { id: "pending", label: "Beklemede" },
  { id: "in_progress", label: "Devam Ediyor" },
  { id: "approved", label: "Tamamlandı" },
];

export function SprintPlanningPage() {
  const [packages, setPackages] = useState<Wp[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<WpStatus | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [nlpInput, setNlpInput] = useState("");
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState<Record<string, unknown> | null>(null);

  const load = async () => {
    try {
      const data = await fetchWorkPackages();
      setPackages(data);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(DATA_UPDATED, handler);
    return () => window.removeEventListener(DATA_UPDATED, handler);
  }, []);

  const moveTo = async (id: string, newStatus: WpStatus) => {
    setUpdating(id);
    try {
      await updateWorkPackage(id, { status: newStatus });
      notifyDataUpdated();
      await load();
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  const handleNlpSubmit = async () => {
    const q = nlpInput.trim();
    if (!q || nlpLoading) return;
    setNlpLoading(true);
    setNlpResult(null);
    try {
      const res = await sprintPlan(q);
      setNlpResult(res);
      await load();
      if (res.operation === "create_items" || res.operation === "update_status") {
        notifyDataUpdated();
      }
    } catch {
      setNlpResult({ error: "İstek başarısız" });
    } finally {
      setNlpLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: WpStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(status);
  };

  const handleDragLeave = () => setDropTarget(null);

  const handleDrop = (e: React.DragEvent, targetStatus: WpStatus) => {
    e.preventDefault();
    setDropTarget(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveTo(id, targetStatus);
    setDraggedId(null);
  };

  const getItemsByStatus = (status: WpStatus) =>
    packages.filter((p) => (p.status || "pending") === status);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-thy-red" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-thy-red" />
          <h2 className="text-lg font-semibold text-zinc-100">Sprint Planlama</h2>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">
          Doğal dil ile backlog yönetimi – listeleme, yeni öğe ekleme, durum güncelleme
        </p>
      </div>

      {/* Komut Gir + Örnek Komutlar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-thy-red" />
          <span className="text-sm font-medium text-zinc-300">Komut Gir</span>
        </div>
        <div className="flex gap-2">
          <input
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNlpSubmit()}
            placeholder="Örn: Tüm backlog öğelerini listele, Yeni item ekle: Elevator tamiri..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-thy-red/50"
            disabled={nlpLoading}
          />
          <button
            onClick={handleNlpSubmit}
            disabled={nlpLoading || !nlpInput.trim()}
            className="rounded-lg bg-thy-red px-4 py-3 text-sm font-semibold text-white hover:bg-thy-red/90 disabled:opacity-50 flex items-center gap-2"
          >
            {nlpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gönder
          </button>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-2">Örnek Komutlar</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => { setNlpInput(cmd); }}
                className="rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs text-zinc-300 hover:bg-slate-700 hover:border-slate-500 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
        {nlpResult && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm">
            {nlpResult.error ? (
              <p className="text-amber-400">{String(nlpResult.error)}</p>
            ) : null}
            {nlpResult.operation === "create_items" && (
              <p className="text-emerald-400">
                {Array.isArray(nlpResult.created) ? nlpResult.created.length : 0} öğe eklendi. Backlog: {String(nlpResult.backlog_size ?? 0)}
              </p>
            )}
            {nlpResult.operation === "update_status" && nlpResult.item && (
              <p className="text-emerald-400">
                Durum güncellendi: {String((nlpResult.item as Record<string, unknown>).title ?? "")}
              </p>
            )}
            {nlpResult.operation === "list_items" && Array.isArray(nlpResult.items) && (nlpResult.items as unknown[]).length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {(nlpResult.items as Array<{ id: string; title: string; status: string }>).map((i) => (
                  <div key={i.id} className="flex justify-between gap-2 text-zinc-300">
                    <span className="truncate">{i.title}</span>
                    <span className={cn(
                      "flex-shrink-0",
                      i.status === "done" ? "text-emerald-400" : i.status === "in_progress" ? "text-amber-400" : "text-zinc-500"
                    )}>
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {nlpResult.operation === "list_items" && (!Array.isArray(nlpResult.items) || (nlpResult.items as unknown[]).length === 0) && (
              <p className="text-zinc-500">Öğe bulunamadı.</p>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-slate-800">
        <p className="text-xs text-zinc-500">Jira/Trello tarzı Kanban – kartları sürükleyerek durum güncelleyin</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((col) => {
            const items = getItemsByStatus(col.id);
            const isDropTarget = dropTarget === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={cn(
                  "w-72 flex-shrink-0 flex flex-col rounded-lg border-2 transition-colors",
                  isDropTarget
                    ? "border-thy-red bg-thy-red/10"
                    : "border-slate-700 bg-slate-900/30"
                )}
              >
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100">{col.label}</h3>
                  <span className="text-xs font-mono text-zinc-500 bg-slate-800 px-2 py-0.5 rounded">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin min-h-[200px]">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      item={item}
                      isDragging={draggedId === item.id}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onMoveTo={(status) => moveTo(item.id, status)}
                      updating={updating === item.id}
                      columns={COLUMNS}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Card({
  item,
  isDragging,
  onDragStart,
  onMoveTo,
  updating,
  columns,
}: {
  item: Wp;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onMoveTo: (status: WpStatus) => void;
  updating: boolean;
  columns: { id: WpStatus; label: string }[];
}) {
  const currentIdx = columns.findIndex((c) => c.id === (item.status || "pending"));
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx >= 0 && currentIdx < columns.length - 1;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-800/80 p-3 cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 scale-95",
        updating && "opacity-60 pointer-events-none"
      )}
    >
      <p className="text-sm font-medium text-zinc-100 line-clamp-2">{item.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono">{item.id}</span>
        {item.assigned_to && (
          <span className="flex items-center gap-0.5">
            <User className="w-3 h-3" /> {item.assigned_to}
          </span>
        )}
        {item.due_date && (
          <span className="flex items-center gap-0.5">
            <Calendar className="w-3 h-3" /> {item.due_date}
          </span>
        )}
      </div>
      <div className="mt-2 flex gap-1">
        {canMoveLeft && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveTo(columns[currentIdx - 1].id); }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:bg-slate-700 hover:text-zinc-100"
            title={columns[currentIdx - 1].label}
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> Önceki
          </button>
        )}
        {canMoveRight && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveTo(columns[currentIdx + 1].id); }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:bg-slate-700 hover:text-zinc-100"
            title={columns[currentIdx + 1].label}
          >
            Sonraki <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
