# routers/tutor_router.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# --- DEĞİŞİKLİK: Eski servisi sildik, yerine yeni Ajan hafızasını ekledik ---
from case_selector.selector_agent import selector_agent
# --------------------------------------------------------------------------

from tutor.tutor_agent import TutorAgent
from tutor.schemas import (
    TutorInput,
    TutorOutput,
    CaseContext,
    StepContext,
    UserContext,
)

# Prefix main.py'de tanımlı olabilir ama burada da router tanımlıyoruz
router = APIRouter()

# Ajanı başlatıyoruz
agent_instance = TutorAgent()

# -------------------------------------------------------------------------
# 1. FRONTEND İÇİN YENİ ENDPOINT (/ask)
# Frontend şu an buraya istek atıyor: apiPost("/tutor/ask", body)
# -------------------------------------------------------------------------
@router.post("/ask", response_model=TutorOutput)
async def ask_tutor(req: TutorInput):
    """
    Frontend 'Hoca Modu'ndan gelen istekleri karşılar.
    Frontend sadece Case ID gönderir, biz burada içini doldururuz.
    """
    # 1. Vakayı hafızadan bul
    case_data = selector_agent.get_case_by_id(req.case.id)
    
    if not case_data:
        raise HTTPException(status_code=404, detail="Case not found in memory")

    # 2. Frontend'den gelen 'req' nesnesinin içindeki vaka bilgisini
    #    veritabanındaki (hafızadaki) gerçek metinlerle doldur.
    #    (Çünkü frontend sadece ID yolluyor, metni yollamıyor)
    req.case.title = case_data.get("title", "")
    req.case.narrative = case_data.get("narrative", "")
    req.case.summary = case_data.get("narrative", "")[:200]

    # 3. Ajanı çalıştır
    try:
        response = agent_instance.run(req)
        return response
    except Exception as e:
        print(f"Tutor Agent Hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------------------
# 2. ESKİ ENDPOINT (Yedeklilik İçin Korundu)
# Eğer eski bir yapı root ("/") adresine istek atarsa burası çalışır.
# -------------------------------------------------------------------------

# Eski Request Modelleri (Geriye uyumluluk için)
class StepPayload(BaseModel):
    question: str = Field(min_length=1)
    options: List[str] = Field(default_factory=list)
    correct: Optional[int] = None
    selectedIndex: Optional[int] = None

class LegacyTutorRequest(BaseModel):
    mode: Literal["hint", "explain", "teach"] = "hint"
    case_id: str
    message: str
    step: Optional[StepPayload] = None

@router.post("", response_model=TutorOutput)
async def tutor_legacy(req: LegacyTutorRequest) -> TutorOutput:
    # 1) Case çek (Yeni Selector Agent'tan)
    case = selector_agent.get_case_by_id(req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case not found: {req.case_id}")

    # 2) StepContext Oluştur
    if req.step is None:
        seed_q = "Bu vakada ilk yaklaşımın nedir?"
        step_ctx = StepContext(
            question=seed_q,
            options=["Devam et", "İpucu ver"],
            correct=0,
        )
        user_ctx = UserContext(selectedIndex=None, ask=req.message)
    else:
        step_ctx = StepContext(
            question=req.step.question,
            options=req.step.options or ["Devam et", "İpucu ver"],
            correct=req.step.correct if req.step.correct is not None else 0,
        )
        user_ctx = UserContext(
            selectedIndex=req.step.selectedIndex,
            ask=req.message,
        )

    # 3) CaseContext Doldur
    case_ctx = CaseContext(
        id=case.get("id", req.case_id),
        title=case.get("title", ""),
        narrative=case.get("narrative", ""), # Narrative eklendi
        summary=case.get("narrative", "")[:200],
        step=step_ctx,
    )

    # 4) TutorInput Hazırla
    inp = TutorInput(
        mode=req.mode,
        case=case_ctx,
        user=user_ctx,
        language="tr" # Varsayılan Türkçe
    )

    # 5) Agent Çağır
    return agent_instance.run(inp)