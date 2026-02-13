import { useState, useEffect } from "react";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";
import { MobileAICompanion } from "@/components/mobile/MobileAICompanion";
import { MobileFieldWidgets } from "@/components/mobile/MobileFieldWidgets";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { fetchScrumDashboard, fetchWorkPackages } from "@/lib/api";
import { DATA_UPDATED } from "@/lib/events";

type MobileTab = "tasks" | "ai" | "metrics";

export function MobileApp() {
  const [activeTab, setActiveTab] = useState<MobileTab>("tasks");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const [dashboardData, workPackages] = await Promise.all([
        fetchScrumDashboard(),
        fetchWorkPackages(),
      ]);

      // Combine sprint items and work packages for "Bugünkü Görevlerim"
      const sprintItems = dashboardData?.recent_items || [];
      const packages = workPackages || [];
      
      // Merge and prioritize in-progress items
      const allTasks = [
        ...sprintItems.map((item: any) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          type: "sprint",
          priority: item.status === "in_progress" ? 1 : 2,
        })),
        ...packages
          .filter((pkg: any) => pkg.status === "in_progress" || pkg.status === "pending")
          .map((pkg: any) => ({
            id: pkg.id || pkg.work_package_id,
            title: pkg.title || pkg.description,
            status: pkg.status,
            type: "work_package",
            priority: pkg.status === "in_progress" ? 1 : 2,
          })),
      ].sort((a, b) => a.priority - b.priority);

      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const handler = () => loadTasks();
    window.addEventListener(DATA_UPDATED, handler);
    return () => window.removeEventListener(DATA_UPDATED, handler);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Mobile Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/turkish-technic-logo.png"
            alt="Turkish Technic"
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-zinc-800 tracking-tight">
              AeroTech Mobile
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">
              Uçak Bakım Başkanlığı • Saha Uzantısı
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "tasks" && <MobileDashboard tasks={tasks} loading={loading} />}
        {activeTab === "ai" && <MobileAICompanion />}
        {activeTab === "metrics" && <MobileFieldWidgets />}
      </main>

      {/* Bottom Navigation */}
      <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
