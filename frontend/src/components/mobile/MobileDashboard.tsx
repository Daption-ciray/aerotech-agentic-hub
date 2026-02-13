import { CheckCircle, Clock, AlertTriangle, Loader2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  type?: string;
}

interface MobileDashboardProps {
  tasks: Task[];
  loading: boolean;
}

function StatusBadge({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    approved: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
    pending: "bg-amber-500/20 text-amber-700 border-amber-500/30",
    in_progress: "bg-thy-red/20 text-thy-red border-thy-red/30",
    done: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  };

  const style = styles[status] || styles.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
        style
      )}
    >
      {status === "approved" || status === "done" ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : status === "pending" ? (
        <Clock className="w-3.5 h-3.5" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5" />
      )}
      {children}
    </span>
  );
}

export function MobileDashboard({ tasks, loading }: MobileDashboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-thy-red" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-800 mb-1">
          Bugünkü Görevlerim
        </h2>
        <p className="text-sm text-zinc-500 font-mono">
          Masaüstü platformdan senkronize edilen iş paketleri ve sprint öğeleri
        </p>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Wrench className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-600 mb-1">
            Henüz görev yok
          </p>
          <p className="text-xs text-zinc-500">
            Masaüstü platformdan görevler buraya senkronize edilecek
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
                    {task.type === "sprint" ? "Sprint" : "İş Paketi"} • {task.id}
                  </p>
                  <h3 className="text-base font-semibold text-zinc-800 leading-snug">
                    {task.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={task.status}>
                  {task.status === "approved" || task.status === "done"
                    ? "Tamamlandı"
                    : task.status === "pending"
                    ? "Beklemede"
                    : "Devam Ediyor"}
                </StatusBadge>
                {task.status === "in_progress" && (
                  <span className="text-xs text-zinc-500 font-mono">
                    Aktif
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync Info */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] text-zinc-500 font-mono text-center">
          Son senkronizasyon: {new Date().toLocaleTimeString("tr-TR")}
        </p>
      </div>
    </div>
  );
}
