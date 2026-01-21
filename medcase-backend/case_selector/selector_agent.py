# case_selector/selector_agent.py
import orjson
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from services.database import SessionLocal
from services.models import Case


class CaseSelectorAgent:
    """
    SQLite tabanlı CaseSelector:
    - Startup'ta JSON yüklemez
    - DB'den list/lookup/random çeker
    """

    def __init__(self):
        # İstersen burada DB health check yapabilirsin ama şart değil.
        pass

    def _parse_json(self, s: str, fallback: Any):
        if not s:
            return fallback
        try:
            return orjson.loads(s)
        except Exception:
            return fallback

    def list_cases_summary(self, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        """
        /cases için hafif liste: narrative'den kısa özet + has_image gibi alanlar.
        """
        db = SessionLocal()
        try:
            stmt = (
                select(Case.id, Case.title, Case.specialty, Case.difficulty, Case.narrative, Case.assets_json)
                .order_by(Case.id)
                .limit(limit)
                .offset(offset)
            )
            rows = db.execute(stmt).all()

            out = []
            for r in rows:
                assets = self._parse_json(r.assets_json, {"images": []})
                images = (assets or {}).get("images", [])
                out.append({
                    "id": r.id,
                    "title": r.title or "Untitled Case",
                    "specialty": r.specialty or "General",
                    "difficulty": r.difficulty or "Intermediate",
                    "summary": (r.narrative or "")[:120] + "...",
                    "has_image": bool(images) and len(images) > 0,
                })
            return out
        finally:
            db.close()

    def get_case_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        db = SessionLocal()
        try:
            row = db.get(Case, case_id)
            if not row:
                return None

            assets = self._parse_json(row.assets_json, {"images": []})
            rubric = self._parse_json(row.rubric_json, {})

            return {
                "id": row.id,
                "title": row.title or "",
                "specialty": row.specialty or "",
                "difficulty": row.difficulty or "Intermediate",
                "narrative": row.narrative or "",
                "assets": assets,
                "rubric": rubric,
                # seed_questions artık DB'de yoksa boş dön
                "seed_questions": [],
            }
        finally:
            db.close()

    def select_random_case(self) -> Optional[Dict[str, Any]]:
        """
        SQLite'ta en pratik random: ORDER BY RANDOM() LIMIT 1
        (200-5k kayıt gibi boyutlarda gayet yeterli)
        """
        db = SessionLocal()
        try:
            stmt = select(Case.id).order_by(func.random()).limit(1)
            case_id = db.execute(stmt).scalar_one_or_none()
            if not case_id:
                return None
            return self.get_case_by_id(case_id)
        finally:
            db.close()


# singleton
selector_agent = CaseSelectorAgent()