# Database & Migrations

## Local vs production

| Environment | DB | Connection string |
|---|---|---|
| Local development | SQLite | `DB_CONNECTION=sqlite` (uses `database/database.sqlite`) |
| Production (cPanel) | MySQL 8.0 / MariaDB | `DB_CONNECTION=mysql`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` |

The ORM is fully database-agnostic. Migrations use only portable Blueprint methods, so **no code changes are required** between environments — only `.env` values.

## Database-agnostic migration rules

1. **No database-specific column types.** Use `decimal('amount', 12, 2)`, `string('name', 255)`, `date('recorded_at')`, `boolean('is_active')`, `json('metadata')`.
2. **Explicit index naming** for composite unique keys and indexes to avoid engine naming conflicts.
3. **Clean foreign-key cascade behavior:** `cascadeOnDelete()`, `nullOnDelete()`, or `restrictOnDelete()`.
4. **No raw SQL triggers** or stored procedures — handle computed date updates inside Eloquent model observers and domain services.

## Migrations

All migrations live in `database/migrations/`. Key tables:

- `users` — authentication, roles (`SysAdmin`, `HRAdmin`, `Manager`, `Employee`)
- `departments`
- `employees` — staff profile, E.C./G.C. dates, status, address
- `employee_salaries` — basic wage + 8 allowance components, gross/net, pension
- `leave_balances`, `separations`, `promotions`, `contract_renewals`, `training_records`
- `audit_logs` — append-only change history
- `system_settings` — statutory parameter registry
- `sessions`, `jobs`, `cache`, `failed_jobs` — Laravel defaults

## Date conventions

- `employment_date`, `birth_date`, `probation_end_date`, `contract_end_date`, `retirement_date` are stored as `date` and cast with `'date:Y-m-d'` so they serialize compactly as `YYYY-MM-DD` (not ISO timestamps).
- E.C. dates are stored as strings in the `YYYY/MM/DD` format in the `em*-_ec` columns.
