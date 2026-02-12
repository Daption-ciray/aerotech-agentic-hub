import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Wrench,
  ClipboardList,
  BarChart3,
  Plane,
  LayoutList,
} from "lucide-react";

const TABS = [
  {
    id: "planning",
    label: "Bakım Planlama & Takip",
    icon: CalendarCheck,
  },
  {
    id: "sprint",
    label: "Sprint Planlama",
    icon: LayoutList,
  },
  {
    id: "resources",
    label: "Kaynak & Ekipman Yönetimi",
    icon: Wrench,
  },
  {
    id: "workpackages",
    label: "İş Paketleri",
    icon: ClipboardList,
  },
  {
    id: "efficiency",
    label: "Verimlilik Analizi",
    icon: BarChart3,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-925 flex flex-col">
      {/* Logo & Brand */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-thy-red flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-100 text-sm tracking-tight">
              AeroTech
            </h1>
            <p className="text-xs text-zinc-500 font-mono">Intelligence</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600 font-mono">
          Uçak Bakım Başkanlığı
        </p>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-3 space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-thy-red-muted text-thy-red border border-thy-red/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-thy-red" : "text-zinc-500"
                )}
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <p className="text-[10px] text-zinc-600 font-mono">
          Abdullah Gökalp Çıray
        </p>
        <p className="text-[10px] text-zinc-600 font-mono">Turkish Technic</p>
      </div>
    </aside>
  );
}
