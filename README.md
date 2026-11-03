# Elhadar Engineering PLC — HRMS

A human resource management system built for **Elhadar Engineering PLC** (Ethiopia), a grade-one general contractor.

- **Backend:** Laravel 12 (PHP 8.4)
- **Frontend:** Inertia.js v2 + React 18 (TypeScript) + Tailwind CSS + Shadcn UI
- **Database:** SQLite for local development, MySQL (cPanel) for production
- **Compliance:** Ethiopian Labour Proclamation No. 1156/2019 & Private Organization Employees' Pension Proclamation No. 1268/2022
- **Feature:** Bi-directional Ethiopian Calendar (E.C. ↔ G.C.) engine, statutory calculation services, Excel master-list ingestion, dual-role auth (HRAdmin + Employee), immutable audit logs

## Project structure

```text
app/
  Http/Controllers/   Inertia page controllers
  Models/             Employee, User, Salary, Leave, Separation...
  Services/           EthiopianCalendarService, Severance, Tenure...
  Http/Middleware/    role, password.changed
resources/js/         React pages, components, Shadcn UI
routes/web.php        Inertia routes + role-based middleware
database/migrations/  Portable migrations (SQLite + MySQL)
docs/                 Documentation (architecture, setup, deployment, guidelines)
```

## Setup (local)

```bash
cp .env.example .env
# edit .env: DB_CONNECTION=sqlite
php artisan key:generate
php artisan migrate
npm install
npm run dev
# then: php artisan serve
```

## Deployment (cPanel)

Set `DB_CONNECTION=mysql` + the cPanel MySQL credentials in `.env`; run `php artisan migrate`. No code changes needed between SQLite and MySQL.

## Documentation

Full docs are in [docs/](docs/). Highlights:

- [docs/architecture/system-topology.md](docs/architecture/system-topology.md)
- [docs/configuration/database-migrations.md](docs/configuration/database-migrations.md)
- [docs/deployment/cpanel-deploy.md](docs/deployment/cpanel-deploy.md)
- [docs/security/secret-handling.md](docs/security/secret-handling.md)

## Security

See [docs/security/secret-handling.md](docs/security/secret-handling.md) for how to handle credentials, audit logs, and confidential data.

## License

This project is proprietary and confidential to Elhadar Engineering PLC.
