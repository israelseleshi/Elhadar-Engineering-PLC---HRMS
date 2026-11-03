# Secrets & Confidential Data Handling

This application contains highly confidential data: employee PII (names, IDs, national IDs, phone numbers, bank accounts, POESSA/PSSSA numbers), salary data, and production credentials. Treat everything as sensitive.

## Rules

1. **Never commit secrets to Git.** The `.gitignore` excludes `.env`, `*.key`, `auth.json`, and any private credentials. Use environment variables for all secrets.
2. **Never commit production credentials.** A single leaked `.env` exposes every employee record.
3. **Audit logs are sensitive.** The `audit_logs` table stores `old_values` and `new_values` of employee fields. Be very careful about what is logged.
4. **Export/Import payloads contain PII.** CSV exports include bank accounts, POESSA numbers, and contact details. Restrict who can trigger exports and which columns are exported.
5. **Do not commit seed/test data containing real people.** Use factories and seeded placeholder data only.
6. **Use .env.local for machine-specific overrides.** It is gitignored and never committed.

## .gitignore

All critical patterns are in `.gitignore`:

- `.env`, `.env.backup`, `.env.production`, `.env.key`
- `auth.json`
- `*.pem`, `*.key`, `*.pfx`
- credentials/service account JSON placeholders
- `elhadar_deploy.tar.gz`, `update_2019.tar.gz` (deployment archives can embed configs)
- `storage/*.key`, `storage/logs/*.log`

## Handling audit logs

`AuditLog` records `old_values`/`new_values` as full JSON. If a field contains sensitive data, it will appear in logs. Do not store or log anything you would not want leaked.

## Exporting data

The `/export/employees` route streams a CSV of the entire roster. Restrict it behind role middleware (it already is) and route any bulk-export request through the HR-admin approval path.

## Deleting credentials

- `EMPLOYEE_LOGIN_CREDENTIALS.md` contains **temporary, production usernames/passwords**. It must remain **local only** and must never be committed to the repo. Move it to `.gitignore` and delete it before sharing.

## Incident response

If you suspect a secret was leaked:

1. Revoke/rotate the exposed key or credential immediately.
2. Rotate the `APP_KEY` (`php artisan key:generate`) if the app key leaked.
3. Review deployment logs for signs of unauthorized access.
4. Consider re-securing any data exposed in the leak.

See also [docs/security/incident-response.md](incident-response.md).
