import { useEffect, useState } from "react";
import { Users, Wrench, Package, MapPin, Calendar, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchPersonnel,
  fetchTools,
  fetchParts,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  createTool,
  updateTool,
  deleteTool,
  createPart,
  updatePart,
  deletePart,
} from "@/lib/api";
import { CrudModal } from "@/components/CrudModal";
import { notifyDataUpdated } from "@/lib/events";

function SectionCard({
  title,
  icon: Icon,
  onAdd,
  children,
}: {
  title: string;
  icon: React.ElementType;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-thy-red" />
          <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-thy-red text-white hover:bg-thy-red-hover"
          >
            <Plus className="w-3 h-3" /> Ekle
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const loadData = async () => {
  const [p, t, pt] = await Promise.all([fetchPersonnel(), fetchTools(), fetchParts()]);
  return { personnel: p, tools: t, parts: pt };
};

export function ResourceManagementPage() {
  const [personnel, setPersonnel] = useState<Record<string, unknown>[]>([]);
  const [tools, setTools] = useState<Record<string, unknown>[]>([]);
  const [parts, setParts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"personnel" | "tool" | "part" | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const refresh = async () => {
    try {
      const data = await loadData();
      setPersonnel(data.personnel);
      setTools(data.tools);
      setParts(data.parts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veri yüklenemedi");
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadData();
        if (!cancelled) {
          setPersonnel(data.personnel);
          setTools(data.tools);
          setParts(data.parts);
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

  const handleDeletePersonnel = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await deletePersonnel(id);
      await refresh();
      notifyDataUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silme hatası");
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await deleteTool(id);
      await refresh();
      notifyDataUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silme hatası");
    }
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await deletePart(id);
      await refresh();
      notifyDataUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silme hatası");
    }
  };

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

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-zinc-800">Kaynak & Ekipman Yönetimi</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Personel yetkileri, tool ve ekipman planlaması (CRUD)</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
        <SectionCard title="Personel" icon={Users} onAdd={() => { setEditing(null); setModal("personnel"); }}>
          <PersonnelSection
            personnel={personnel}
            onEdit={(p) => { setEditing(p); setModal("personnel"); }}
            onDelete={handleDeletePersonnel}
          />
        </SectionCard>

        <SectionCard title="Ekipman & Tool" icon={Wrench} onAdd={() => { setEditing(null); setModal("tool"); }}>
          <ToolsSection
            tools={tools}
            onEdit={(t) => { setEditing(t); setModal("tool"); }}
            onDelete={handleDeleteTool}
            onToggleStatus={async (t) => {
              const next = t.status === "in_use" ? "available" : "in_use";
              try {
                await updateTool(String(t.id), { status: next });
                await refresh();
                notifyDataUpdated();
              } catch {
                alert("Durum güncellenemedi");
              }
            }}
          />
        </SectionCard>

        <SectionCard title="Parça Envanteri" icon={Package} onAdd={() => { setEditing(null); setModal("part"); }}>
          <PartsSection
            parts={parts}
            onEdit={(p) => { setEditing(p); setModal("part"); }}
            onDelete={handleDeletePart}
          />
        </SectionCard>
      </div>

      {modal === "personnel" && (
        <PersonnelModal
          editing={editing}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={async () => { await refresh(); notifyDataUpdated(); setModal(null); setEditing(null); }}
        />
      )}
      {modal === "tool" && (
        <ToolModal
          editing={editing}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={async () => { await refresh(); notifyDataUpdated(); setModal(null); setEditing(null); }}
        />
      )}
      {modal === "part" && (
        <PartModal
          editing={editing}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={async () => { await refresh(); notifyDataUpdated(); setModal(null); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, danger }: { onClick: () => void; icon: React.ElementType; danger?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "p-1 rounded hover:bg-slate-100",
        danger ? "text-thy-red hover:bg-thy-red/20" : "text-zinc-500 hover:text-zinc-800"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function PersonnelSection({
  personnel,
  onEdit,
  onDelete,
}: {
  personnel: Record<string, unknown>[];
  onEdit: (p: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {personnel.map((p) => (
        <div
          key={String(p.id)}
          className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
        >
          <div>
            <p className="text-sm font-medium text-zinc-800">{String(p.name ?? "")}</p>
            <p className="text-xs text-zinc-500">{String(p.role ?? "")} · {Array.isArray(p.ratings) ? (p.ratings as string[]).join(", ") : ""}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{Array.isArray(p.specializations) ? (p.specializations as string[]).join(", ") : ""}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500 font-mono mr-1">{p.shift === "day" ? "Gündüz" : "Gece"}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium mr-2",
                p.availability === "available"
                  ? "bg-emerald-500/20 text-emerald-700"
                  : "bg-amber-500/20 text-amber-400"
              )}
            >
              {p.availability === "available" ? "Müsait" : "Meşgul"}
            </span>
            <ActionBtn icon={Pencil} onClick={() => onEdit(p)} />
            <ActionBtn icon={Trash2} onClick={() => onDelete(String(p.id))} danger />
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolsSection({
  tools,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  tools: Record<string, unknown>[];
  onEdit: (t: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (t: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      {tools.map((t) => {
        const inUse = t.status === "in_use";
        return (
          <div
            key={String(t.id)}
            className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800">{String(t.name ?? "")}</p>
              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {String(t.location)}
              </p>
              <p className="text-xs text-zinc-600 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Kalibrasyon: {String(t.calibration_due)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span
                role="button"
                tabIndex={0}
                onClick={() => onToggleStatus?.(t)}
                onKeyDown={(e) => e.key === "Enter" && onToggleStatus?.(t)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium cursor-pointer select-none mr-2",
                  inUse
                    ? "bg-thy-red/20 text-thy-red hover:bg-thy-red/30"
                    : "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30"
                )}
                title={inUse ? "Kullanımda – tıkla: Müsait yap" : "Müsait – tıkla: Kullanımda yap"}
              >
                {inUse ? "Kullanımda" : "Müsait"}
              </span>
              <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded bg-slate-100 mr-2">{String(t.category ?? "")}</span>
              <ActionBtn icon={Pencil} onClick={() => onEdit(t)} />
              <ActionBtn icon={Trash2} onClick={() => onDelete(String(t.id))} danger />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartsSection({
  parts,
  onEdit,
  onDelete,
}: {
  parts: Record<string, unknown>[];
  onEdit: (p: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {parts.map((p) => {
        const stock = Number(p.stock_level ?? 0);
        return (
          <div
            key={String(p.id)}
            className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800">{String(p.name ?? "")}</p>
              <p className="text-xs text-zinc-500 font-mono">{String(p.part_no ?? "")} · ATA {String(p.ata_chapter ?? "")}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{String(p.location)}</p>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-mono font-medium mr-2",
                  stock === 0 ? "bg-thy-red/20 text-thy-red" : stock <= 2 ? "bg-amber-500/20 text-amber-700" : "bg-emerald-500/20 text-emerald-700"
                )}
              >
                Stok: {stock}
              </span>
              <ActionBtn icon={Pencil} onClick={() => onEdit(p)} />
              <ActionBtn icon={Trash2} onClick={() => onDelete(String(p.id))} danger />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonnelModal({
  editing,
  onClose,
  onSave,
}: {
  editing: Record<string, unknown> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [id, setId] = useState(editing ? String(editing.id) : "");
  const [name, setName] = useState(editing ? String(editing.name) : "");
  const [role, setRole] = useState(editing ? String(editing.role) : "Aircraft Maintenance Technician");
  const [ratings, setRatings] = useState(editing ? (editing.ratings as string[]).join(", ") : "B1");
  const [specializations, setSpecializations] = useState(editing ? (editing.specializations as string[]).join(", ") : "");
  const [shift, setShift] = useState(editing ? String(editing.shift) : "day");
  const [availability, setAvailability] = useState(editing ? String(editing.availability) : "available");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        id: id || `P${Date.now().toString(36).slice(-4)}`,
        name,
        role,
        ratings: ratings.split(",").map((s) => s.trim()).filter(Boolean),
        specializations: specializations.split(",").map((s) => s.trim()).filter(Boolean),
        shift,
        availability,
      };
      if (editing) await updatePersonnel(String(editing.id), data);
      else await createPersonnel(data);
      onSave();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrudModal title={editing ? "Personel Düzenle" : "Yeni Personel"} open onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} disabled={!!editing} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" placeholder="P006" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Ad Soyad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Rol</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Ratings (virgülle)</label>
          <input value={ratings} onChange={(e) => setRatings(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" placeholder="B1, B2" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Uzmanlık (virgülle)</label>
          <input value={specializations} onChange={(e) => setSpecializations(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" placeholder="flight_controls" />
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input type="radio" checked={shift === "day"} onChange={() => setShift("day")} /> Gündüz
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={shift === "night"} onChange={() => setShift("night")} /> Gece
          </label>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input type="radio" checked={availability === "available"} onChange={() => setAvailability("available")} /> Müsait
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={availability === "busy"} onChange={() => setAvailability("busy")} /> Meşgul
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 rounded bg-thy-red px-4 py-2 text-sm font-medium text-white hover:bg-thy-red-hover disabled:opacity-50">
            {saving ? "..." : "Kaydet"}
          </button>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 px-4 py-2 text-sm text-zinc-600 hover:bg-slate-100">
            İptal
          </button>
        </div>
      </form>
    </CrudModal>
  );
}

function ToolModal({
  editing,
  onClose,
  onSave,
}: {
  editing: Record<string, unknown> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [id, setId] = useState(editing ? String(editing.id) : "");
  const [name, setName] = useState(editing ? String(editing.name) : "");
  const [category, setCategory] = useState(editing ? String(editing.category) : "general");
  const [location, setLocation] = useState(editing ? String(editing.location) : "");
  const [calibration_due, setCalibrationDue] = useState(editing ? String(editing.calibration_due) : "2026-12-31");
  const [status, setStatus] = useState(editing ? String(editing.status ?? "available") : "available");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { id: id || `T${Date.now().toString(36).slice(-4)}`, name, category, location, calibration_due, status };
      if (editing) await updateTool(String(editing.id), data);
      else await createTool(data);
      onSave();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrudModal title={editing ? "Tool Düzenle" : "Yeni Tool"} open onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} disabled={!!editing} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" placeholder="T006" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Ad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Konum</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kalibrasyon Tarihi</label>
          <input value={calibration_due} onChange={(e) => setCalibrationDue(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kullanım Durumu</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800">
            <option value="available">Müsait</option>
            <option value="in_use">Kullanımda</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 rounded bg-thy-red px-4 py-2 text-sm font-medium text-white hover:bg-thy-red-hover disabled:opacity-50">
            {saving ? "..." : "Kaydet"}
          </button>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 px-4 py-2 text-sm text-zinc-600 hover:bg-slate-100">
            İptal
          </button>
        </div>
      </form>
    </CrudModal>
  );
}

function PartModal({
  editing,
  onClose,
  onSave,
}: {
  editing: Record<string, unknown> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [id, setId] = useState(editing ? String(editing.id) : "");
  const [part_no, setPartNo] = useState(editing ? String(editing.part_no) : "");
  const [name, setName] = useState(editing ? String(editing.name) : "");
  const [ata_chapter, setAtaChapter] = useState(editing ? String(editing.ata_chapter) : "27");
  const [stock_level, setStockLevel] = useState(editing ? Number(editing.stock_level) : 0);
  const [location, setLocation] = useState(editing ? String(editing.location) : "");
  const [lead_time_days, setLeadTimeDays] = useState(editing ? Number(editing.lead_time_days) : 14);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { id: id || `PRT${Date.now().toString(36).slice(-4)}`, part_no, name, ata_chapter, stock_level, location, lead_time_days };
      if (editing) await updatePart(String(editing.id), data);
      else await createPart(data);
      onSave();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrudModal title={editing ? "Parça Düzenle" : "Yeni Parça"} open onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} disabled={!!editing} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Parça No</label>
          <input value={part_no} onChange={(e) => setPartNo(e.target.value)} required className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Ad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">ATA</label>
            <input value={ata_chapter} onChange={(e) => setAtaChapter(e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Stok</label>
            <input type="number" value={stock_level} onChange={(e) => setStockLevel(parseInt(e.target.value) || 0)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Konum</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Lead Time (gün)</label>
          <input type="number" value={lead_time_days} onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 0)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-800" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 rounded bg-thy-red px-4 py-2 text-sm font-medium text-white hover:bg-thy-red-hover disabled:opacity-50">
            {saving ? "..." : "Kaydet"}
          </button>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 px-4 py-2 text-sm text-zinc-600 hover:bg-slate-100">
            İptal
          </button>
        </div>
      </form>
    </CrudModal>
  );
}
