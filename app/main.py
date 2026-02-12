"""
AeroTech Agentic Hub – FastAPI entry point.
"""

from pathlib import Path
import json
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .setup import get_retriever, get_web_search_tool, get_resource_tool
from .agents import (
    SearchRAGAgent,
    WorkPackagePlannerAgent,
    ResourceComplianceAgent,
    PlanReviewAgent,
    GuardAgent,
    QAAssistantAgent,
    SprintPlanningAgent,
    EfficiencyAgent,
)
from .analytics import CompletedWorkPackage, add_completed
from .chains import run_planning_pipeline


app = FastAPI(title="AeroTech Agentic Hub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response modelleri
# ---------------------------------------------------------------------------

class PlanningRequest(BaseModel):
    fault_description: str


class QARequest(BaseModel):
    question: str


class PlanReviewRequest(BaseModel):
    tech_context: str
    work_package: str
    resource_plan: str


class SprintPlanRequest(BaseModel):
    request: str


class CompletedPackageRequest(BaseModel):
    id: str
    work_package_id: str
    sprint_id: str | None = None
    started_at: str
    completed_at: str
    first_pass_success: bool
    rework_count: int = 0
    planned_minutes: int | None = None
    actual_minutes: int | None = None
    assigned_personnel_count: int | None = None
    criticality: str | None = None


# ---------------------------------------------------------------------------
# Startup – ajanları ve paylaşılan kaynakları bir kez başlat
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup_event():
    """Initialise shared components once on startup."""
    # region agent log
    try:
        log_path = Path("/Users/daption-ciray/Desktop/Project/THY/.cursor/debug.log")
        payload = {
            "id": f"log_{int(time.time() * 1000)}",
            "timestamp": int(time.time() * 1000),
            "location": "app/main.py:startup_event",
            "message": "startup_begin",
            "data": {},
            "runId": "e2e",
            "hypothesisId": "H1",
        }
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # endregion

    from .services.data import ensure_db
    ensure_db()

    retriever = get_retriever()
    web_search_tool = get_web_search_tool()
    resource_tool = get_resource_tool()

    app.state.search_agent = SearchRAGAgent(retriever, web_search_tool)
    app.state.planner_agent = WorkPackagePlannerAgent()
    app.state.resource_agent = ResourceComplianceAgent(resource_tool)
    app.state.plan_review_agent = PlanReviewAgent()
    app.state.guard_agent = GuardAgent()
    app.state.qa_agent = QAAssistantAgent(
        retriever,
        web_search_tool,
        app.state.guard_agent,
    )
    app.state.sprint_agent = SprintPlanningAgent()
    app.state.efficiency_agent = EfficiencyAgent()

    # region agent log
    try:
        log_path = Path("/Users/daption-ciray/Desktop/Project/THY/.cursor/debug.log")
        payload = {
            "id": f"log_{int(time.time() * 1000)}",
            "timestamp": int(time.time() * 1000),
            "location": "app/main.py:startup_event",
            "message": "startup_end",
            "data": {
                "has_retriever": retriever is not None,
                "has_web_search": web_search_tool is not None,
                "has_resource_tool": resource_tool is not None,
            },
            "runId": "e2e",
            "hypothesisId": "H1",
        }
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # endregion


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/plan")
def plan_maintenance(req: PlanningRequest):
    """Arıza açıklamasından uçtan uca bakım planı + QA incelemesi üretir."""
    result = run_planning_pipeline(
        app.state.search_agent,
        app.state.planner_agent,
        app.state.resource_agent,
        req.fault_description,
        qa_agent=app.state.plan_review_agent,
    )
    return result


@app.post("/plan/review")
def review_plan(req: PlanReviewRequest):
    """
    Harici olarak sağlanan teknik bağlam + iş paketi + kaynak planı için
    yalnızca QA / kalite kontrol raporu üretir.
    """
    qa_review = app.state.plan_review_agent.run(
        req.tech_context,
        req.work_package,
        req.resource_plan,
    )
    return {"qa_review": qa_review}


@app.post("/qa")
def qa_assistant(req: QARequest):
    """Genel havacılık bakım Q&A asistanı (kullanıcı soruları için)."""
    answer = app.state.qa_agent.run(req.question)
    return {"answer": answer}


@app.post("/sprint/plan")
def sprint_planning(req: SprintPlanRequest):
    """
    Sprint planning / backlog yönetim isteğini doğal dille alır,
    SprintPlanningAgent aracılığıyla backlog üzerinde operasyon (create/list/update)
    uygular.
    """
    result = app.state.sprint_agent.run(req.request)
    return result


@app.get("/")
def root():
    return {"message": "AeroTech Agentic Hub API is running."}


# ---------------------------------------------------------------------------
# Kaynak & Ekipman, İş Paketleri, Verimlilik API'leri
# ---------------------------------------------------------------------------

from .services.data import (
    get_personnel,
    get_tools,
    get_parts,
    get_work_packages,
    get_efficiency_metrics,
    get_efficiency_monthly,
    get_scrum_dashboard,
)
from .db import crud


@app.get("/resources/personnel")
def list_personnel():
    """Personel listesi."""
    return {"personnel": get_personnel()}


@app.get("/resources/tools")
def list_tools():
    """Ekipman ve tool listesi."""
    return {"tools": get_tools()}


@app.get("/resources/parts")
def list_parts():
    """Parça envanteri."""
    return {"parts": get_parts()}


@app.get("/work-packages")
def list_work_packages():
    """İş paketleri listesi."""
    return {"work_packages": get_work_packages()}


@app.get("/efficiency/metrics")
def efficiency_metrics():
    """Verimlilik metrikleri."""
    return get_efficiency_metrics()


@app.get("/efficiency/monthly")
def efficiency_monthly():
    """Aylık tamamlanan/planlanan verisi."""
    return {"monthly": get_efficiency_monthly()}


@app.get("/scrum/dashboard")
def scrum_dashboard():
    """Scrum Dashboard verisi (sprint, kaynak kullanımı, son iş paketleri)."""
    return get_scrum_dashboard()


# ---------------------------------------------------------------------------
# Verimlilik için ek CRUD / Agent endpoint'leri
# ---------------------------------------------------------------------------


@app.post("/analytics/completed")
def add_completed_package(req: CompletedPackageRequest):
    """
    Tamamlanan bir iş paketini kaydeder (demo için basit JSON store).
    Gerçek MRO sisteminde bu veri bakım kayıtlarından otomatik gelebilir.
    """
    cp = CompletedWorkPackage(
        id=req.id,
        work_package_id=req.work_package_id,
        sprint_id=req.sprint_id,
        started_at=req.started_at,
        completed_at=req.completed_at,
        first_pass_success=req.first_pass_success,
        rework_count=req.rework_count,
        planned_minutes=req.planned_minutes,
        actual_minutes=req.actual_minutes,
        assigned_personnel_count=req.assigned_personnel_count,
        criticality=req.criticality,
    )
    add_completed(cp)
    return {"status": "ok"}


@app.get("/analytics/efficiency")
def get_efficiency():
    """
    Verimlilik analizi metriklerini ve LLM tabanlı önerileri döner.
    UI'daki 'Verimlilik Analizi' ekranını bu endpoint besleyebilir.
    """
    return app.state.efficiency_agent.run()


# ---------------------------------------------------------------------------
# CRUD Endpoints
# ---------------------------------------------------------------------------

class PersonnelCreate(BaseModel):
    id: str
    name: str
    role: str
    ratings: list[str] = []
    specializations: list[str] = []
    shift: str = "day"
    availability: str = "available"


class PersonnelUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    ratings: list[str] | None = None
    specializations: list[str] | None = None
    shift: str | None = None
    availability: str | None = None


@app.get("/resources/personnel/{id}")
def get_personnel_by_id(id: str):
    p = crud.get_personnel(id)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@app.post("/resources/personnel")
def create_personnel_endpoint(req: PersonnelCreate):
    return crud.create_personnel(req.model_dump())


@app.put("/resources/personnel/{id}")
def update_personnel_endpoint(id: str, req: PersonnelUpdate):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    p = crud.update_personnel(id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@app.delete("/resources/personnel/{id}")
def delete_personnel_endpoint(id: str):
    ok = crud.delete_personnel(id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


class ToolCreate(BaseModel):
    id: str
    name: str
    category: str
    location: str
    calibration_due: str


class ToolUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    location: str | None = None
    calibration_due: str | None = None


@app.get("/resources/tools/{id}")
def get_tool_by_id(id: str):
    t = crud.get_tool(id)
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    return t


@app.post("/resources/tools")
def create_tool_endpoint(req: ToolCreate):
    return crud.create_tool(req.model_dump())


@app.put("/resources/tools/{id}")
def update_tool_endpoint(id: str, req: ToolUpdate):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    t = crud.update_tool(id, data)
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    return t


@app.delete("/resources/tools/{id}")
def delete_tool_endpoint(id: str):
    ok = crud.delete_tool(id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


class PartCreate(BaseModel):
    id: str
    part_no: str
    name: str
    ata_chapter: str
    stock_level: int = 0
    location: str
    lead_time_days: int


class PartUpdate(BaseModel):
    part_no: str | None = None
    name: str | None = None
    ata_chapter: str | None = None
    stock_level: int | None = None
    location: str | None = None
    lead_time_days: int | None = None


@app.get("/resources/parts/{id}")
def get_part_by_id(id: str):
    p = crud.get_part(id)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@app.post("/resources/parts")
def create_part_endpoint(req: PartCreate):
    return crud.create_part(req.model_dump())


@app.put("/resources/parts/{id}")
def update_part_endpoint(id: str, req: PartUpdate):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    p = crud.update_part(id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@app.delete("/resources/parts/{id}")
def delete_part_endpoint(id: str):
    ok = crud.delete_part(id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


class WorkPackageCreate(BaseModel):
    id: str
    title: str
    aircraft: str
    ata: str
    status: str = "pending"
    assigned_to: str | None = None
    due_date: str


class WorkPackageUpdate(BaseModel):
    title: str | None = None
    aircraft: str | None = None
    ata: str | None = None
    status: str | None = None
    assigned_to: str | None = None
    due_date: str | None = None


@app.get("/work-packages/{id}")
def get_work_package_by_id(id: str):
    w = crud.get_work_package(id)
    if not w:
        raise HTTPException(status_code=404, detail="Not found")
    return w


@app.post("/work-packages")
def create_work_package_endpoint(req: WorkPackageCreate):
    return crud.create_work_package(req.model_dump())


@app.put("/work-packages/{id}")
def update_work_package_endpoint(id: str, req: WorkPackageUpdate):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    w = crud.update_work_package(id, data)
    if not w:
        raise HTTPException(status_code=404, detail="Not found")
    return w


@app.delete("/work-packages/{id}")
def delete_work_package_endpoint(id: str):
    ok = crud.delete_work_package(id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
