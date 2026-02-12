import { useEffect, useState } from "react";
import { Loader2, LayoutList, User, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWorkPackages, updateWorkPackage } from "@/lib/api";
import { notifyDataUpdated, DATA_UPDATED } from "@/lib/events";

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
          <h2 className="text-lg font-semibold text-zinc-100">Scrum Board</h2>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">
          Jira/Trello tarzı Kanban – kartları sütunlar arası sürükleyerek durum güncelleyin
        </p>
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
