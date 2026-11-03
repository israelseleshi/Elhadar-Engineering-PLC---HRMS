# Architecture Overview

This document describes the high-level architecture of the **Elhadar Engineering HRMS**.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP 8.4) |
| Frontend | Inertia.js v2 + React 18 (TypeScript) + Tailwind CSS + Shadcn UI |
| Database (local) | SQLite 3 |
| Database (production) | MySQL 8.0 / MariaDB 10.6 on cPanel |
| Auth | Laravel session auth (Sanctum/breeze-style), role middleware |
| Charts | Recharts |
| Icons | Lucide React |
| Date handling | Carbon (Laravel) + custom EthiopianCalendarService |

## Monolithic architecture

```text
Browser (React 18 + TS + Shadcn UI + Inter Tight)
        ⬇️  Inertia JSON protocol / HTTPS
Laravel 12 (web controllers, session auth, CSRF)
        ⬇️  Eloquent database layer (SQLite or MySQL)
local SQLite  ⟷  cPanel MySQL (knltraoo / knltrading.com)
```

There is **no separate REST API**. Controllers return `Inertia::render()` props directly, so there are no duplicate API controllers or JWT refresh mechanisms.

## Key architectural decisions

1. **Inertia.js** — eliminates the overhead of a decoupled REST API and JWT layer.
2. **Dual-calendar modeling** — every date is displayed in Ethiopian Calendar (E.C.) and stored in standard ISO-8601 Gregorian SQL columns for interval arithmetic.
3. **Immutable audit trails** — every modification to employee status, salary, legal parameters, or department allocations is recorded in an append-only `audit_logs` table.
4. **Database portability** — migrations use standard Blueprint methods only (no SQLite/MySQL-specific hacks), so the app runs identically in local SQLite and production MySQL.
5. **Radix-powered Shadcn UI** — guarantees keyboard navigation, screen-reader support, and responsive mobile sheets.

## Role-based access

Routes are scoped by middleware groups in `routes/web.php`:

- **Guest** — login, password reset
- **Employee (ESS)** — `/portal/profile`, discrepancy reporting, photo upload
- **HRAdmin + SysAdmin** — staff creation, statutory confirmations, approvals, settings, audit
- **HRAdmin + SysAdmin + Manager** — operational core (employees index, probation, contracts, leave)

Admin sidebar routes are nested under role middleware, so employees cannot reach them.
