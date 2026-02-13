import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Send,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchScrumDashboard, sprintPlan } from "@/lib/api";
import { DATA_UPDATED, notifyDataUpdated } from "@/lib/events";

function StatusBadge({
  status,
  children,
}: {
  status: "approved" | "pending" | "in_progress";
  children: React.ReactNode;
}) {
  const styles = {
    approved: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
    pending: "bg-amber-500/20 text-amber-700 border-amber-500/30",
    in_progress: "bg-thy-red/20 text-thy-red border-thy-red/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
        styles[status]
      )}
    >
      {status === "approved" && <CheckCircle className="w-3 h-3" />}
      {status === "pending" && <Clock className="w-3 h-3" />}
      {status === "in_progress" && <AlertTriangle className="w-3 h-3" />}
      {children}
    </span>
  );
}

export function Dashboard({ onNavigateToResources }: { onNavigateToResources?: () => void }) {
  const [data, setData] = useState<{
    sprint?: { name: string; status: string; days_remaining: number; completed: number; total: number; velocity: number; target: number };
    resource_util?: { label: string; value: number; status: string }[];
    recent_items?: { id: string; title: string; status: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sprintRequest, setSprintRequest] = useState("");
  const [sprintResult, setSprintResult] = useState<Record<string, unknown> | null>(null);
  const [sprintLoading, setSprintLoading] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await fetchScrumDashboard();
      setData(d);
    } catch {
      setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    const handler = () => load(true);
    window.addEventListener(DATA_UPDATED, handler);
    return () => window.removeEventListener(DATA_UPDATED, handler);
  }, []);

  const handleSprintPlan = async () => {
    const q = sprintRequest.trim();
    if (!q || sprintLoading) return;
    setSprintLoading(true);
    setSprintResult(null);
    try {
      const res = await sprintPlan(q);
      setSprintResult(res);
      load(true);
      if (res.operation === "create_items" || res.operation === "update_status") {
        notifyDataUpdated();
      }
    } catch {
      setSprintResult({ error: "İstek başarısız" });
    } finally {
      setSprintLoading(false);
    }
  };

  if (loading) {
    return (
      <aside className="w-80 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-thy-red" />
      </aside>
    );
  }

  const sprint = data?.sprint ?? { name: "—", status: "—", days_remaining: 0, completed: 0, total: 1, velocity: 0, target: 10 };
  const resourceUtil = data?.resource_util ?? [];
  const recentItems = data?.recent_items ?? [];
  const progressPct = sprint.total > 0 ? Math.round((sprint.completed / sprint.total) * 100) : 0;

  return (
    <aside className="w-80 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-zinc-800">
          Operasyonel Özet
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Operasyonel İstihbarat & Karar Destek
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
        {/* Sprint Planlama (doğal dil) */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-thy-red" />
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Sprint Planlama
            </span>
          </div>
          <div className="flex gap-1">
            <input
              value={sprintRequest}
              onChange={(e) => setSprintRequest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSprintPlan()}
              placeholder="Örn: Tüm öğeleri listele, Yeni item ekle..."
              className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-500"
            />
            <button
              onClick={handleSprintPlan}
              disabled={sprintLoading || !sprintRequest.trim()}
              className="rounded bg-thy-red px-2 py-1.5 text-white disabled:opacity-50"
            >
              {sprintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          {sprintResult && (
            <div className="mt-2 rounded border border-slate-200 bg-white p-2 text-xs">
              {sprintResult.error ? (
                <p className="text-amber-600">{String(sprintResult.error)}</p>
              ) : null}
              {sprintResult.operation === "create_items" && (
                <p className="text-emerald-600">
                  {Array.isArray(sprintResult.created) ? sprintResult.created.length : 0} öğe eklendi. Backlog: {String(sprintResult.backlog_size ?? 0)}
                </p>
              )}
              {sprintResult.operation === "update_status" && sprintResult.item ? (
                <p className="text-emerald-600">Durum güncellendi: {String((sprintResult.item as Record<string, unknown>).title ?? "")}</p>
              ) : null}
              {sprintResult.operation === "list_items" && Array.isArray(sprintResult.items) && sprintResult.items.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(sprintResult.items as Array<{ id: string; title: string; status: string; type?: string }>).map((i) => (
                    <div key={i.id} className="flex justify-between gap-1">
                      <span className="text-zinc-700 truncate">{i.title}</span>
                      <span className={cn(
                        "flex-shrink-0",
                        i.status === "done" ? "text-emerald-600" : i.status === "in_progress" ? "text-amber-600" : "text-zinc-500"
                      )}>
                        {i.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {sprintResult.operation === "list_items" && (!Array.isArray(sprintResult.items) || sprintResult.items.length === 0) && (
                <p className="text-zinc-500">Öğe bulunamadı.</p>
              )}
            </div>
          )}
        </div>

        {/* Sprint Overview */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Sprint
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {sprint.status}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 font-mono">
            {sprint.name}
          </h3>
          {(sprint as { goal?: string }).goal && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2" title={(sprint as { goal?: string }).goal}>
              {(sprint as { goal?: string }).goal}
            </p>
          )}
          <p className="text-xs text-zinc-500 mt-1">
            {sprint.days_remaining} gün kaldı
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500">İlerleme</span>
              <span className="text-zinc-700 font-mono">{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-thy-red transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              {sprint.completed} / {sprint.total} iş paketi
            </p>
          </div>
        </div>

        {/* Velocity */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-thy-red" />
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Ekip Hızı
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-800 font-mono">
              {sprint.velocity}
            </span>
            <span className="text-sm text-zinc-500">/ {sprint.target} hedef</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.min((sprint.velocity / sprint.target) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Resource Utilization */}
        <div
          role={onNavigateToResources ? "button" : undefined}
          onClick={onNavigateToResources}
          tabIndex={onNavigateToResources ? 0 : undefined}
          onKeyDown={onNavigateToResources ? (e) => e.key === "Enter" && onNavigateToResources() : undefined}
          className={cn(
            "rounded-lg border border-slate-200 bg-slate-50 p-4",
            onNavigateToResources && "cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition-colors"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Kaynak Kullanımı
              </span>
            </div>
            {onNavigateToResources && (
              <span className="text-[10px] text-zinc-500">Yönet →</span>
            )}
          </div>
          <div className="space-y-3">
            {resourceUtil.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-600">{item.label}</span>
                  <span
                    className={cn(
                      "font-mono",
                      item.status === "warning"
                        ? "text-amber-600"
                        : "text-zinc-700"
                    )}
                  >
                    {item.value}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      item.status === "warning"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Work Packages */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-thy-red" />
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Son İş Paketleri
            </span>
          </div>
          <div className="space-y-2">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 py-2 border-b border-slate-200 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-zinc-500">{item.id}</p>
                  <p className="text-sm text-zinc-700 truncate">{item.title}</p>
                </div>
                <StatusBadge status={item.status as "approved" | "pending" | "in_progress"}>
                  {item.status === "approved"
                    ? "Onaylı"
                    : item.status === "pending"
                    ? "Beklemede"
                    : "Devam"}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
