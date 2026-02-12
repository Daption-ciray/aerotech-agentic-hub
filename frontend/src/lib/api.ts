const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function sendQuestion(question: string): Promise<{ answer: string }> {
  const res = await fetch(`${API_BASE}/qa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("QA request failed");
  return res.json();
}

export async function planMaintenance(
  faultDescription: string
): Promise<{
  tech_context?: string;
  work_package?: string;
  resource_plan?: string;
  qa_review?: string;
}> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fault_description: faultDescription }),
  });
  if (!res.ok) throw new Error("Plan request failed");
  return res.json();
}

// Kaynak & Ekipman
export async function fetchPersonnel() {
  const res = await fetch(`${API_BASE}/resources/personnel`);
  if (!res.ok) throw new Error("Personnel fetch failed");
  const data = await res.json();
  return data.personnel ?? [];
}

export async function fetchTools() {
  const res = await fetch(`${API_BASE}/resources/tools`);
  if (!res.ok) throw new Error("Tools fetch failed");
  const data = await res.json();
  return data.tools ?? [];
}

export async function fetchParts() {
  const res = await fetch(`${API_BASE}/resources/parts`);
  if (!res.ok) throw new Error("Parts fetch failed");
  const data = await res.json();
  return data.parts ?? [];
}

// İş Paketleri
export async function fetchWorkPackages() {
  const res = await fetch(`${API_BASE}/work-packages`);
  if (!res.ok) throw new Error("Work packages fetch failed");
  const data = await res.json();
  return data.work_packages ?? [];
}

// Verimlilik
export async function fetchEfficiencyMetrics() {
  const res = await fetch(`${API_BASE}/efficiency/metrics`);
  if (!res.ok) throw new Error("Efficiency metrics fetch failed");
  return res.json();
}

export async function fetchEfficiencyMonthly() {
  const res = await fetch(`${API_BASE}/efficiency/monthly`);
  if (!res.ok) throw new Error("Efficiency monthly fetch failed");
  const data = await res.json();
  return data.monthly ?? [];
}

// Scrum Dashboard
export async function fetchScrumDashboard() {
  const res = await fetch(`${API_BASE}/scrum/dashboard`);
  if (!res.ok) throw new Error("Scrum dashboard fetch failed");
  return res.json();
}

// Sprint Planning (doğal dil ile backlog yönetimi)
export async function sprintPlan(request: string): Promise<{
  operation?: string;
  created?: string[];
  backlog_size?: number;
  items?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    sprint?: string;
    priority?: number;
    estimate_hours?: number;
    owner?: string;
  }>;
  item?: Record<string, unknown>;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/sprint/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });
  if (!res.ok) throw new Error("Sprint plan request failed");
  return res.json();
}

// CRUD - Personnel
export async function createPersonnel(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/resources/personnel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}
export async function updatePersonnel(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/resources/personnel/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}
export async function deletePersonnel(id: string) {
  const res = await fetch(`${API_BASE}/resources/personnel/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// CRUD - Tools
export async function createTool(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/resources/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}
export async function updateTool(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/resources/tools/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}
export async function deleteTool(id: string) {
  const res = await fetch(`${API_BASE}/resources/tools/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// CRUD - Parts
export async function createPart(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/resources/parts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}
export async function updatePart(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/resources/parts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}
export async function deletePart(id: string) {
  const res = await fetch(`${API_BASE}/resources/parts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// CRUD - Work Packages
export async function createWorkPackage(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/work-packages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}
export async function updateWorkPackage(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/work-packages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}
export async function deleteWorkPackage(id: string) {
  const res = await fetch(`${API_BASE}/work-packages/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}
