# Deployment & Infrastructure

## Server

- Host: cPanel Linux account `knltraoo`
- Domain: `knltrading.com`
- Document root (recommended): dedicated `hrms` subdirectory, e.g. `/home/knltraoo/public_html/hrms`

## PHP configuration

- PHP **8.4** runtime with required extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `ctype`.
- Ensure the SQLite PDO extension is **not** required for production (switch to `pdo_mysql`).
- Recommended PHP settings: `upload_max_filesize = 20M`, `post_max_size = 20M` to allow Excel import uploads.

## MySQL database setup (cPanel)

1. Create the database `knltraoo_hrms` via cPanel Database Wizard.
2. Create a MySQL user `knltraoo_hrmsuser` and grant all privileges on that database.
3. Update `.env`:
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=knltraoo_hrms
   DB_USERNAME=knltraoo_hrmsuser
   DB_PASSWORD=<secure-production-password>
   ```
4. Run `php artisan migrate --force` from the project root, then `php artisan config:cache` (optional in production).

## Cron / scheduler

The app uses Laravel's scheduler. In cPanel, add a **Cron Job** pressing the **"Add a New Cron Job"** button with:

```text
* * * * * cd /home/knltraoo/public_html/hrms && php artisan schedule:run >> /dev/null 2>&1
```

Set the frequency to **Once Per Minute**. The scheduler runs the daily 01:00 statutory calculation jobs.

## Environment variables

Create a `.env` file and set at minimum:

```ini
APP_NAME="Elhadar Engineering HRMS"
APP_ENV=production
APP_KEY=base64:<generated>
APP_DEBUG=false
APP_URL=https://hrms.knltrading.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=knltraoo_hrms
DB_USERNAME=knltraoo_hrmsuser
DB_PASSWORD=<secure>

SESSION_DRIVER=database
QUEUE_CONNECTION=database

CACHE_STORE=database
LOG_CHANNEL=stack
```

Generate the APP_KEY with `php artisan key:generate --show`.

## Security & hardening

See [docs/security/secret-handling.md](security/secret-handling.md) and [docs/security/incident-response.md](security/incident-response.md).

- Never commit `.env`; it is already ignored.
- Set `APP_DEBUG=false` in production.
- Secure the `/storage` link and avoid exposing vendor files.
- Use signed routes for password resets (already configured).
