import { useEffect, useState } from "react";
import { CheckCircle, Clock, AlertTriangle, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWorkPackages, createWorkPackage, updateWorkPackage, deleteWorkPackage } from "@/lib/api";
import { CrudModal } from "@/components/CrudModal";
import { notifyDataUpdated } from "@/lib/events";

function StatusBadge({ status }: { status: "approved" | "pending" | "in_progress" }) {
  const config = {
    approved: { icon: CheckCircle, label: "Onaylı", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    pending: { icon: Clock, label: "Beklemede", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    in_progress: { icon: AlertTriangle, label: "Devam Ediyor", class: "bg-thy-red/20 text-thy-red border-thy-red/30" },
  };
  const { icon: Icon, label, class: cls } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border", cls)}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export function WorkPackagesPage() {
  const [packages, setPackages] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const refresh = async () => {
    try {
      const data = await fetchWorkPackages();
      setPackages(data);
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
        const data = await fetchWorkPackages();
        if (!cancelled) setPackages(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Veri yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await deleteWorkPackage(id);
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
      <div className="flex-1 flex items-center justify-center text-amber-400">
        {error} — Backend çalışıyor mu?
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">İş Paketleri</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Hazırlanan ve kontrol edilen görev listeleri (CRUD)</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-thy-red text-white hover:bg-thy-red-hover"
        >
          <Plus className="w-4 h-4" /> Ekle
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">Görev</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">Uçak</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">ATA</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">Sorumlu</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">Termin</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {packages.map((wp) => (
                  <tr key={String(wp.id)} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-400">{String(wp.id)}</td>
                    <td className="px-4 py-3 text-zinc-100">{String(wp.title)}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{String(wp.aircraft ?? "")}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{String(wp.ata ?? "")}</td>
                    <td className="px-4 py-3 text-zinc-400">{wp.assigned_to ? String(wp.assigned_to) : "—"}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{String(wp.due_date ?? "")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={(wp.status as "approved" | "pending" | "in_progress") ?? "pending"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(wp); setModalOpen(true); }} className="p-1 rounded text-zinc-400 hover:bg-slate-700 hover:text-zinc-100">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(String(wp.id))} className="p-1 rounded text-thy-red hover:bg-thy-red/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <WorkPackageModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={async () => { await refresh(); notifyDataUpdated(); setModalOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function WorkPackageModal({
  editing,
  onClose,
  onSave,
}: {
  editing: Record<string, unknown> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [id, setId] = useState(editing ? String(editing.id) : "");
  const [title, setTitle] = useState(editing ? String(editing.title) : "");
  const [aircraft, setAircraft] = useState(editing ? String(editing.aircraft) : "A320");
  const [ata, setAta] = useState(editing ? String(editing.ata) : "27");
  const [status, setStatus] = useState(editing ? String(editing.status) : "pending");
  const [assigned_to, setAssignedTo] = useState(editing && editing.assigned_to ? String(editing.assigned_to) : "");
  const [due_date, setDueDate] = useState(editing ? String(editing.due_date) : "2026-02-20");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        id: id || `WP-${Date.now().toString().slice(-6)}`,
        title,
        aircraft,
        ata,
        status,
        assigned_to: assigned_to || null,
        due_date,
      };
      if (editing) await updateWorkPackage(String(editing.id), data);
      else await createWorkPackage(data);
      onSave();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrudModal title={editing ? "İş Paketi Düzenle" : "Yeni İş Paketi"} open onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} disabled={!!editing} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100" placeholder="WP-147" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Görev Başlığı</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100" />
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Uçak</label>
            <input value={aircraft} onChange={(e) => setAircraft(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">ATA</label>
            <input value={ata} onChange={(e) => setAta(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Durum</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100">
            <option value="pending">Beklemede</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="approved">Onaylı</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sorumlu</label>
          <input value={assigned_to} onChange={(e) => setAssignedTo(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100" placeholder="İsim veya boş" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Termin Tarihi</label>
          <input value={due_date} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 rounded bg-thy-red px-4 py-2 text-sm font-medium text-white hover:bg-thy-red-hover disabled:opacity-50">
            {saving ? "..." : "Kaydet"}
          </button>
          <button type="button" onClick={onClose} className="rounded border border-slate-600 px-4 py-2 text-sm text-zinc-300 hover:bg-slate-800">
            İptal
          </button>
        </div>
      </form>
    </CrudModal>
  );
}
