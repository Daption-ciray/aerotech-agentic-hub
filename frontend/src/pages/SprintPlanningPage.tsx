import { useEffect, useState } from "react";
import { Loader2, LayoutList, User, Calendar, ArrowRight, Play, Square, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWorkPackages, updateWorkPackage, fetchSprintState, startSprint, endSprint } from "@/lib/api";
import { notifyDataUpdated, DATA_UPDATED } from "@/lib/events";
import { CrudModal } from "@/components/CrudModal";

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
  const [sprintState, setSprintState] = useState<{ status: string; name?: string | null; goal?: string | null; days_remaining?: number } | null>(null);
  const [sprintActionLoading, setSprintActionLoading] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);

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

  const loadSprintState = async () => {
    try {
      const s = await fetchSprintState();
      setSprintState(s);
    } catch {
      setSprintState(null);
    }
  };

  useEffect(() => {
    load();
    loadSprintState();
    const handler = () => { load(); loadSprintState(); };
    window.addEventListener(DATA_UPDATED, handler);
    return () => window.removeEventListener(DATA_UPDATED, handler);
  }, []);

  const handleStartSprint = () => {
    setStartModalOpen(true);
  };

  const handleEndSprint = async () => {
    if (!confirm("Sprinti bitirmek istediğinize emin misiniz?")) return;
    setSprintActionLoading(true);
    try {
      await endSprint();
      await loadSprintState();
      notifyDataUpdated();
    } catch {
      alert("Sprint bitirilemedi");
    } finally {
      setSprintActionLoading(false);
    }
  };

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
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-thy-red" />
              <h2 className="text-lg font-semibold text-zinc-800">Sprint Planlama</h2>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              Jira/Trello tarzı Kanban – kartları sürükleyerek veya Önceki/Sonraki ile durum güncelleyin
            </p>
          </div>
          <div className="flex items-center gap-2">
            {sprintState?.status === "active" && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-emerald-700 font-medium px-2 py-1 rounded bg-emerald-500/20">
                  {sprintState.name} · {sprintState.days_remaining ?? 0} gün kaldı
                </span>
                {sprintState.goal && (
                  <span className="text-[10px] text-zinc-500 max-w-[200px] truncate" title={sprintState.goal}>
                    {sprintState.goal}
                  </span>
                )}
              </div>
            )}
            {sprintState?.status !== "active" && (
              <button
                onClick={handleStartSprint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Play className="w-4 h-4" />
                Sprint Başlat
              </button>
            )}
            {sprintState?.status === "active" && (
              <button
                onClick={handleEndSprint}
                disabled={sprintActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-thy-red text-white hover:bg-thy-red/90 disabled:opacity-50"
              >
                {sprintActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Sprint Bitir
              </button>
            )}
          </div>
        </div>
      </div>

      {startModalOpen && (
        <SprintStartModal
          onClose={() => setStartModalOpen(false)}
          onSave={async (data) => {
            setSprintActionLoading(true);
            try {
              await startSprint(data);
              setStartModalOpen(false);
              await loadSprintState();
              notifyDataUpdated();
            } catch {
              alert("Sprint başlatılamadı");
            } finally {
              setSprintActionLoading(false);
            }
          }}
          loading={sprintActionLoading}
        />
      )}

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
                    : "border-slate-200 bg-slate-50"
                )}
              >
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-800">{col.label}</h3>
                  <span className="text-xs font-mono text-zinc-500 bg-slate-100 px-2 py-0.5 rounded">
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

function SprintStartModal({
  onClose,
  onSave,
  loading,
}: {
  onClose: () => void;
  onSave: (data: { name: string; goal: string; start_date: string; end_date: string }) => void;
  loading: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 14);
  const defaultEndStr = defaultEnd.toISOString().slice(0, 10);

  const [name, setName] = useState(`Bakım Sprint ${today.slice(2, 7)}`);
  const [goal, setGoal] = useState("");
  const [start_date, setStartDate] = useState(today);
  const [end_date, setEndDate] = useState(defaultEndStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, goal, start_date, end_date });
  };

  return (
    <CrudModal title="Sprint Başlat" open onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sprint Adı</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800"
            placeholder="Bakım Sprint 26-02"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Sprint Hedefi
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800 min-h-[60px]"
            placeholder="Örn: A320 uçak filosu için kritik bakım işlerinin tamamlanması"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Başlangıç Tarihi</label>
            <input
              type="date"
              value={start_date}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Bitiş Tarihi</label>
            <input
              type="date"
              value={end_date}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "..." : "Sprint Başlat"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-4 py-2 text-sm text-zinc-600 hover:bg-slate-100"
          >
            İptal
          </button>
        </div>
      </form>
    </CrudModal>
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
        "rounded-lg border border-slate-200 bg-white p-3 cursor-grab active:cursor-grabbing transition-all shadow-sm",
        isDragging && "opacity-50 scale-95",
        updating && "opacity-60 pointer-events-none"
      )}
    >
      <p className="text-sm font-medium text-zinc-800 line-clamp-2">{item.title}</p>
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
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:bg-slate-100 hover:text-zinc-800"
            title={columns[currentIdx - 1].label}
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> Önceki
          </button>
        )}
        {canMoveRight && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveTo(columns[currentIdx + 1].id); }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:bg-slate-100 hover:text-zinc-800"
            title={columns[currentIdx + 1].label}
          >
            Sonraki <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
