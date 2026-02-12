import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Clock, Target, Loader2 } from "lucide-react";
import { fetchEfficiencyMetrics, fetchEfficiencyMonthly, fetchAnalyticsEfficiency } from "@/lib/api";

const METRIC_LABELS: Record<string, string> = {
  avg_completion_days: "Ortalama Tamamlanma Süresi",
  first_pass_success_rate: "İlk Geçiş Başarı Oranı",
  tasks_per_hour: "Saatte Tamamlanan İş Paketi",
  resource_utilization: "Kaynak Kullanım Verimliliği",
};

const METRIC_UNITS: Record<string, string> = {
  avg_completion_days: "gün",
  first_pass_success_rate: "%",
  tasks_per_hour: "adet",
  resource_utilization: "%",
};

const TARGET_KEYS: Record<string, string> = {
  avg_completion_days: "target_avg_completion_days",
  first_pass_success_rate: "target_first_pass",
  tasks_per_hour: "target_tasks_per_hour",
  resource_utilization: "target_resource_utilization",
};

export function EfficiencyAnalysisPage() {
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; completed: number; planned: number }[]>([]);
  const [analytics, setAnalytics] = useState<{ summary?: string; suggestions?: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [m, mon, ana] = await Promise.all([
          fetchEfficiencyMetrics(),
          fetchEfficiencyMonthly(),
          fetchAnalyticsEfficiency().catch(() => null),
        ]);
        if (!cancelled) {
          setMetrics(m as Record<string, number>);
          setMonthly(mon);
          setAnalytics(ana ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Veri yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-thy-red" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-amber-600">
        {error} — Backend çalışıyor mu?
      </div>
    );
  }

  const metricKeys = ["avg_completion_days", "first_pass_success_rate", "tasks_per_hour", "resource_utilization"];
  const maxVal = monthly.length
    ? Math.max(...monthly.map((d) => Math.max(d.completed, d.planned)))
    : 1;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-zinc-800">Verimlilik Analizi</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Bakım sonrası süreç iyileştirme metrikleri</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricKeys.map((key) => {
            const value = metrics?.[key] ?? 0;
            const target = metrics?.[TARGET_KEYS[key]] ?? 0;
            const unit = METRIC_UNITS[key] ?? "";
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-thy-red" />
                  <span className="text-xs text-zinc-500">{METRIC_LABELS[key]}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-800 font-mono">
                    {value}
                  </span>
                  <span className="text-sm text-zinc-500">{unit}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Hedef: {target}{unit}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-thy-red" />
            <h3 className="text-sm font-semibold text-zinc-800">Aylık Tamamlanan vs Planlanan İş Paketleri</h3>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-4 h-48">
              {monthly.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 justify-center items-end flex-1">
                    <div
                      className="w-1/2 rounded-t bg-thy-red/80 min-h-[4px]"
                      style={{ height: `${(d.completed / maxVal) * 100}%` }}
                    />
                    <div
                      className="w-1/2 rounded-t bg-slate-600 min-h-[4px]"
                      style={{ height: `${(d.planned / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-thy-red/80" />
                <span className="text-xs text-zinc-500">Tamamlanan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-600" />
                <span className="text-xs text-zinc-500">Planlanan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-zinc-800">Önerilen İyileştirmeler</h3>
          </div>
          {analytics?.summary && (
            <p className="text-sm text-zinc-600 mb-3">{analytics.summary}</p>
          )}
          <ul className="space-y-2 text-sm text-zinc-600">
            {(analytics?.suggestions && analytics.suggestions.length > 0
              ? analytics.suggestions
              : [
                  "Ortalama tamamlanma süresini hedefe çekmek için elevator/aileron iş paketlerinde paralel atama önerilir.",
                  "Parça stok seviyeleri tedarik süresini uzatıyor. Kritik parçalar için güvenlik stoğu artırılmalı.",
                ]
            ).map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
