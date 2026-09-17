import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.db.session import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered
from app.api.v1 import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smartskill_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables and initial seed data are present
    logger.info("Initializing SmartSkill AI database schema and seed data...")
    try:
        from app.db.init_db import init_db
        init_db()
        logger.info("Database schema and seed data synchronized successfully.")
    except Exception as e:
        logger.error(f"Database initialization encountered an error: {e}", exc_info=True)
    yield
    # Shutdown
    logger.info("Shutting down SmartSkill AI service.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI-powered micro-learning and assessment system for MoSPI / iGOT Karmayogi civil services integration.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing & telemetry middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response
    except Exception as exc:
        process_time = time.time() - start_time
        logger.error(f"Unhandled exception during request processing ({request.method} {request.url.path}): {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred while processing the request. The issue has been logged.",
                "path": request.url.path,
                "process_time": f"{process_time:.4f}s"
            }
        )


# Global Exception Handler for Starlette/FastAPI HTTP Exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "HTTP Error",
            "detail": exc.detail,
            "status_code": exc.status_code,
            "path": request.url.path
        },
        headers=exc.headers
    )


# Global Exception Handler for Pydantic Validation Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field_loc = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append({
            "field": field_loc,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "validation_error")
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "detail": "Input validation failed for one or more fields.",
            "validation_errors": errors,
            "path": request.url.path
        }
    )


# General fallback exception handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global catch-all intercepted unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Server Error",
            "detail": str(exc) if settings.GEMINI_TEMPERATURE == 0.0 else "Internal server error occurred.",
            "path": request.url.path
        }
    )


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health & Monitoring"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "production"
    }
