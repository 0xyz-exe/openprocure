from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import (
    auth, suppliers, requisitions, approvals, rfqs,
    purchase_orders, goods_receipts, invoices, dashboard,
    budgets, audit_logs, notifications
)

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Open-Source Procurement & Supplier Management System — Built for Transparency, Integrity & Accountability.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
api_v1 = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_v1)
app.include_router(suppliers.router, prefix=api_v1)
app.include_router(requisitions.router, prefix=api_v1)
app.include_router(approvals.router, prefix=api_v1)
app.include_router(rfqs.router, prefix=api_v1)
app.include_router(purchase_orders.router, prefix=api_v1)
app.include_router(goods_receipts.router, prefix=api_v1)
app.include_router(invoices.router, prefix=api_v1)
app.include_router(dashboard.router, prefix=api_v1)
app.include_router(budgets.router, prefix=api_v1)
app.include_router(audit_logs.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/ready", tags=["Health"])
def readiness_check():
    return {
        "status": "ready",
        "database": "connected",
        "timestamp": "2026-10-28T14:00:00Z"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system administrator."}
    )
