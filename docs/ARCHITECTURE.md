# OpenProcure — System Architecture

OpenProcure is designed as a modular monolith providing high performance, tenant data isolation, and auditable business workflows.

## 1. High-Level Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│    (Tailwind CSS v4 • Vite • Lucide • React Router)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Engine                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Core Services:                                   │  │
│  │ • 3-Way Reconciliation Engine (PO vs GR vs Inv)  │  │
│  │ • Multi-Tier Approval Workflow Engine            │  │
│  │ • Concurrency-Safe Sequence Document Generator   │  │
│  │ • Append-Only Audit Event Trail                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Organization Tenant Boundary & RBAC Guards       │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy 2.0 ORM
┌───────────────────────────▼────────────────────────────┐
│      PostgreSQL 16 / Standalone SQLite Persistence     │
│   (Relational Foreign Keys, Constraints & Indexes)     │
└────────────────────────────────────────────────────────┘
```

## 2. Backend Design Decisions
- **Framework Choice:** Built on high-performance async Python with FastAPI, SQLAlchemy 2.0, and Pydantic v2. This guarantees zero-latency execution, native OpenAPI/Swagger self-documentation, and eliminates Windows binary query-engine download hangs associated with Prisma.
- **Tenant Data Isolation:** Every business record (Suppliers, Requisitions, RFQs, POs, Receipts, Invoices, Budgets) carries a mandatory `organization_id` foreign key. Endpoints automatically scope queries to the authenticated user's organization.
- **Transactional Consistency:** Critical state transitions (such as PO fulfillment on Goods Receipt intake or Budget commitment updates) run within explicit database transactions.
