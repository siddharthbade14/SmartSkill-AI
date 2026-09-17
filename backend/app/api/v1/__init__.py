from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.hitl import router as hitl_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.support import router as support_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents_router, prefix="/documents", tags=["Government Manuals & Documents"])
api_router.include_router(quizzes_router, prefix="/quizzes", tags=["Quizzes & Question Generation"])
api_router.include_router(hitl_router, prefix="/hitl", tags=["Human-in-the-Loop Review"])
api_router.include_router(assessments_router, prefix="/assessments", tags=["Learner Assessments & iGOT"])
api_router.include_router(support_router, prefix="/support", tags=["Help & Technical Support"])

