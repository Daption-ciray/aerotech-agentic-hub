import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { MaintenancePlanningPage } from "@/pages/MaintenancePlanningPage";
import { SprintPlanningPage } from "@/pages/SprintPlanningPage";
import { ResourceManagementPage } from "@/pages/ResourceManagementPage";
import { WorkPackagesPage } from "@/pages/WorkPackagesPage";
import { EfficiencyAnalysisPage } from "@/pages/EfficiencyAnalysisPage";

type TabId = "planning" | "sprint" | "resources" | "workpackages" | "efficiency";

const PAGE_MAP: Record<TabId, React.ComponentType> = {
  planning: MaintenancePlanningPage,
  sprint: SprintPlanningPage,
  resources: ResourceManagementPage,
  workpackages: WorkPackagesPage,
  efficiency: EfficiencyAnalysisPage,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("planning");
  const PageComponent = PAGE_MAP[activeTab];

  return (
    <div className="h-screen flex bg-slate-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex min-w-0 border-r border-slate-800">
        <PageComponent />
        <Dashboard onNavigateToResources={() => setActiveTab("resources")} />
      </main>
    </div>
  );
}
