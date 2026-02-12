"""
Veri erişim servisi – SQLite üzerinden CRUD.
"""

from typing import Any

from app.db import crud
from app.db.database import init_db, seed_from_json


def ensure_db() -> None:
    """Veritabanını başlat ve seed et."""
    init_db()
    seed_from_json()


def get_personnel() -> list[dict[str, Any]]:
    return crud.list_personnel()


def get_tools() -> list[dict[str, Any]]:
    return crud.list_tools()


def get_parts() -> list[dict[str, Any]]:
    return crud.list_parts()


def get_work_packages() -> list[dict[str, Any]]:
    return crud.list_work_packages()


def get_efficiency_metrics() -> dict[str, Any]:
    packages = get_work_packages()
    approved = sum(1 for p in packages if p.get("status") == "approved")
    total = len(packages) or 1
    return {
        "avg_completion_days": 4.2,
        "first_pass_success_rate": 92,
        "tasks_per_hour": 2.8,
        "resource_utilization": 78,
        "target_avg_completion_days": 4.0,
        "target_first_pass": 95,
        "target_tasks_per_hour": 3.0,
        "target_resource_utilization": 80,
        "approved_count": approved,
        "total_count": total,
    }


def get_efficiency_monthly() -> list[dict[str, Any]]:
    return [
        {"month": "Oca", "completed": 42, "planned": 45},
        {"month": "Şub", "completed": 38, "planned": 40},
        {"month": "Mar", "completed": 52, "planned": 50},
        {"month": "Nis", "completed": 48, "planned": 48},
        {"month": "May", "completed": 55, "planned": 52},
    ]


def get_scrum_dashboard() -> dict[str, Any]:
    packages = get_work_packages()
    personnel = get_personnel()
    tools = get_tools()
    parts = get_parts()

    completed = sum(1 for p in packages if p.get("status") == "approved")
    total = len(packages) or 1
    in_progress = sum(1 for p in packages if p.get("status") == "in_progress")

    status = "In Progress" if in_progress > 0 or completed < total else "Completed"
    velocity = round(completed * 1.0, 1) if total > 0 else 0
    target = max(total, 10)

    available_personnel = sum(1 for p in personnel if p.get("availability") == "available")
    personnel_util = round((available_personnel / len(personnel) * 100) if personnel else 0)
    tools_count = len(tools)
    equipment_util = min(78, 50 + tools_count * 3) if tools_count else 65
    parts_with_stock = sum(1 for p in parts if (p.get("stock_level") or 0) > 0)
    stock_adequacy = round((parts_with_stock / len(parts) * 100) if parts else 0)

    resource_util = [
        {"label": "Teknisyen Kullanımı", "value": personnel_util, "status": "good" if personnel_util >= 60 else "warning"},
        {"label": "Ekipman Kullanımı", "value": equipment_util, "status": "good" if equipment_util >= 60 else "warning"},
        {"label": "Parça Stok Yeterliliği", "value": stock_adequacy, "status": "good" if stock_adequacy >= 60 else "warning"},
    ]

    last_packages = packages[-5:] if len(packages) > 5 else packages
    recent = [
        {"id": str(p.get("id", "")), "title": str(p.get("title", "")), "status": str(p.get("status", "pending"))}
        for p in reversed(last_packages)
    ]

    return {
        "sprint": {
            "name": "Bakım Sprint 24-08",
            "status": status,
            "days_remaining": max(0, 5 - (completed // 3)),
            "completed": completed,
            "total": total,
            "velocity": velocity,
            "target": target,
        },
        "resource_util": resource_util,
        "recent_items": recent,
    }
