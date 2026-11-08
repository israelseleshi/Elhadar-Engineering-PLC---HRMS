# Elhadar HRMS — Codebase Remediation Plan

**Audit date:** 2026-11-08
**Target stack (verified, not assumed):** PHP 8.4 · Laravel **13.39.0** · Inertia **2.0.28** · React 18.3 · TypeScript 5.7 · Vite 8.3 · Tailwind 3.4 · SQLite (local) / MySQL (production)
**Report author:** audit performed against the working tree at `C:\Users\israe\OneDrive\Documents\Elhadar-HRMS`
**Scope requested:** verify a prior Gemini audit, expand it, and produce an implementation-grade plan

---

## 0. How this document was produced

### 0.1 Important correction about tooling

Your `AGENTS.md` states that this project is indexed in `codebase-memory-mcp` and instructs agents to prefer `search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, `check_index_coverage`, and `detect_changes` over file search.

**That MCP server is not configured in this workspace.** `.mcp.json` declares exactly two servers:

```json
{
  "mcpServers": {
    "laravel-boost": { "command": "php", "args": ["artisan", "boost:mcp"] },
    "chrome-devtools": { "args": ["-y", "chrome-devtools-mcp@latest"], "command": "npx" }
  }
}
```

`tools.opencode.list_mcp_resources()` returned only `laravel-boost` and `memory` resources. There is no graph project, no generation id, and no coverage map. Any agent following `AGENTS.md` literally will burn turns hunting for tools that do not exist.

> **Action item 0 (30 minutes):** either add the `codebase-memory-mcp` entry to `.mcp.json` and index the repo, or delete the `<!-- codebase-memory-mcp:start -->` block from `AGENTS.md`. Do not leave instructions that point at absent tooling — it degrades every future agent session, including mine.

Because the graph was unavailable, this audit used a **harder evidence standard**: direct source reads, exact line counts, import-graph extraction, bundle measurements, and live schema queries through `laravel-boost`. Every number below is reproducible with the commands in Appendix A. Where I could not verify something, I say so explicitly instead of asserting it.

### 0.2 Evidence tiers used

| Tier | Meaning | Used for |
|---|---|---|
| **A — Measured** | Counted from files, build output, or live DB | All line counts, column counts, bundle sizes, dependency usage |
| **B — Read** | Full source read of the file in question | All behavioral claims (fallbacks, duplicated logic, missing transactions) |
| **C — Inferred** | Reasoned from framework semantics, not executed | Projected query counts, performance ceilings, scaling behavior |
| **D — Unverified** | Carried over from the Gemini audit, contradicted by measurement, or untestable here | Flagged in §1 |

### 0.3 Baseline state (green)

Before listing what is wrong, it is fair to state what is right, because it changes the shape of the plan:

- `php artisan test --compact` → **137 passed, 783 assertions, 22.9s**. The suite is real and it runs fast enough to gate every PR.
- `npm run build` → `tsc && vite build` compiles. Strict mode is on in `tsconfig.json`.
- Page-level code splitting already works: `app.tsx` uses `resolvePageComponent` with a non-eager `import.meta.glob`, so a 1,491-line page is *not* downloaded by unrelated routes.
- There **is** a `resources/js/types/` directory (`index.d.ts`, `global.d.ts`, `vite-env.d.ts`). It is thin, not absent.
- There **is** a real service layer: `app/Services/` holds 11 focused classes (`TenureCalculationService` 38 lines, `RetirementCalculationService` 67, `TurnoverCalculationService` 88, `ExcelDateNormalizer` 90, …). Several are genuinely well-factored, with PHPDoc array shapes and injected dependencies.
- There **are** feature tests for the risky domains: `EmployeeOnboardingTest`, `ExcelImportExportTest`, `PortalTest`, `RoleAccessControlTest`, `StatutoryCalculationsTest`, `EthiopianCalendarTest`.
- There is a CI workflow (`.github/workflows/deploy.yml`) that installs PHP 8.4, builds the frontend, and runs the suite.
- TypeScript hygiene is better than typical: **0** `@ts-ignore`, **0** `console.log`, **1** `eslint-disable`, 17 `: any` and 14 `as any` across 27,505 frontend lines.

**Consequence for the plan:** this is not a "rewrite it" codebase. It is a well-intentioned codebase that has accumulated **duplication along write paths** and **unbounded component growth along read paths**. The remedies are surgical, and they can be landed incrementally behind a green test suite. Anyone proposing a rewrite is proposing to throw away 137 working tests for no reason.

---

## 1. Verification of the Gemini audit

Your prior audit was directionally useful but contained material inaccuracies. You should not plan work against it without correcting these, because two of its "quick wins" would waste days on code that has already changed or on problems that do not exist at the stated scale.

### 1.1 Claim-by-claim verdict

| # | Gemini claim | Verdict | Measured reality |
|---|---|---|---|
| 1 | 7 frontend files > 1,000 lines, largest is `Profile.tsx` at **2,144** | **Confirmed, numbers off** | Largest is `Profile.tsx` at **2,062**. Seven files exceed 1,000: 2,062 / 1,692 / 1,491 / 1,162 / 1,116 / 1,073 / 1,013. The *shape* of the problem is exactly as described. |
| 2 | `Create.tsx` and `Edit.tsx` duplicate **nearly 1,400 identical lines** | **Overstated** | Exact-line overlap is **45 unique lines ≈ 9%**. But **39 of the 45 form fields in `Create.tsx` are also in `Edit.tsx` (87% field overlap)**, rendered twice in two different layouts. The duplication is real and expensive, just not literal copy-paste. |
| 3 | "0 shared TypeScript type files" | **Incorrect** | `resources/js/types/` exists with `index.d.ts` (`User`, `PageProps`), `global.d.ts` (Ziggy), `vite-env.d.ts`. What is missing is **domain** types — every page redeclares its own `interface Props { employee: {...} }` inline. |
| 4 | `EmployeeController` is "400+ lines" | **Incorrect** | It is **263 lines**. |
| 5 | `ExcelImportExportController` is 437 lines | **Slightly off** | **397 lines**. The behavioral criticism (synchronous parse, per-row queries) is **correct** — see §2.7. |
| 6 | Controllers have "no service layer"; all logic inline | **Incorrect** | 11 services exist and are injected via constructor promotion. The problem is that **orchestration** (the sequence of create → salary → leave balance → audit) lives in controllers *and* is copy-pasted into two Artisan commands and the import controller. |
| 7 | No `app/Actions`, no `app/Policies`, no `app/DTOs`, no `app/Http/Resources` | **Confirmed** | Verified by directory listing. Only `Console`, `Http`, `Models`, `Providers`, `Services` exist. |
| 8 | `ImportExcelMasterListCommand` is 589 lines of "procedural" code | **Partly** | **515 lines**, and it is *not* procedural — it uses constructor-injected services and private methods (`ingestModernWorkbook`, `processModernSheet`, `resolveGregorianDate`, …). The real defect is that it is a **permanent one-off data migration** shipping in `app/Console/Commands`, not that it is badly written. |
| 9 | Dashboard "triggers over 20 queries" and causes "memory exhaustion" | **Half confirmed** | In-memory `->get()->filter()` on retirement is **confirmed** (`DashboardController.php:86-106`). Query count is **≈30** (C-tier estimate; 9 counts + 4×2 turnover + 4 salary sums + 5 alert/detail queries). "Memory exhaustion" is **not** true today: the table holds **362 rows**. This is a scaling pattern risk, not an outage. |
| 10 | `PortalController` falls back to `Employee::first()` | **Confirmed and worse than described** | Three separate fallbacks: `profile()` line 37, `reportDiscrepancy()` line 111 (`firstOrFail()`), `requestLeave()` line 134. Gemini found one. |
| 11 | `GuestLayout.tsx` statically imports the 937-line (actually 847) `BackgroundCubesGrid`, pulling **564 kB of Three.js into the login screen** | **Stale / Incorrect** | `GuestLayout.tsx` does **not** import it. `BackgroundCubesGrid` has **0 importers anywhere** — it is orphaned dead code. `three` is likewise only imported by that dead file. There is no login-page Three.js cost to remove. |
| 12 | `Dashboard.js` is **581 kB**; `GuestLayout.js` is **564 kB** | **Incorrect** | `Dashboard-*.js` is **435.9 kB**. There is **no `GuestLayout` chunk at all** (no page imports it as a Vite entry in a way that produced separate output). The real heavy shared chunk is **`AuthenticatedLayout-*.js` at 247.9 kB**. |
| 13 | "Dual UI system: Breeze components used by auth pages" | **Half wrong** | `PrimaryButton`, `TextInput`, `SecondaryButton`, `DangerButton`, `Checkbox`, `Modal` have **0 importers** — they are dead files, not an active parallel system. Only `InputError` and `InputLabel` remain live (8 files each). The auth pages already use `ui/button` + `ui/input`. |
| 14 | Ethiopian dates stored as unstructured `varchar(20)` with mixed formats | **Confirmed** | `employment_date_ec`, `birth_date_ec` are `string(20)`. Defensive `str_starts_with($x, '=')` / `str_contains($x, 'DATEDIF')` guards are duplicated in `EmployeeController::show()` (lines 272-279) and `PortalController::profile()` (lines 55-62). |
| 15 | `employees` table has 55+ columns | **Confirmed** | **57 columns** (`pragma_table_info`). |
| 16 | Migrations used as ad-hoc data fixes | **Confirmed** | `2026_11_05_092410_remove_dummy_abay_discrepancy_reports.php` deletes rows matching a specific employee name and specific bank account numbers, with an empty `down()`. |
| 17 | Zero frontend tests; no Vitest/Jest | **Confirmed** | `@playwright/test` is in `devDependencies` but there is no `playwright.config.ts` and no specs. No Vitest, no Jest, no `test` script in `package.json` (`build` and `dev` only). |
| 18 | Roadmap "Phase 1 Days 1-2" starts with lazy-loading Three.js | **Unsafe as written** | The perceived win does not exist; the actual quick win is deleting the orphan file. Also, Gemini's Phase 1 includes `Model::preventLazyLoading()` — that will **break the current test suite** if any eager-load gap exists, so it must be introduced as `Model::preventLazyLoading(!app()->isProduction())` plus a full test run, not as a blind flip. |

### 1.2 What Gemini missed entirely

These are, in my assessment, the highest-value findings in this audit — they were absent from the prior report:

| Finding | Evidence | Why it matters |
|---|---|---|
| **The statutory settings registry is decorative.** `system_settings` stores `pension_employee_rate = 7.0`, `pension_employer_rate = 11.0`, `annual_leave_base_days = 16`, `statutory_retirement_age = 60` — and **no code reads any of them for computation.** | 6 hardcoded pension calculations; `AnnualLeaveCalculationService` hardcodes `16.0`; `RetirementCalculationService::STATUTORY_RETIREMENT_AGE = 60` | An admin can change the rate in Settings, see it saved, and get zero effect. That is a silent correctness trap with payroll and legal exposure. |
| **Leave days are client-supplied.** `PortalController::requestLeave()` validates `requested_days` with `min:0.5|max:120` and stores it directly. It is never recomputed from `start_date`/`end_date`. | `PortalController.php:144` vs `:164` | An employee can request 0.5 days for a 30-day absence. Approving it deducts 0.5. The statutory ledger is then wrong, in the employee's favour, with an audit trail that looks legitimate. |
| **Unvalidated discrepancy values are written straight to payroll-critical columns.** | `PortalController.php:277-291` — `$report->employee->update([$col => $report->proposed_value])` where `bank_account_no` is in `$allowedColumns` | An employee submits a "correction" for `bank_account_no`; an HR admin approves without validation; salary is redirected. The `proposed_value` is a plain `string max:255`, never type-checked against the column. |
| **Leave-balance deduction exists twice, untransacted, unlocked, silently clamped.** | `LeaveBalanceController::reviewRequest()` lines 109-129 vs `adjust()` lines 200-207 | Two concurrent approvals read the same `taken_days`, both write `taken + n`, one deduction is lost. `max(0, ...)` then hides over-deduction instead of erroring. |
| **`isNearingRetirement()` counts people who retired up to 5 years ago.** | `RetirementCalculationService.php` line: `return $daysRemaining <= $withinDays && $daysRemaining >= -1825;` | `-1825` days = 5 years past the retirement date still reports "nearing retirement". Dashboard alert list is polluted. |
| **`$appends = ['profile_photo_url', 'age']` on every `Employee` serialization.** | `Employee.php:74-77` | `asset()` is called and a Carbon diff computed for every employee row on every payload, including the 15-row paginated index and the import preview. Also leaks an absolute URL into every response. |
| **Global 10-second polling on every authenticated page.** | `NotificationBell.tsx:143` `setInterval(fetchFeed, 10000)`, mounted from `AuthenticatedLayout` | 6 requests/minute/tab to `/notifications/feed`, each costing ~7 queries (`getFeed` batches reads/acks/reactions, well-written but not free). 8,640 requests/day/tab. At 300 staff with 2 tabs open that is ~5.2M requests/month for a badge count. |
| **`framer-motion` is in the global authenticated layout.** | `AuthenticatedLayout.tsx` → `DarkThemeSelector.tsx` → `framer-motion`; `Dashboard.tsx` also imports it directly | Every authenticated route pays for the animation library in the 247.9 kB shared chunk, even on pages with no motion. |
| **34 of 56 `ui/*` components are unused = 4,525 dead lines of 6,452 (70%).** | Import-graph scan | Maintainers must read and "keep in sync" a component library that the app does not use. It is the single largest removable mass in the frontend. |
| **No ESLint, no Prettier, no frontend `test` script; CI never runs Pint or a linter.** | `package.json` scripts = `build`, `dev` only; `deploy.yml` runs `composer validate`, `npm run build`, `php artisan test` | Style is enforced only by convention and by whatever editor a developer happens to use. `vendor/bin/pint` exists but nothing gates it. |
| **`Employees/Index.tsx` receives `Fresh in this month`-style derived data computed in PHP but also recomputes filters client-side**, with URL-sync logic duplicated in `Employees/Index`, `Announcements/Index`, `NewEmployees/Index`. | 3 pages reimplement `executeFilter` / `debouncedFilter` / `resetAllFilters` | The next filterable page will copy it a fourth time. |
| **`formatCurrency` is defined 10 times across the frontend.** | count of `const formatCurrency` | Currency formatting is a domain rule (ETB, 2dp). Ten copies means ten chances to drift. |
| **`formatEthiopianDisplay`, `gcToEc`, `ecToGc` called with ad-hoc string surgery in components.** | e.g. `Profile.tsx:401` does `ec.split('-')[2] + '/' + ec.split('-')[1] + '/' + ec.split('-')[0] + ' E.C.'` inline | Two representations of the same date (ISO `YYYY-MM-DD` and display `DD/MM/YYYY E.C.`) are constructed in multiple places with no single owner. |

### 1.3 Net assessment of the Gemini report

- **Useful:** the inventory of oversized files, the identification of the `Employee::first()` fallback, the missing Resources/Policies/DTOs, the Ethiopian-date normalization problem, and the absence of frontend tests.
- **Unsafe to execute as written:** the Three.js lazy-loading step (nothing to fix), the "delete Breeze components" step (already effectively done except two files), the "581 kB Dashboard" framing (it is 435.9 kB and that is normal for a chart page), and the "memory exhaustion" framing (362 rows).
- **Missing the point:** it treated the codebase as uniformly bad. It is not. The service layer is sound. The test suite is real. The actual disease is **duplication at every write path** and **monolithic files at every read path**, and the plan should target those two things precisely.

---

## 2. Measured health scorecard

| Dimension | Measured value | Reasonable target | Gap |
|---|---|---|---|
| Largest frontend file | 2,062 lines (`Portal/Profile.tsx`) | ≤ 250 | **8.2×** |
| Files > 1,000 lines | 7 | 0 | — |
| Files > 500 lines | 15 | ≤ 3 | — |
| Total frontend source | 27,505 lines / 30 pages | — | — |
| Dead `ui/*` component lines | 4,525 (34 of 56 files) | 0 | **70% of `ui/`** |
| Largest backend file | 515 (`ImportExcelMasterListCommand`) | ≤ 250 | 2.1× |
| Controllers > 250 lines | 6 | 0 | — |
| `app/` total | ~4,700 lines PHP | — | — |
| Automated tests | 137 passing / 783 assertions | keep green, add per-PR | good |
| Feature test files | 22 | — | good |
| Frontend tests | 0 | ≥ 40 unit + 5 E2E | **total gap** |
| Statutory rates hardcoded | 6 sites (7%), 6 sites (11%), 4 sites (16) | 1 site | — |
| `system_settings` keys read at runtime | 4 of 15 | 15 of 15 or delete the dead keys | — |
| Authorization policies | 0 | 4 (`Employee`, `LeaveRequest`, `DataCorrectionReport`, `Announcement`) | **total gap** |
| Inertia responses shaped by Resources | 0 of 28 | 28 of 28 or an explicit decision record | **total gap** |
| Largest build chunk (JS) | 435.9 kB (`Dashboard`) | ≤ 250 kB initial per route | 1.7× |
| Shared layout chunk | 247.9 kB (`AuthenticatedLayout`) | ≤ 120 kB | 2.1× |
| CSS bundle | 170.8 kB | ≤ 100 kB | 1.7× |
| Lint/format gates in CI | none | Pint + ESLint + `tsc` | **total gap** |
| DB engine (local / prod) | SQLite / MySQL | — | — |
| Rows in `employees` | 362 | — | scale is small today |
| Columns in `employees` | 57 | ≤ 25 + related tables | — |

### 2.1 Prioritisation rationale

Ranking is **risk-adjusted value**, not raw ugliness. A 2,062-line component is unpleasant to maintain; an unvalidated write to `bank_account_no` can misdirect someone's salary. Correctness and security outrank aesthetics, and both outrank bundle size — but bundle size comes last only because the current numbers are survivable.

Order: **integrity → duplication → performance → structure → hygiene → tooling.**

Two rules the plan follows:

1. **No step requires a big-bang rewrite.** Every item lands as an independent PR that leaves the suite green.
2. **Every step has a falsifiable acceptance test**, written down *before* the refactor, so "we improved it" is measurable rather than asserted.

---

## 3. Improvement Area 1 — Authorization, identity integrity, and server-authoritative writes

**Severity: Critical.** This is the only area in the audit where the current code can produce **wrong money** and **wrong legal records** without anyone doing anything obviously malicious. Everything else is maintainability. Start here.

### 3.1 Problem statement

There is no authorization layer below the route middleware. `app/Policies` does not exist. `app/Http/Requests/StoreEmployeeRequest.php::authorize()` returns `auth()->check()` — literally `true` for any logged-in user — so every FormRequest in the app authorizes the same way. Access control is therefore binary: either the route group lets you in and you may do anything inside it, or it does not.

That produces four distinct defects.

#### Defect 1A — The "first employee" identity fallback

`app/Http/Controllers/PortalController.php`:

```php
// line 33-38
$user = $request->user();
$employee = Employee::where('user_id', $user->id)->first();

// Admin-only fallback for convenience; employees/managers must be linked to their own record.
if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
    $employee = Employee::first();
}
```

```php
// line 109-113 (reportDiscrepancy)
$employee = $user->employee;
if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
    $employee = Employee::firstOrFail();
}
```

```php
// line 132-136 (requestLeave)
$employee = $user->employee;
if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
    $employee = Employee::first();
}
```

Consequences, all real:

- An unlinked HR admin visiting `/portal/profile` sees **an arbitrary employee's** salary history, leave balance, bank account, TIN, emergency contact, and discrepancy reports, rendered as "my profile".
- The same admin submitting the leave-request dialog creates a leave request **against `Employee::first()`**, with `user_id` set to the admin. The employee is then deducted leave they never requested, and the audit record names the admin as requester. Nobody will find this until the employee complains.
- The same admin submitting a discrepancy report files it against an arbitrary employee.

The comment says "for convenience." That is not a convenience — it is a data-integrity bug that is invisible in the UI because the page renders successfully.

#### Defect 1B — Client-supplied statutory leave days

```php
// PortalController.php:144
'requested_days' => ['required', 'numeric', 'min:0.5', 'max:120'],

// PortalController.php:164
'requested_days' => $validated['requested_days'],
```

`start_date` and `end_date` are validated for ordering only. The number written to the ledger is whatever the browser sent. A user can open devtools, or just manipulate a slider, and request 0.5 days for a 30-day absence. `LeaveBalanceController::reviewRequest()` then deducts `days_to_deduct ?? $leaveRequest->requested_days`, so the wrong number flows straight into the balance.

There is no server-side working-day calculation anywhere, even though `AnnualLeaveCalculationService` already owns the entitlement side of the same domain.

#### Defect 1C — Unvalidated correction values applied to payroll-critical columns

```php
// PortalController.php:277-291
$col = $fieldMapping[$report->field_name] ?? $report->field_name;
$allowedColumns = [
    'full_name', 'gender', 'birth_date_ec', 'marital_status',
    'phone', 'email', 'region', 'city', 'sub_city',
    'woreda', 'house_no', 'emergency_contact_name', 'emergency_contact_phone',
    'emergency_contact_relationship', 'tin_no', 'bank_name', 'bank_account_no',
    /* … */
];

if (in_array($col, $allowedColumns, true)) {
    $report->employee->update([$col => $report->proposed_value]);
}
```

`proposed_value` is validated only as `['required', 'string', 'max:255']` in `StoreDiscrepancyRequest`. The column map includes `bank_account_no` and `bank_name`. So the flow is:

1. Employee opens `/portal/profile`, submits a correction for "Commercial Bank Account" with `proposed_value = "1000999999999"`.
2. HR admin sees it in the pending list, thinks it looks plausible, approves.
3. `employees.bank_account_no` is overwritten with an unvalidated string. No format check, no checksum, no confirmation, no second approver.
4. Payroll exports read `bank_account_no` and pay into that account.

There is also a silent-failure mode: if `$report->field_name` is not in `$fieldMapping`, `$col` becomes the raw field name, which then fails the `$allowedColumns` check and **the approval succeeds with no write**. The UI says "Approved." Nothing changed. That is a different class of bug (approved-but-unapplied) that will generate support tickets forever.

#### Defect 1D — Leave deduction logic duplicated, untransacted, silently clamped

Two independent implementations mutate the same ledger:

```php
// LeaveBalanceController::reviewRequest()  lines 109-129
$balance = $leaveRequest->employee->leaveBalances()->firstOrCreate(
    ['leave_year' => $year],
    ['entitled_days' => $statutory, 'carried_over_days' => 0, 'taken_days' => 0, 'remaining_days' => $statutory]
);

$newTaken = $balance->taken_days + $daysDeducted;
$newRemaining = max(0, ($balance->entitled_days + $balance->carried_over_days) - $newTaken);

$balance->update(['taken_days' => $newTaken, 'remaining_days' => $newRemaining]);
```

```php
// LeaveBalanceController::adjust()  lines 190-207  — same code again
```

Problems:

- **No transaction.** The balance `update()` and the `LeaveRequest` `update()` are separate statements. If the second fails, the balance is deducted and the request stays Pending. On approval retry, it deducts again.
- **No lock.** Concurrent approvals read the same `taken_days`. Classic lost update.
- **`max(0, …)` swallows over-deduction.** Approving 30 days for someone with 10 remaining records `taken = 40`, `remaining = 0`, and reports success. HR has no signal that the employee is now overdrawn.
- **`adjust()` writes no audit log** while `reviewRequest()` writes two. The immutable audit trail has a hole exactly where manual balance edits happen.
- **`$year = (int) date('Y')`** in four places: PHP-server-timezone-dependent, and it means the Ethiopian fiscal year (Hamle 1 / July 8) and the Gregorian leave year are conflated. The leave year is a policy decision that is currently an accident of `date()`.

### 3.2 Target design

```
app/
├── Policies/
│   ├── EmployeePolicy.php
│   ├── LeaveRequestPolicy.php
│   ├── DataCorrectionReportPolicy.php
│   └── AnnouncementPolicy.php
├── Actions/
│   ├── Leave/
│   │   ├── SubmitLeaveRequestAction.php
│   │   ├── ApproveLeaveRequestAction.php
│   │   └── AdjustLeaveBalanceAction.php
│   └── Corrections/
│       ├── SubmitCorrectionAction.php
│       └── ApproveCorrectionAction.php
├── Support/
│   ├── StatutoryLeaveCalendar.php        // working-day math, single owner
│   └── CurrentLeaveYear.php              // one answer to "which year is it?"
└── Http/Requests/
    └── StoreLeaveRequestRequest.php      // replaces inline validate()
```

Three principles:

1. **Every model mutation goes through a Policy check in the controller** (`$this->authorize(...)`) *and* is expressed as an Action that owns its transaction.
2. **The server never trusts a number it can compute.** Days, pension, gross, entitlement, and retirement date are all derived server-side.
3. **"Unlinked account" is a first-class state**, not a fallback to someone else's record.

### 3.3 Implementation

#### Step 1.1 — Policies (do this first, it is additive and breaks nothing)

```bash
php artisan make:policy EmployeePolicy --model=Employee
php artisan make:policy LeaveRequestPolicy --model=LeaveRequest
php artisan make:policy DataCorrectionReportPolicy --model=DataCorrectionReport
```

Laravel 13 auto-discovers `App\Policies\{Model}Policy`, so no `AuthServiceProvider` registration is needed.

```php
<?php
// app/Policies/EmployeePolicy.php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    /**
     * SysAdmins manage the system; HRAdmins manage personnel data.
     * Managers may read the directory but never mutate it.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isManager();
    }

    public function view(User $user, Employee $employee): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isManager()) {
            return true; // directory read; sensitive fields are filtered in the Resource
        }

        return $employee->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->isSysAdmin() && $employee->id !== $user->employee?->id;
    }

    /**
     * Self-service fields an employee may change on their own record
     * without an HR approval flow.
     *
     * @return array<int, string>
     */
    public function updateSelfServiceFields(User $user, Employee $employee): bool
    {
        return $employee->user_id === $user->id;
    }
}
```

Add the three predicates to `User` once, so `in_array($user->role, [...], true)` stops being copy-pasted 14 times:

```php
<?php
// app/Models/User.php  — additions

public function isSysAdmin(): bool
{
    return $this->role === 'SysAdmin';
}

public function isHRAdmin(): bool
{
    return $this->role === 'HRAdmin';
}

public function isManager(): bool
{
    return $this->role === 'Manager';
}

public function isAdmin(): bool
{
    return $this->isSysAdmin() || $this->isHRAdmin();
}

public function employee(): HasOne
{
    return $this->hasOne(Employee::class);
}
```

> **Grep target after this step:** `in_array(\$user->role` should go from 14 occurrences to 0. Every occurrence is a place where the role list can drift from the route middleware.

#### Step 1.2 — Kill the fallback, make "unlinked" explicit

```php
<?php
// app/Http/Controllers/PortalController.php  — profile()

use App\Policies\EmployeePolicy;

public function profile(Request $request): Response
{
    $user = $request->user();

    $employee = $user->employee;   // relation, not a query

    // No fallback. An unlinked account gets an explicit, non-leaking page.
    if ($employee === null) {
        return Inertia::render('Portal/UnlinkedAccount', [
            'reason' => $user->isAdmin()
                ? 'admin_not_linked'
                : 'employee_not_linked',
            'supportEmail' => config('hrms.support_email'),
        ]);
    }

    $this->authorize('view', $employee);

    // … the rest of the eager-load + payload build
}
```

The new page is deliberately dumb. It renders one sentence and a "Contact HR" mailto. It must **not** render a sample profile, a name, or a file number.

Then, the same removal in the two write paths — but those become Actions (steps 1.4 / 1.5) rather than inline code.

**Guard test (write it before the change, watch it fail, then pass):**

```php
<?php
// tests/Feature/Portal/UnlinkedAccountTest.php

use App\Models\Employee;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('does not expose another employee profile to an unlinked admin', function () {
    $other = Employee::factory()->create(['full_name' => 'Someone Else', 'bank_account_no' => '123']);
    $admin = User::factory()->create(['role' => 'HRAdmin']);

    $this->actingAs($admin)
        ->get(route('portal.profile'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/UnlinkedAccount')
            ->missing('employee')
            ->where('reason', 'admin_not_linked')
        );
});

it('does not create a leave request against an arbitrary employee', function () {
    $other = Employee::factory()->create();
    $admin = User::factory()->create(['role' => 'HRAdmin']);

    $this->actingAs($admin)
        ->post(route('portal.leave.store'), [
            'leave_type' => 'Annual',
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-12',
            'start_date_ec' => '03/02/2019',
            'end_date_ec' => '05/02/2019',
            'requested_days' => 3,
            'reason' => 'Family matter',
        ])
        ->assertForbidden();

    expect(\App\Models\LeaveRequest::count())->toBe(0);
});
```

That second test is the important one. It fails today, which is the proof the bug is real.

#### Step 1.3 — Server-authoritative leave day computation

New single owner for working-day math:

```php
<?php
// app/Support/StatutoryLeaveCalendar.php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;

final class StatutoryLeaveCalendar
{
    /**
     * Ethiopian statutory weekly rest day is Sunday. Public holidays are
     * layered on top via config('hrms.public_holidays') until a Holiday model exists.
     *
     * @param  array<int, string>  $publicHolidays  ISO dates
     */
    public function workingDaysBetween(
        CarbonImmutable $start,
        CarbonImmutable $end,
        array $publicHolidays = [],
    ): float {
        if ($end->lessThan($start)) {
            return 0.0;
        }

        $days = 0;

        foreach (CarbonPeriod::create($start, $end) as $day) {
            if ($day->isSunday()) {
                continue;
            }

            if (in_array($day->toDateString(), $publicHolidays, true)) {
                continue;
            }

            $days++;
        }

        return (float) $days;
    }
}
```

```php
<?php
// app/Support/CurrentLeaveYear.php

namespace App\Support;

use App\Models\SystemSetting;

final class CurrentLeaveYear
{
    /**
     * The leave ledger year. Currently aligned to the Gregorian year, but
     * expressed in one place so switching to the Ethiopian fiscal year
     * (Hamle 1 / July 8) is a one-file change instead of a four-file change.
     */
    public static function get(): int
    {
        return (int) now()->year;
    }
}
```

Replace the four `(int) date('Y')` call sites with `CurrentLeaveYear::get()`.

Then the FormRequest computes the days and the controller never accepts a client number:

```php
<?php
// app/Http/Requests/StoreLeaveRequestRequest.php

namespace App\Http\Requests;

use App\Support\StatutoryLeaveCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->employee !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'leave_type' => ['required', 'string', 'in:Annual,Sick,Mourning,Marriage,Paternity,Maternity,Compassionate,Unpaid'],
            'start_date' => ['required', 'date', 'before_or_equal:end_date'],
            'end_date' => ['required', 'date'],
            'start_date_ec' => ['required', 'string', 'max:30'],
            'end_date_ec' => ['required', 'string', 'max:30'],
            'reason' => ['required', 'string', 'max:1000'],
            'handover_employee_id' => ['nullable', 'exists:employees,id'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
        ];
        // NOTE: requested_days is deliberately absent. It is computed, not accepted.
    }

    /**
     * The authoritative day count. Any client-supplied value is ignored.
     */
    public function workingDays(): float
    {
        $calendar = app(StatutoryLeaveCalendar::class);

        return $calendar->workingDaysBetween(
            CarbonImmutable::parse($this->string('start_date')->toString())->startOfDay(),
            CarbonImmutable::parse($this->string('end_date')->toString())->startOfDay(),
            (array) config('hrms.public_holidays', []),
        );
    }
}
```

Add a guard that rejects nonsense ranges:

```php
public function after(): array
{
    return [
        function ($validator) {
            if ($this->workingDays() <= 0) {
                $validator->errors()->add('start_date', 'The selected range contains no working days.');
            }
            if ($this->workingDays() > 120) {
                $validator->errors()->add('end_date', 'A single leave request may not exceed 120 working days.');
            }
        },
    ];
}
```

#### Step 1.4 — One transactional leave approval

```php
<?php
// app/Actions/Leave/ApproveLeaveRequestAction.php

namespace App\Actions\Leave;

use App\Models\LeaveRequest;
use App\Models\User;
use App\Support\CurrentLeaveYear;
use Illuminate\Support\Facades\DB;

final class ApproveLeaveRequestAction
{
    public function __construct(
        private readonly RecordAuditLogAction $audit,
    ) {}

    /**
     * @throws \DomainException when the balance is insufficient
     */
    public function execute(
        LeaveRequest $request,
        User $reviewer,
        bool $deductBalance,
        ?float $daysToDeduct,
        ?string $notes,
    ): LeaveRequest {
        return DB::transaction(function () use ($request, $reviewer, $deductBalance, $daysToDeduct, $notes) {
            /** @var LeaveRequest $locked */
            $locked = LeaveRequest::whereKey($request->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'Pending') {
                throw new \DomainException('Only pending requests can be approved.');
            }

            $days = $deductBalance
                ? ($daysToDeduct ?? (float) $locked->requested_days)
                : 0.0;

            if ($deductBalance && $days > 0) {
                $balance = $locked->employee->leaveBalances()
                    ->where('leave_year', CurrentLeaveYear::get())
                    ->lockForUpdate()
                    ->first();

                if ($balance === null) {
                    throw new \DomainException('No leave balance row exists for this employee and year.');
                }

                $available = (float) $balance->entitled_days
                    + (float) $balance->carried_over_days
                    - (float) $balance->taken_days;

                if ($days > $available) {
                    // Explicit failure, not max(0, …). Overdraft is a decision, not an accident.
                    throw new \DomainException(sprintf(
                        'Insufficient balance: %.1f days requested, %.1f available.',
                        $days,
                        $available,
                    ));
                }

                $balance->update([
                    'taken_days' => (float) $balance->taken_days + $days,
                    'remaining_days' => $available - $days,
                ]);
            }

            $locked->update([
                'status' => 'Approved',
                'is_deducted' => $deductBalance,
                'days_deducted' => $days,
                'reviewed_by' => $reviewer->getKey(),
                'reviewed_at' => now(),
                'reviewer_notes' => $notes,
            ]);

            $this->audit->execute(
                actor: $reviewer,
                action: 'LEAVE_REQUEST_APPROVED',
                subject: $locked,
                oldValues: ['status' => 'Pending'],
                newValues: ['status' => 'Approved', 'days_deducted' => $days],
            );

            return $locked->refresh();
        });
    }
}
```

Three things to notice:

- `lockForUpdate()` on both the request and the balance row. On MySQL this is a real `SELECT … FOR UPDATE`; on SQLite it is a no-op but the enclosing transaction still serialises writers. Production is MySQL, so the lock matters.
- Overdraft **throws**. The controller catches `\DomainException` and returns `back()->withErrors(...)`. HR sees "insufficient balance" instead of a silent zero.
- `days_deducted` is recorded even when the request was computed server-side, so the ledger and the request agree by construction.

#### Step 1.5 — Correction approval that validates the value

```php
<?php
// app/Actions/Corrections/ApproveCorrectionAction.php

namespace App\Actions\Corrections;

use App\Models\DataCorrectionReport;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final class ApproveCorrectionAction
{
    /**
     * Field name => [column, validation rules, requires_second_approver].
     *
     * Payroll-critical columns are flagged so that a single HR click can never
     * redirect a salary payment.
     *
     * @var array<string, array{0: string, 1: array<int, string>, 2: bool}>
     */
    private const FIELD_MAP = [
        'Full Name' => ['full_name', ['required', 'string', 'max:255'], false],
        'Gender' => ['gender', ['required', 'in:Male,Female'], false],
        'DOB (E.C)' => ['birth_date_ec', ['required', 'date_format:Y-m-d'], false],
        'Marital Status' => ['marital_status', ['nullable', 'string', 'max:30'], false],
        'Phone Number' => ['phone', ['nullable', 'string', 'regex:/^(\+?251|0)?9\d{8}$/'], false],
        'Email Address' => ['email', ['nullable', 'email', 'max:100'], false],
        'Region' => ['region', ['nullable', 'string', 'max:100'], false],
        'City' => ['city', ['nullable', 'string', 'max:100'], false],
        'Sub-City' => ['sub_city', ['nullable', 'string', 'max:100'], false],
        'Woreda' => ['woreda', ['nullable', 'string', 'max:50'], false],
        'House No' => ['house_no', ['nullable', 'string', 'max:50'], false],
        'Emergency Contact Name' => ['emergency_contact_name', ['nullable', 'string', 'max:150'], false],
        'Emergency Contact Phone' => ['emergency_contact_phone', ['nullable', 'string', 'max:50'], false],
        'Emergency Contact Relationship' => ['emergency_contact_relationship', ['nullable', 'string', 'max:50'], false],
        'Tax ID (TIN)' => ['tin_no', ['nullable', 'string', 'max:30'], false],
        'Education Attainment Level' => ['education_status', ['nullable', 'string', 'max:150'], false],
        'Institution / University' => ['institution', ['nullable', 'string', 'max:150'], false],
        'Graduation Year (E.C.)' => ['graduation_year_ec', ['nullable', 'digits:4'], false],
        'Professional License' => ['professional_license', ['nullable', 'string', 'max:100'], false],
        'Cost Sharing Obligation Status' => ['cost_sharing_status', ['nullable', 'string', 'max:50'], false],
        'Position Title' => ['position', ['required', 'string', 'max:150'], true],
        'Workplace / Deployment Site' => ['work_place', ['required', 'string', 'max:100'], false],
        'Vehicle Plate Number' => ['plate_number', ['nullable', 'string', 'max:30'], false],
        'POESSA Pension No' => ['poessa_no', ['nullable', 'string', 'max:50'], true],
        'PSSSA Pension No' => ['psssa_no', ['nullable', 'string', 'max:50'], true],
        'Social Security Scheme No' => ['social_security_no', ['nullable', 'string', 'max:50'], true],
        // Payroll-critical: bank destination changes need two people.
        'Commercial Bank Name' => ['bank_name', ['required', 'string', 'max:100'], true],
        'Commercial Bank Account' => ['bank_account_no', ['required', 'string', 'regex:/^\d{10,20}$/'], true],
    ];

    public function execute(DataCorrectionReport $report, User $reviewer, string $decision, ?string $notes): DataCorrectionReport
    {
        return DB::transaction(function () use ($report, $reviewer, $decision, $notes) {
            $locked = DataCorrectionReport::whereKey($report->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'Pending') {
                throw new \DomainException('This report has already been reviewed.');
            }

            if ($decision === 'Rejected') {
                $locked->update([
                    'status' => 'Rejected',
                    'reviewed_by' => $reviewer->getKey(),
                    'reviewed_at' => now(),
                    'reviewer_notes' => $notes,
                ]);

                return $locked->refresh();
            }

            $mapping = self::FIELD_MAP[$locked->field_name] ?? null;

            if ($mapping === null) {
                throw new \DomainException("Unknown correction field: {$locked->field_name}");
            }

            [$column, $rules, $needsSecondApprover] = $mapping;

            $validated = Validator::make(
                [$column => $locked->proposed_value],
                [$column => $rules],
            )->validate();

            if ($needsSecondApprover && $locked->reviewed_by !== null && $locked->reviewed_by === $reviewer->getKey()) {
                throw new \DomainException('This field requires a second, different approver.');
            }

            $locked->employee->update([$column => $validated[$column]]);

            $locked->update([
                'status' => 'Approved',
                'reviewed_by' => $reviewer->getKey(),
                'reviewed_at' => now(),
                'reviewer_notes' => $notes,
                'applied_column' => $column,
                'applied_at' => now(),
            ]);

            return $locked->refresh();
        });
    }
}
```

Requires two new columns:

```php
<?php
// database/migrations/2026_11_12_000001_add_application_tracking_to_data_correction_reports.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_correction_reports', function (Blueprint $table) {
            $table->string('applied_column', 64)->nullable()->after('reviewer_notes');
            $table->timestamp('applied_at')->nullable()->after('applied_column');
        });
    }

    public function down(): void
    {
        Schema::table('data_correction_reports', function (Blueprint $table) {
            $table->dropColumn(['applied_column', 'applied_at']);
        });
    }
};
```

`applied_column` + `applied_at` solve defect 1C's silent-failure mode: "Approved" now means a write actually happened, and the audit trail names which column.

### 3.4 Controller after the change

```php
public function reviewDiscrepancy(
    Request $request,
    DataCorrectionReport $report,
    ApproveCorrectionAction $action,
): RedirectResponse {
    $this->authorize('review', $report);

    $validated = $request->validate([
        'status' => ['required', 'in:Approved,Rejected'],
        'reviewer_notes' => ['nullable', 'string', 'max:1000'],
    ]);

    try {
        $action->execute(
            report: $report,
            reviewer: $request->user(),
            decision: $validated['status'],
            notes: $validated['reviewer_notes'] ?? null,
        );
    } catch (\DomainException $e) {
        return back()->withErrors(['status' => $e->getMessage()]);
    }

    return back()->with('success', "Discrepancy report {$validated['status']}.");
}
```

### 3.5 Acceptance criteria

| Check | Before | After |
|---|---|---|
| Unlinked admin sees `Portal/UnlinkedAccount` | ❌ shows random employee | ✅ |
| `LeaveRequest` count after unlinked-admin submit | 1 (wrong employee) | 0 |
| `requested_days` accepted from client | yes | no (ignored) |
| Approving 30 days with 10 available | succeeds, logs 40 taken | 422, no write |
| Two concurrent approvals of the same request | double deduction | one succeeds, one 422 |
| Approving `bank_account_no` change | unvalidated write | regex-validated, 2nd approver required |
| Approving unknown field | "Approved", no write | 422 "Unknown correction field" |
| Audit row for manual `adjust()` | none | present |
| `in_array($user->role` occurrences | 14 | 0 |

### 3.6 Risk and sequencing

- **Low risk, do first:** Policies + `User` predicates + unlinked-account page. Purely additive, no behavior change for linked users.
- **Medium risk:** leave day computation. Ship behind a feature flag or a `config('hrms.leave.server_side_days')` boolean for one release, so you can compare computed vs submitted values in logs before enforcing.
- **Medium risk:** correction approval. New migration + stricter validation. Existing Pending reports with unknown field names need a one-off audit query before you ship the throw:

```sql
SELECT field_name, COUNT(*)
FROM data_correction_reports
WHERE status = 'Pending'
  AND field_name NOT IN ('Full Name', 'Gender', /* … the full FIELD_MAP list … */)
GROUP BY field_name;
```

If that returns rows, add those fields to `FIELD_MAP` *before* deploying, or the approvals will start failing.

**Estimated effort:** 3–4 days, of which ~1 day is tests.

---

## 4. Improvement Area 2 — Collapse the four-copy employee write path into one Action

**Severity: High.** This is the root cause of most divergence bugs in the codebase. Fix it and a whole class of "the import created a different salary than the form" defects disappears.

### 4.1 Problem statement

Creating an employee is a **six-step invariant**:

1. create the `employees` row,
2. compute the gross from 9 allowance fields,
3. compute statutory pension (7% / 11% of basic),
4. create the `employee_salaries` row with `is_current = true`,
5. create the `leave_balances` row for the current year,
6. write an `AuditLog`.

That invariant is implemented **four times**, and the copies disagree.

| Site | File / lines | Steps implemented |
|---|---|---|
| **A** | `EmployeeController::store()` `EmployeeController.php:38-104` | 1, 2, 3, 4, 5 + **no audit log** |
| **B** | `ExcelImportExportController::execute()` `ExcelImportExportController.php:217-289` | 1, 3, 4, 5 + audit, **no allowance fields at all** (`total_salary` = basic only) |
| **C** | `ImportTerminatedEmployeesCommand.php:209` | 1, 3 (reads a literal `11% Pension Contribution` column if present, otherwise computes), 4 |
| **D** | `ImportExcelMasterListCommand::processModernSheet()` `:182-470` | 1–5 with full fidelity, plus separations |

Concrete divergences that a user can observe today:

- An employee created through **the form** gets `total_salary = basic + 9 allowances`. The same person created through **Excel import** gets `total_salary = basic`. Their dashboard payroll contribution differs by the allowance total.
- An employee created through **the form** gets an audit log **only for updates** (`EmployeeController::update()` line 136), not for creation. So the first write to a new personnel record is the one write that is not audited.
- `ImportTerminatedEmployeesCommand` trusts a spreadsheet column named `11% Pension Contribution` when present (line 156: `$row['11% Pension Contribution'] ?? ($basicSalary * 0.11)`). A typo in the sheet silently changes the recorded employer liability.
- `EmployeeController::store()` is also **not inside a transaction**. If step 4 fails (e.g. `effective_date` is null), 1 and 5 are already committed and the employee exists with **no salary row**. `Employee::currentSalary` then returns `null`, and `EmployeeListResource`-style consumers render `0.00 ETB` — a silent payroll gap.

The validation layer has the same shape:

```
StoreEmployeeRequest.php   74 lines of rules
UpdateEmployeeRequest.php  73 lines of rules
```

Diffing them shows they differ in exactly one rule (`file_no` has `unique:employees,file_no` on store, and on update it must exclude the current id). That is a 73-line copy held in sync by hope.

The frontend mirrors this: **39 of the 45 form fields in `Create.tsx` also exist in `Edit.tsx`** (87%), but the *validation* exists nowhere on the client. `zod`, `react-hook-form`, and `@hookform/resolvers` are installed but only referenced by `Components/ui/form.tsx`, which itself has **0 importers**. So the app ships a validation stack it never uses, and relies entirely on server-side validation surfaced through Inertia's `errors` prop.

### 4.2 Target design — and what *not* to build

**Do not build an `EmployeeService`.** That is the standard Laravel anti-pattern that turns a 263-line controller into a 900-line service and moves the problem. The goal is not "fewer classes"; it is **one reason to change per class**:

```
app/
├── Actions/Employees/
│   ├── RegisterEmployeeAction.php      // the 6-step invariant, transactional
│   ├── UpdateEmployeeAction.php        // update + recompute derived dates + audit
│   └── ChangeEmployeeSalaryAction.php  // supersede current salary, create new
├── Support/Statutory/
│   ├── PayrollCalculator.php           // gross, pension, given basic + allowances
│   └── StatutoryRates.php              // the single place 7/11/16/60 come from
├── Actions/Audit/
│   └── RecordAuditLogAction.php        // replaces 14 copy-pasted AuditLog::create blocks
└── Http/Requests/Concerns/
    ├── EmployeeRules.php               // rules() shared by store + update
    └── CompensationRules.php
```

`PayrollCalculator` is the only class that knows the shape of compensation. It returns a **value object**, not an array, so `total_salary` and `pension_*` cannot drift apart:

```php
<?php
// app/Support/Statutory/PayrollBreakdown.php

namespace App\Support\Statutory;

final readonly class PayrollBreakdown
{
    /**
     * @param  array<string, float>  $allowances
     */
    public function __construct(
        public float $basic,
        public array $allowances,
        public float $gross,
        public float $pensionEmployee,
        public float $pensionEmployer,
    ) {}

    /**
     * The exact attribute set for an employee_salaries row.
     *
     * @return array<string, mixed>
     */
    public function toSalaryAttributes(string $effectiveDate, bool $isCurrent = true): array
    {
        return [
            'basic_salary' => $this->basic,
            ...$this->allowances,
            'total_salary' => $this->gross,
            'pension_employee' => $this->pensionEmployee,
            'pension_company' => $this->pensionEmployer,
            'effective_date' => $effectiveDate,
            'is_current' => $isCurrent,
        ];
    }
}
```

```php
<?php
// app/Support/Statutory/PayrollCalculator.php

namespace App\Support\Statutory;

final class PayrollCalculator
{
    /** @var array<int, string> */
    public const ALLOWANCE_FIELDS = [
        'responsibility_allowance',
        'project_allowance',
        'position_allowance',
        'hardship_allowance',
        'transport_allowance',
        'house_allowance',
        'mobile_allowance',
        'food_allowance',
        'daily_allowance',
        'desert_allowance',
        'fuel_allowance_amount',
        'perdiem',
        'monthly_perdiem',
    ];

    public function __construct(private readonly StatutoryRates $rates) {}

    /**
     * @param  array<string, mixed>  $input
     */
    public function fromInput(array $input): PayrollBreakdown
    {
        $basic = round((float) ($input['basic_salary'] ?? 0), 2);

        $allowances = [];
        foreach (self::ALLOWANCE_FIELDS as $field) {
            $allowances[$field] = round((float) ($input[$field] ?? 0), 2);
        }

        $gross = round($basic + array_sum($allowances), 2);

        return new PayrollBreakdown(
            basic: $basic,
            allowances: $allowances,
            gross: $gross,
            pensionEmployee: round($basic * $this->rates->pensionEmployeeFactor(), 2),
            pensionEmployer: round($basic * $this->rates->pensionEmployerFactor(), 2),
        );
    }
}
```

Note this already fixes the B-site bug: import passes only `basic_salary`, every allowance defaults to `0.00`, and `toSalaryAttributes()` still writes all of them explicitly, so the salary row is structurally identical regardless of entry point.

### 4.3 Implementation

#### Step 2.1 — Extract the shared rules

```php
<?php
// app/Http/Requests/Concerns/EmployeeRules.php

namespace App\Http\Requests\Concerns;

use App\Support\Statutory\PayrollCalculator;
use Illuminate\Validation\Rule;

trait EmployeeRules
{
    /**
     * @return array<string, mixed>
     */
    protected function employeeRules(?int $ignoreEmployeeId = null): array
    {
        return [
            // Identity
            'file_no' => [
                'required', 'string', 'max:20',
                Rule::unique('employees', 'file_no')->ignore($ignoreEmployeeId),
            ],
            'employee_id_no' => [
                'nullable', 'string', 'max:50',
                Rule::unique('employees', 'employee_id_no')->ignore($ignoreEmployeeId),
            ],
            'full_name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:Male,Female'],
            'education_status' => ['nullable', 'string', 'max:150'],
            'marital_status' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],

            // Address
            'region' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'sub_city' => ['nullable', 'string', 'max:100'],
            'woreda' => ['nullable', 'string', 'max:50'],
            'house_no' => ['nullable', 'string', 'max:50'],

            // Emergency contact
            'emergency_contact_name' => ['nullable', 'string', 'max:150'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],

            // Organisation
            'department_id' => ['required', 'exists:departments,id'],
            'position' => ['required', 'string', 'max:150'],
            'work_place' => ['required', 'string', 'max:100'],
            'employment_type' => ['required', 'in:Non-Managerial,Managerial'],
            'contract_type' => ['required', 'in:Permanent,Contract,Daily'],
            'status' => ['required', 'in:Probation,Permanent,Contract'],
            'grade' => ['nullable', 'string', 'max:20'],
            'step' => ['nullable', 'string', 'max:20'],

            // Dates
            'employment_date' => ['required', 'date'],
            'employment_date_ec' => ['required', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'birth_date_ec' => ['nullable', 'string', 'max:20'],
            'contract_end_date' => [
                'nullable', 'date',
                Rule::requiredIf(fn () => $this->input('contract_type') === 'Contract'),
                'after:employment_date',
            ],

            // Banking / statutory identifiers
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_no' => ['nullable', 'string', 'max:50'],
            'tin_no' => ['nullable', 'string', 'max:30'],
            'social_security_no' => ['nullable', 'string', 'max:50'],
            'poessa_no' => ['nullable', 'string', 'max:50'],
            'psssa_no' => ['nullable', 'string', 'max:50'],
            'plate_number' => ['nullable', 'string', 'max:30'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function compensationRules(): array
    {
        $rules = ['basic_salary' => ['required', 'numeric', 'min:0', 'max:10000000']];

        foreach (PayrollCalculator::ALLOWANCE_FIELDS as $field) {
            $rules[$field] = ['nullable', 'numeric', 'min:0', 'max:10000000'];
        }

        return $rules;
    }
}
```

```php
<?php
// app/Http/Requests/StoreEmployeeRequest.php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\EmployeeRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    use EmployeeRules;

    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Employee::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        // Empty strings from optional inputs become null, so nullable rules apply
        // consistently instead of storing '' in the database.
        $this->merge(collect($this->all())
            ->map(fn ($value) => $value === '' ? null : $value)
            ->all());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->employeeRules(),
            ...$this->compensationRules(),
        ];
    }
}
```

```php
<?php
// app/Http/Requests/UpdateEmployeeRequest.php

class UpdateEmployeeRequest extends FormRequest
{
    use EmployeeRules;

    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('employee')) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->employeeRules($this->route('employee')?->getKey()),
            // Compensation is NOT editable here. It moves through
            // ChangeEmployeeSalaryAction so every change is versioned.
        ];
    }
}
```

Two deliberate decisions:

- **`authorize()` now asks the Policy**, so the FormRequest and the route middleware agree by construction.
- **`update` no longer accepts `basic_salary`/allowances.** Today `UpdateEmployeeRequest` (73 lines) does not include them either, so nothing regresses; but `EmployeeController::update()` calls `$employee->update($data)` with `validated()` data, and `basic_salary` is in `$fillable`? — no, it is not (`Employee::$fillable` has no salary columns). So salary silently cannot be updated via that path, which means *the Edit page must be calling a separate endpoint*. It is: `POST /employees/{employee}/salaries` → `EmployeeSalaryController::store()`. Good — that endpoint becomes `ChangeEmployeeSalaryAction`.

#### Step 2.2 — The registration Action

```php
<?php
// app/Actions/Employees/RegisterEmployeeAction.php

namespace App\Actions\Employees;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Employee;
use App\Models\User;
use App\Services\ProbationCalculationService;
use App\Services\RetirementCalculationService;
use App\Support\CurrentLeaveYear;
use App\Support\Statutory\PayrollCalculator;
use App\Support\Statutory\StatutoryRates;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class RegisterEmployeeAction
{
    public function __construct(
        private readonly PayrollCalculator $payroll,
        private readonly StatutoryRates $rates,
        private readonly ProbationCalculationService $probation,
        private readonly RetirementCalculationService $retirement,
        private readonly RecordAuditLogAction $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $data  validated StoreEmployeeRequest input
     */
    public function execute(array $data, User $actor): Employee
    {
        return DB::transaction(function () use ($data, $actor) {
            $employeeAttributes = $this->deriveEmployeeAttributes($data);

            /** @var Employee $employee */
            $employee = Employee::create($employeeAttributes);

            $breakdown = $this->payroll->fromInput($data);

            $employee->salaries()->create(
                $breakdown->toSalaryAttributes(
                    effectiveDate: $employeeAttributes['employment_date'],
                ),
            );

            $entitlement = $this->rates->annualLeaveBaseDays();

            $employee->leaveBalances()->create([
                'leave_year' => CurrentLeaveYear::get(),
                'entitled_days' => $entitlement,
                'carried_over_days' => 0.0,
                'taken_days' => 0.0,
                'remaining_days' => $entitlement,
            ]);

            $this->audit->execute(
                actor: $actor,
                action: 'EMPLOYEE_CREATE',
                subject: $employee,
                oldValues: null,
                newValues: $employee->fresh()?->toArray(),
            );

            return $employee->refresh();
        });
    }

    /**
     * Date/status derivation that used to live inline in the controller.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function deriveEmployeeAttributes(array $data): array
    {
        $employeeColumns = array_diff_key($data, $this->payrollColumns());

        if (($data['status'] ?? null) === 'Probation') {
            $employeeColumns['probation_end_date'] = $this->probation
                ->computeTargetEndDate(
                    CarbonImmutable::parse($data['employment_date']),
                    $data['employment_type'],
                )
                ->toDateString();

            $employeeColumns['probation_status'] = 'Pending';
        }

        if (! empty($data['birth_date'])) {
            $employeeColumns['retirement_date'] = $this->retirement
                ->calculateRetirementDate(CarbonImmutable::parse($data['birth_date']))
                ->toDateString();
        }

        return $employeeColumns;
    }

    /**
     * Columns that belong on employee_salaries, not employees.
     *
     * @return array<string, true>
     */
    private function payrollColumns(): array
    {
        return ['basic_salary' => true]
            + array_fill_keys(PayrollCalculator::ALLOWANCE_FIELDS, true);
    }
}
```

The `array_diff_key` is the important line. Previously `Employee::create($data)` received the allowance keys, and **they were silently discarded** by Eloquent's mass-assignment guard because they are not in `$fillable`. That silent discard is exactly the kind of thing `Model::preventSilentlyDiscardingAttributes()` exists to expose — see Area 6.

#### Step 2.3 — The update Action

```php
<?php
// app/Actions/Employees/UpdateEmployeeAction.php

namespace App\Actions\Employees;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Employee;
use App\Models\User;
use App\Services\RetirementCalculationService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class UpdateEmployeeAction
{
    public function __construct(
        private readonly RetirementCalculationService $retirement,
        private readonly RecordAuditLogAction $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(Employee $employee, array $data, User $actor): Employee
    {
        return DB::transaction(function () use ($employee, $data, $actor) {
            $before = $employee->getOriginal();

            $birthDateChanged = array_key_exists('birth_date', $data)
                && (string) $data['birth_date'] !== (string) $employee->getRawOriginal('birth_date');

            if ($birthDateChanged) {
                $data['retirement_date'] = empty($data['birth_date'])
                    ? null
                    : $this->retirement
                        ->calculateRetirementDate(CarbonImmutable::parse($data['birth_date']))
                        ->toDateString();
            }

            $employee->update($data);

            $changes = $employee->getChanges();
            unset($changes['updated_at']);

            if ($changes !== []) {
                $this->audit->execute(
                    actor: $actor,
                    action: 'EMPLOYEE_UPDATE',
                    subject: $employee,
                    oldValues: array_intersect_key($before, $changes),
                    newValues: $changes,
                );
            }

            return $employee;
        });
    }
}
```

Difference from today: the audit row records **only the changed columns**, not `$employee->toArray()` of the entire 57-column row. Today `EmployeeController::update()` writes `old_values` = all 57 columns and `new_values` = all 57 columns for every single update. That is both an audit-log bloat problem and a privacy problem (the full row, including bank account, is duplicated on every field tweak).

#### Step 2.4 — One audit helper for all 14 sites

```php
<?php
// app/Actions/Audit/RecordAuditLogAction.php

namespace App\Actions\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

final class RecordAuditLogAction
{
    /**
     * @param  array<string, mixed>|null  $oldValues
     * @param  array<string, mixed>|null  $newValues
     */
    public function execute(
        User $actor,
        string $action,
        Model $subject,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $actor->getKey(),
            'action' => $action,
            'auditable_type' => $subject::class,
            'auditable_id' => $subject->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
```

> **Why an Action and not a model observer?** Observers fire on *every* `save()`, including seeders, imports, and test fixtures, which would flood the audit table and make `AuditLogTest` non-deterministic. Explicit invocation keeps "who did this" meaningful: it requires a `User`.

#### Step 2.5 — Point every entry point at the Action

```php
// EmployeeController::store()
public function store(StoreEmployeeRequest $request, RegisterEmployeeAction $action): RedirectResponse
{
    $employee = $action->execute($request->validated(), $request->user());

    return redirect()
        ->route('employees.show', $employee)
        ->with('success', "Personnel profile {$employee->full_name} ({$employee->file_no}) successfully registered.");
}
```

```php
// ExcelImportExportController::execute()  — replaces the whole 73-line loop body
public function execute(Request $request, RegisterEmployeeAction $register, UpdateEmployeeAction $update): RedirectResponse
{
    $validated = $request->validate([
        'records' => ['required', 'array', 'min:1'],
        'records.*.file_no' => ['required', 'string', 'max:20'],
        'records.*.full_name' => ['required', 'string', 'max:255'],
        'records.*.department_id' => ['required', 'exists:departments,id'],
        'records.*.position' => ['required', 'string', 'max:150'],
        'records.*.work_place' => ['required', 'in:Project,Head Office'],
        'records.*.gender' => ['required', 'in:Male,Female'],
        'records.*.basic_salary' => ['required', 'numeric', 'min:0'],
    ]);

    $actor = $request->user();
    $created = 0;
    $updated = 0;

    // Chunk so a 5,000-row sheet does not hold a single giant transaction
    // and so a slow row does not lock the whole table on MySQL.
    foreach (array_chunk($validated['records'], 100) as $chunk) {
        DB::transaction(function () use ($chunk, $actor, $register, $update, &$created, &$updated) {
            foreach ($chunk as $row) {
                $existing = Employee::where('file_no', $row['file_no'])->first();

                if ($existing !== null) {
                    $update->execute($existing, collect($row)->except('basic_salary')->all(), $actor);
                    $updated++;

                    continue;
                }

                $register->execute($row, $actor);
                $created++;
            }
        });
    }

    return redirect()->route('employees.index')->with(
        'success',
        "Reconciliation complete: {$created} new employees registered, {$updated} profiles updated.",
    );
}
```

#### Step 2.6 — Delete the one-off data migrations from `app/Console/Commands`

`ImportExcelMasterListCommand` (515), `ImportTerminatedEmployeesCommand` (395), `InsertTikemetEmployeesCommand` (271), and `ImportAnnualLeaveCommand` (106) total **1,287 lines** of code whose purpose was to load a spreadsheet once, in 2026, during a data migration.

They are not maintenance-free. They:

- reference column names that exist only in one historical workbook (`'11% Pension Contribution'`),
- bypass every Action introduced above,
- and are the only place in the codebase that knows certain legacy workbook layouts.

**Do not delete them blind.** Move them to `database/legacy-import/` (or a separate `hrms-legacy` package) with a README stating the workbook hash they were validated against, and remove them from the Artisan registry so they stop appearing in `php artisan list` and stop being mistaken for supported features. If any of them is genuinely still used operationally, promote it to a real feature with a Job and a UI — do not leave a 515-line command as the operational interface.

### 4.4 Acceptance criteria

| Check | Before | After |
|---|---|---|
| `Employee::create` / `->create(` call sites in `app/` | 3 | 1 |
| `round($basic * 0.07` occurrences | 6 | 0 |
| `'entitled_days' => 16.0` occurrences | 3 | 0 |
| `AuditLog::create` occurrences | 14 | 1 |
| `StoreEmployeeRequest` / `UpdateEmployeeRequest` duplicate rule lines | ~73 | 0 |
| Employee creation audited | no | yes |
| Employee creation atomic | no | yes |
| Import-created employee has populated allowance columns | no | yes |
| `php artisan test` | 137 green | ≥ 145 green |

**Strongly recommended guard test** (this is the one that catches future regressions):

```php
<?php
// tests/Feature/Employee/WritePathParityTest.php

it('produces an identical salary row whether created via form or import', function () {
    $admin = User::factory()->create(['role' => 'HRAdmin']);
    $dept = Department::factory()->create();

    $payload = [
        'full_name' => 'Parity Check',
        'gender' => 'Male',
        'department_id' => $dept->id,
        'position' => 'Surveyor',
        'work_place' => 'Project',
        'employment_type' => 'Non-Managerial',
        'contract_type' => 'Permanent',
        'status' => 'Permanent',
        'employment_date' => '2026-01-05',
        'employment_date_ec' => '2018-04-27',
        'basic_salary' => 10000,
        'house_allowance' => 2000,
    ];

    $viaForm = app(RegisterEmployeeAction::class)->execute(
        [...$payload, 'file_no' => 'PAR-001'],
        $admin,
    );

    $viaImport = app(RegisterEmployeeAction::class)->execute(
        [...$payload, 'file_no' => 'PAR-002'],
        $admin,
    );

    expect($viaForm->currentSalary->total_salary)
        ->toBe($viaImport->currentSalary->total_salary)
        ->and((float) $viaForm->currentSalary->total_salary)->toBe(12000.0);
});
```

**Estimated effort:** 4–5 days. Highest ROI in the entire document, because every subsequent area depends on there being one write path.

---

## 5. Improvement Area 3 — Make statutory configuration the actual source of truth

**Severity: High (silent correctness).** A settings screen that saves values nothing reads is worse than no settings screen: it creates false confidence.

### 5.1 Problem statement

The `system_settings` table contains 15 keys. Four of them govern payroll/leave/retirement math:

| Key | Stored value | Read by computation code? |
|---|---|---|
| `pension_employee_rate` | `7.0` | **No** — 6 sites hardcode `0.07` |
| `pension_employer_rate` | `11.0` | **No** — 6 sites hardcode `0.11` |
| `annual_leave_base_days` | `16` | **No** — 4 sites hardcode `16` / `16.0` |
| `statutory_retirement_age` | `60` | **No** — `RetirementCalculationService::STATUTORY_RETIREMENT_AGE = 60` |

Measured hardcode sites:

```
app/Console/Commands/ImportExcelMasterListCommand.php:379-380       0.07 / 0.11
app/Console/Commands/ImportTerminatedEmployeesCommand.php:156,230    0.11 / 0.07
app/Console/Commands/InsertTikemetEmployeesCommand.php:268-269       0.07 / 0.11
app/Http/Controllers/EmployeeController.php:73-74                    0.07 / 0.11
app/Http/Controllers/EmployeeSalaryController.php:31-32              0.07 / 0.11
app/Http/Controllers/ExcelImportExportController.php:261-262         0.07 / 0.11
app/Services/AnnualLeaveCalculationService.php:21,27                 16.0
app/Http/Controllers/EmployeeController.php:96-99                    16.0
app/Http/Controllers/ExcelImportExportController.php:269-272         16.0
app/Http/Controllers/PortalController.php:82,135-136                 16
```

And the frontend repeats the same constants for live preview:

```
resources/js/Pages/Employees/Create.tsx:241-242   Math.round(basic * 0.07 * 100) / 100
resources/js/Pages/Employees/Create.tsx:1051      "Subject to 7% … 11% … per Proclamation 1268/2022"
```

So a rate change requires edits in **10 PHP locations plus 2 TSX locations**, and there is no mechanism that will tell you if you missed one. If the proclamation is amended and only the Settings screen is updated, payroll silently keeps the old rate while the UI claims the new one.

There is a second, subtler problem: `SystemSetting::get()` runs a query on **every call** with no caching:

```php
public static function get(string $key, mixed $default = null): mixed
{
    $setting = static::where('key', $key)->first();   // ← query per call
    ...
}
```

Today it is called in 6 places so nobody notices. Once `StatutoryRates` uses it per payroll row in an import of 5,000 rows, it becomes 5,000 queries.

### 5.2 Target design

```php
<?php
// app/Support/Statutory/StatutoryRates.php

namespace App\Support\Statutory;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

/**
 * The single source of truth for every statutory constant the system computes with.
 *
 * Values come from system_settings (admin-editable) and fall back to the
 * statutorily-correct default if the row is missing.
 */
final class StatutoryRates
{
    private const CACHE_KEY = 'statutory.rates';
    private const CACHE_TTL_SECONDS = 3600;

    /**
     * @return array{
     *   pension_employee_rate: float,
     *   pension_employer_rate: float,
     *   annual_leave_base_days: float,
     *   annual_leave_step_years: int,
     *   annual_leave_step_days: float,
     *   retirement_age: int,
     *   retirement_alert_days: int
     * }
     */
    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, fn () => [
            'pension_employee_rate' => (float) SystemSetting::get('pension_employee_rate', 7.0),
            'pension_employer_rate' => (float) SystemSetting::get('pension_employer_rate', 11.0),
            'annual_leave_base_days' => (float) SystemSetting::get('annual_leave_base_days', 16),
            'annual_leave_step_years' => (int) SystemSetting::get('annual_leave_service_step_years', 2),
            'annual_leave_step_days' => (float) SystemSetting::get('annual_leave_service_step_days', 1),
            'retirement_age' => (int) SystemSetting::get('statutory_retirement_age', 60),
            'retirement_alert_days' => (int) SystemSetting::get('retirement_notification_lead_days', 90),
        ]);
    }

    public function pensionEmployeeFactor(): float
    {
        return $this->all()['pension_employee_rate'] / 100;
    }

    public function pensionEmployerFactor(): float
    {
        return $this->all()['pension_employer_rate'] / 100;
    }

    public function annualLeaveBaseDays(): float
    {
        return $this->all()['annual_leave_base_days'];
    }

    public function retirementAge(): int
    {
        return $this->all()['retirement_age'];
    }

    public static function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
```

Two obligations follow:

1. **`SystemSettingController::update()` must call `StatutoryRates::flush()`** after saving. Otherwise the cache serves stale rates for up to an hour — which is a *new* bug you would introduce if you skipped this.

```php
// app/Http/Controllers/SystemSettingController.php  — at the end of update()
\App\Support\Statutory\StatutoryRates::flush();
```

2. **The cache store must be shared across processes.** Production uses `CACHE_STORE=file`, which is shared, so this works. If you later move to `array` in production, the flush becomes per-process and rates diverge between web workers. Add a note in `config/hrms.php` or the deploy docs.

### 5.3 Implementation steps

#### Step 3.1 — Rewrite the two calculation services to consume the rates

```php
<?php
// app/Services/AnnualLeaveCalculationService.php  (rewritten)

namespace App\Services;

use App\Models\Employee;
use App\Support\Statutory\StatutoryRates;
use Carbon\CarbonImmutable;

class AnnualLeaveCalculationService
{
    public function __construct(private readonly StatutoryRates $rates) {}

    /**
     * Statutory entitlement: base days for year 1, then +step days for every
     * completed `step_years` of continuous service.
     *
     * Art. 77, Proclamation 1156/2019.
     */
    public function calculateAnnualEntitlement(Employee $employee): float
    {
        $config = $this->rates->all();

        $yearsOfService = (int) CarbonImmutable::parse($employee->employment_date)
            ->diffInYears(CarbonImmutable::now());

        if ($yearsOfService < 1) {
            return $config['annual_leave_base_days'];
        }

        $incrementYears = $yearsOfService - 1;
        $steps = intdiv($incrementYears, max(1, $config['annual_leave_step_years']));

        return $config['annual_leave_base_days'] + ($steps * $config['annual_leave_step_days']);
    }
}
```

```php
<?php
// app/Services/RetirementCalculationService.php  (edits)

public function __construct(private readonly StatutoryRates $rates) {}

public function calculateRetirementDate(Carbon|string $birthDate): Carbon
{
    $date = $birthDate instanceof Carbon ? $birthDate->copy() : Carbon::parse($birthDate);

    return $date->addYears($this->rates->retirementAge());
}

/**
 * BUGFIX: previously `$daysRemaining >= -1825` counted people up to five
 * years PAST retirement as "nearing retirement".
 */
public function isNearingRetirement(Employee|Carbon|string $target, ?int $withinDays = null): bool
{
    $withinDays ??= $this->rates->all()['retirement_alert_days'];

    // … resolve $birthDate as before …

    $daysRemaining = (int) Carbon::now()->startOfDay()
        ->diffInDays($this->calculateRetirementDate($birthDate)->startOfDay(), false);

    return $daysRemaining >= 0 && $daysRemaining <= $withinDays;
}
```

Note the behaviour change: `isNearingRetirement` no longer includes already-retired people. Check the existing tests:

```bash
php artisan test --compact --filter=Retirement
```

If a test asserts the old five-year-past window, that test is encoding the bug and must be corrected with a comment explaining the statutory basis (`retirement_notification_lead_days = 90`).

Also note `isNearingRetirement`'s default changed from `365` to the configured `90`. That will shrink the dashboard retirement alert list from "next 12 months (plus 5 years past)" to "next 90 days". Confirm with HR before shipping; if they want 12 months, set `retirement_notification_lead_days = 365` in Settings — which is now actually respected. **That is the point of this refactor: the policy moves into data.**

#### Step 3.2 — Remove every hardcode

Mechanical but must be done in one PR per file so a review can check each one:

```bash
rg -n "0\.07|0\.11|16\.0|16,|STATUTORY_RETIREMENT_AGE" app/
```

Expected replacements:

| File | Replace with |
|---|---|
| `EmployeeController.php:73-74` | `$payroll->fromInput($data)` (Area 2 removes this entirely) |
| `EmployeeSalaryController.php:31-32` | `PayrollCalculator` via `ChangeEmployeeSalaryAction` |
| `ExcelImportExportController.php:261-262, 269-272` | `RegisterEmployeeAction` (Area 2 removes this entirely) |
| `PortalController.php:82,135-136` | `AnnualLeaveCalculationService` / injected rates |
| `AnnualLeaveCalculationService.php:21,27` | `StatutoryRates` |
| `RetirementCalculationService.php` | `StatutoryRates` |
| the three import commands | moved out of `app/` (Area 2, step 2.6) |

#### Step 3.3 — Frontend: stop duplicating the rates

The live payroll preview in `Create.tsx` must not hardcode `0.07`. Two options:

**Option A (recommended, smallest):** pass the rates once as an Inertia shared prop.

```php
// app/Http/Middleware/HandleInertiaRequests.php  — share()
'statutory' => fn () => [
    'pension_employee_rate' => app(StatutoryRates::class)->all()['pension_employee_rate'],
    'pension_employer_rate' => app(StatutoryRates::class)->all()['pension_employer_rate'],
    'annual_leave_base_days' => app(StatutoryRates::class)->all()['annual_leave_base_days'],
],
```

Because it is a closure, Inertia only evaluates it on the initial page load, not on every partial reload — so it costs one cached array build.

```tsx
// resources/js/Pages/Employees/Create.tsx
const { statutory } = usePage<SharedPageProps>().props;

const employeePension =
    Math.round(basic * (statutory.pension_employee_rate / 100) * 100) / 100;
const companyPension =
    Math.round(basic * (statutory.pension_employer_rate / 100) * 100) / 100;
```

**Option B:** a `/api/v1/statutory-rates` endpoint cached client-side. Only worth it if you later need it in a non-Inertia context.

Either way, the two hardcoded label strings (`"Pension 7% (Employee)"`, `"Subject to 7% employee pension deduction and 11% employer contribution"`) must be templated from the same prop. A label that says 7% while the math uses 8% is exactly the failure mode this area exists to prevent.

#### Step 3.4 — Prove the settings actually work

This is the test that makes the whole area real. It is the only test that would have caught the existing bug:

```php
<?php
// tests/Feature/Statutory/SettingsAreAuthoritativeTest.php

use App\Models\SystemSetting;
use App\Services\AnnualLeaveCalculationService;
use App\Support\Statutory\PayrollCalculator;
use App\Support\Statutory\StatutoryRates;

it('uses the configured pension rate instead of a hardcoded one', function () {
    SystemSetting::set('pension_employee_rate', 9.0);
    SystemSetting::set('pension_employer_rate', 13.0);
    StatutoryRates::flush();

    $breakdown = app(PayrollCalculator::class)->fromInput(['basic_salary' => 1000]);

    expect($breakdown->pensionEmployee)->toBe(90.0)
        ->and($breakdown->pensionEmployer)->toBe(130.0);
});

it('uses the configured annual leave base days', function () {
    SystemSetting::set('annual_leave_base_days', 20);
    StatutoryRates::flush();

    $employee = \App\Models\Employee::factory()->create(['employment_date' => now()->subYear()->toDateString()]);

    expect(app(AnnualLeaveCalculationService::class)->calculateAnnualEntitlement($employee))
        ->toBe(20.0);
});

it('flushes the cached rates when settings are updated via the UI', function () {
    $admin = \App\Models\User::factory()->create(['role' => 'HRAdmin']);

    // Prime the cache with the seeded value
    expect(app(StatutoryRates::class)->pensionEmployeeFactor())->toBe(0.07);

    $this->actingAs($admin)
        ->put(route('settings.update'), ['key' => 'pension_employee_rate', 'value' => '8.5'])
        ->assertRedirect();

    expect(app(StatutoryRates::class)->pensionEmployeeFactor())->toBe(0.085);
});
```

The third test is the one that catches the most likely future regression: someone adds caching, forgets the flush, and payroll silently runs on stale rates for an hour.

### 5.4 Acceptance criteria

| Check | Before | After |
|---|---|---|
| `0.07` in `app/` | 6 | 0 |
| `0.11` in `app/` | 6 | 0 |
| Literal `16` for leave entitlement in `app/` | 4 | 0 |
| `STATUTORY_RETIREMENT_AGE` const | 1 | 0 |
| Changing the rate in Settings changes payroll output | no | yes, with test |
| `SystemSetting::get` queries per payroll run | N | 1 per hour per process |
| Retirement alert includes people 5 years retired | yes | no |

### 5.5 Risk

- **Behaviour change is the risk, not the code.** Retirement window (365 → configured 90) and the `-1825` bugfix both alter what HR sees on the dashboard. Ship with a one-paragraph note in the release and a SQL snapshot of the before/after alert lists so HR can confirm the delta is intended.

```sql
-- Snapshot before deploying: who is currently flagged?
SELECT id, file_no, full_name, birth_date, retirement_date
FROM employees
WHERE birth_date IS NOT NULL
  AND status <> 'Separated'
  AND DATEDIFF(DATE_ADD(birth_date, INTERVAL 60 YEAR), CURDATE()) BETWEEN -1825 AND 365
ORDER BY retirement_date;
```

- **Cache flush must ship with the cache.** Never introduce `Cache::remember` on statutory rates without the flush. Add a `// @see tests/Feature/Statutory/SettingsAreAuthoritativeTest.php` comment at the flush site so the next person understands why it is there.

**Estimated effort:** 2–3 days including the parity tests.

---

## 6. Improvement Area 4 — Decompose the seven "god components"

**Severity: High (velocity and correctness).** This is the pain you feel every day. It is also the safest large change, because these are pure view files with a green backend suite behind them.

### 6.1 Problem statement, measured

| File | Lines | What is inside it |
|---|---|---|
| `resources/js/Pages/Portal/Profile.tsx` | **2,062** | 4 tab panels + 4 dialogs + photo upload + leave request form + discrepancy form + clipboard helpers + tour definitions + 210 lines of local state/handlers |
| `resources/js/Pages/Employees/Edit.tsx` | **1,692** | 7 sections + salary history CRUD + photo upload + delete confirm + 2 `useForm` instances |
| `resources/js/Pages/Employees/Create.tsx` | **1,491** | 5-step wizard + dual-calendar sync + live payroll preview + validation gating |
| `resources/js/Pages/Employees/Index.tsx` | **1,162** | filter bar + URL sync + debounce + keyboard shortcuts + table + card view + peek drawer + import modal + tour |
| `resources/js/Pages/Employees/Show.tsx` | **1,116** | profile read view + leave ledger + salary history + retirement panel + tour |
| `resources/js/Pages/Dashboard.tsx` | **1,073** | 6 metric cards + 4 recharts panels + alert lists + framer-motion variants + tour |
| `resources/js/Pages/Leave/Index.tsx` | **1,013** | ledger table + approve/reject dialogs + filters + view toggle |

Seven files, **9,609 lines** — 35% of the entire 27,505-line frontend in seven files. The average page is 917 lines.

The cost is not aesthetic. It is:

- **Review blindness.** A 2,062-line file cannot be reviewed. `git diff` on it is unreadable, so reviewers approve on trust. That is how the `Employee::first()` fallback survived.
- **Merge conflicts.** Any two people touching the employee area conflict, because they both edit `Create.tsx` or `Edit.tsx`.
- **Untestable.** There is no way to unit-test "does the payroll preview compute correctly" when the computation is 3 lines inside a 1,491-line component that requires Inertia context to render.
- **Duplicated state machines.** `Employees/Index.tsx`, `Announcements/Index.tsx`, and `NewEmployees/Index.tsx` each implement the same filter-state ↔ URL sync (`executeFilter` / `debounced` / `resetAllFilters`). `formatCurrency` exists **10 times**. `useViewMode` exists in 6 pages.

### 6.2 The rule to adopt

> **A page file may contain only: prop destructuring, layout wrapping, `<Head>`, and composition of feature components. Target ≤ 150 lines. Hard ceiling 250, enforced by review.**

Everything else — state, handlers, derived values, sub-JSX — belongs in `hooks/` or `components/` **scoped to the feature**, not in `Components/` root.

### 6.3 Decomposition maps (exact line boundaries)

These boundaries come from the actual JSX section markers in each file, so the extraction is mechanical rather than judgement-based.

#### 6.3.1 `Employees/Create.tsx` → 5 step components + 1 hook

Existing markers: step 1 at 442, step 2 at 686, step 3 at 878, step 4 at 1019, step 5 at 1315.

```
resources/js/Pages/Employees/Create/
├── index.tsx                        ~90 lines   (was 1,491)
├── hooks/
│   └── useEmployeeForm.ts           ~180 lines  (form state, dual-calendar sync, step gating)
└── components/
    ├── WizardShell.tsx              ~120 lines  (progress rail, step nav, sticky footer)
    ├── StepPersonal.tsx             ~240 lines  (was 442-685)
    ├── StepOrganisation.tsx         ~190 lines  (was 686-877)
    ├── StepDates.tsx                ~140 lines  (was 878-1018)
    ├── StepCompensation.tsx         ~290 lines  (was 1019-1314)
    └── StepReview.tsx               ~175 lines  (was 1315-1491)
```

`index.tsx` becomes:

```tsx
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WizardShell } from './components/WizardShell';
import { StepPersonal } from './components/StepPersonal';
import { StepOrganisation } from './components/StepOrganisation';
import { StepDates } from './components/StepDates';
import { StepCompensation } from './components/StepCompensation';
import { StepReview } from './components/StepReview';
import { useEmployeeForm } from './hooks/useEmployeeForm';
import type { Department } from '@/types/employee';

interface Props {
    departments: Department[];
}

export default function Create({ departments }: Props) {
    const form = useEmployeeForm(departments);

    return (
        <AuthenticatedLayout>
            <Head title="Register Personnel" />

            <WizardShell form={form}>
                {form.step === 1 && <StepPersonal form={form} />}
                {form.step === 2 && <StepOrganisation form={form} departments={departments} />}
                {form.step === 3 && <StepDates form={form} />}
                {form.step === 4 && <StepCompensation form={form} />}
                {form.step === 5 && <StepReview form={form} />}
            </WizardShell>
        </AuthenticatedLayout>
    );
}
```

That is 36 lines of real code. The entire wizard is now composable.

#### 6.3.2 `Employees/Edit.tsx` and `Create.tsx` share one form definition

The measured overlap is **39 of 45 fields**. Do not create a shared "mega form component" — create a shared **schema + hook**, and let each layout render its own JSX.

```
resources/js/Pages/Employees/shared/
├── employeeFormSchema.ts        // 39-field initial state + field metadata
├── useEmployeeFormState.tsx     // useForm + derived values + validation gating
└── components/
    ├── PersonalFields.tsx       // used by Create step 1 AND Edit section 1
    ├── OrganisationFields.tsx   // Create step 2 AND Edit section 2
    ├── DateFields.tsx           // Create step 3 AND Edit section 3
    ├── CompensationFields.tsx   // Create step 4 AND Edit section 6 (editable part)
    └── BankingFields.tsx        // Create step 4 AND Edit section 6
```

```ts
// resources/js/Pages/Employees/shared/employeeFormSchema.ts
import type { EmployeeFormValues } from '@/types/employee';

export const employeeFormDefaults = (todayGc: string, firstDeptId?: number): EmployeeFormValues => ({
    // 39 fields, initialised identically in Create and Edit
    full_name: '',
    gender: 'Male',
    marital_status: 'Single',
    education_status: '',
    phone: '',
    email: '',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    sub_city: 'Bole',
    woreda: '',
    house_no: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    file_no: '',
    department_id: firstDeptId ? String(firstDeptId) : '',
    position: '',
    work_place: 'H.O',
    employment_type: 'Non-Managerial',
    contract_type: 'Permanent',
    status: 'Probation',
    grade: '',
    step: '',
    employment_date: todayGc,
    employment_date_ec: '',
    birth_date: '',
    birth_date_ec: '',
    contract_end_date: '',
    basic_salary: '',
    responsibility_allowance: '0',
    project_allowance: '0',
    position_allowance: '0',
    hardship_allowance: '0',
    transport_allowance: '0',
    house_allowance: '0',
    mobile_allowance: '0',
    food_allowance: '0',
    bank_name: 'Commercial Bank of Ethiopia (CBE)',
    bank_account_no: '',
    tin_no: '',
    social_security_no: '',
    poessa_no: '',
    psssa_no: '',
    plate_number: '',
    remarks: '',
});
```

> **Important:** keep the *return type* explicit (`EmployeeFormValues`) so TypeScript catches drift between Create and Edit. This is where the missing shared types from Area 5 pay off — you cannot share a form state object without a shared type.

#### 6.3.3 `Portal/Profile.tsx` → 4 tabs + 4 dialogs

Existing markers: tabs at 915 (`career`), 1090 (`payroll`), 1308 (`statutory`), 1630 (`corrections`); dialogs at 1731 (discrepancy), 1859 (delete photo), 1884 (leave request), 2113 (cancel leave).

```
resources/js/Pages/Portal/Profile/
├── index.tsx                          ~110 lines   (was 2,062)
├── hooks/
│   ├── usePortalWorkspace.ts          ~45 lines    (tab + tour-driven tab switching)
│   └── useProfilePhoto.ts             ~55 lines    (upload/delete + busy state)
└── components/
    ├── CareerPanel.tsx                ~175 lines   (915-1089)
    ├── PayrollPanel.tsx               ~218 lines   (1090-1307)
    ├── StatutoryPanel.tsx             ~322 lines   (1308-1629)
    ├── CorrectionsPanel.tsx           ~101 lines   (1630-1730)
    ├── DiscrepancyDialog.tsx          ~128 lines   (1731-1858)
    ├── DeletePhotoDialog.tsx          ~25 lines    (1859-1883)
    ├── LeaveRequestDialog.tsx         ~229 lines   (1884-2112)
    └── CancelLeaveDialog.tsx          ~40 lines    (2113-end)
```

`StatutoryPanel` at 322 lines is still above target. Split it once more into `StatutorySummary`, `LeaveLedgerTable`, and `RetirementCard`; the panel then becomes ~90 lines of composition.

#### 6.3.4 `Dashboard.tsx` → panels

```
resources/js/Pages/Dashboard/
├── index.tsx                     ~80 lines
├── components/
│   ├── MetricCards.tsx           // the 6 headline numbers
│   ├── TenureDonut.tsx           // recharts pie
│   ├── SiteBreakdownChart.tsx    // recharts bar
│   ├── GenderSplit.tsx
│   ├── ProbationAlerts.tsx
│   ├── RetirementAlerts.tsx
│   ├── DiscrepancyQueue.tsx
│   └── RecentStaff.tsx
└── motion.ts                     // the framer-motion variant objects, imported where needed
```

Every chart component should be lazily imported at the page level so the charting library is not in the initial payload:

```tsx
const TenureDonut = lazy(() => import('./components/TenureDonut'));
```

But note: because Inertia already code-splits per page, this only helps if the charts are below the fold. Measure before adding Suspense boundaries — see Area 8.

#### 6.3.5 `Employees/Index.tsx` → table, filters, and a shared filter hook

This page contains three separate features. Extract the filter mechanism to a **reusable hook**, because three pages already duplicate it:

```ts
// resources/js/hooks/useInertiaFilters.ts
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Scalar = string | number | boolean | null | undefined;
export type FilterState = Record<string, Scalar | Scalar[]>;

/**
 * Two-way binding between local filter state and the Inertia query string.
 *
 * Replaces the copy-pasted executeFilter / debounce / reset blocks in
 * Employees/Index, Announcements/Index and NewEmployees/Index.
 */
export function useInertiaFilters<T extends FilterState>(
    routeName: string,
    incoming: Partial<T>,
    defaults: T,
    debounceMs = 250,
) {
    const [state, setState] = useState<T>({ ...defaults, ...incoming } as T);
    const timer = useRef<number | null>(null);

    // Re-sync when the server hands us new props (back button, shared link)
    useEffect(() => {
        setState({ ...defaults, ...incoming } as T);
    }, [JSON.stringify(incoming)]);

    const push = useCallback(
        (next: T) => {
            const query = Object.fromEntries(
                Object.entries(next).filter(([, value]) => {
                    if (value === '' || value === null || value === undefined) return false;
                    if (Array.isArray(value) && value.length === 0) return false;
                    return true;
                }),
            );

            router.get(route(routeName), query, { preserveState: true, preserveScroll: true, replace: true });
        },
        [routeName],
    );

    const apply = useCallback(
        (patch: Partial<T>, immediate = false) => {
            setState((prev) => {
                const next = { ...prev, ...patch } as T;
                if (timer.current) window.clearTimeout(timer.current);
                if (immediate) push(next);
                else timer.current = window.setTimeout(() => push(next), debounceMs);
                return next;
            });
        },
        [push, debounceMs],
    );

    const reset = useCallback(() => {
        setState(defaults);
        push(defaults);
    }, [defaults, push]);

    return { state, apply, reset };
}
```

Then `Employees/Index.tsx` loses ~90 lines, and `Announcements/Index.tsx` and `NewEmployees/Index.tsx` lose the same block.

### 6.4 How to actually do these extractions safely

The failure mode of a component split is subtle UI regression that the test suite cannot see. Procedure:

1. **Characterization first.** Before touching the file, add a Playwright snapshot test of the rendered page (Area 10). One screenshot, one assertion. It will not catch everything, but it catches "the page is blank" and "the layout collapsed".
2. **Extract, do not rewrite.** Move the JSX verbatim into a new file. Do not "clean up while you are in there". A move-only diff can be reviewed by checking that the removed and added blocks are identical.
3. **One component per commit.** `StepPersonal` lands, CI runs, then `StepOrganisation`.
4. **Keep props explicit.** Do not pass the whole `form` object into leaf components unless they genuinely use most of it. `StepDates` needs `data`, `errors`, `setData` — pass those three, not the entire hook return.
5. **Verify the line count after each commit.** If `Create.tsx` is not shrinking, the extraction is not real.

A useful guard against regression: add a CI check that fails when any page file exceeds 400 lines.

```yaml
# .github/workflows/deploy.yml — add a job step
- name: Enforce page size budget
  run: |
    fail=0
    while IFS= read -r file; do
      lines=$(wc -l < "$file")
      if [ "$lines" -gt 400 ]; then
        echo "::error file=$file::Page exceeds 400 lines ($lines). Extract components. See PLAN-CODEBASE-REMEDIATION.md §6."
        fail=1
      fi
    done < <(find resources/js/Pages -name '*.tsx')
    exit $fail
```

Set the budget to 400 initially (not 250) so the check is achievable in the first week, then ratchet it down to 250 once the top five files are split. A budget that fails on day one gets disabled; a ratchet gets adopted.

### 6.5 Acceptance criteria

| Check | Before | After |
|---|---|---|
| Files > 1,000 lines | 7 | 0 |
| Largest page file | 2,062 | ≤ 250 |
| `Create.tsx` lines | 1,491 | ≤ 90 |
| `Profile.tsx` lines | 2,062 | ≤ 110 |
| `formatCurrency` definitions | 10 | 1 (in `lib/format.ts`) |
| Filter URL-sync implementations | 3 | 1 hook |
| `useViewMode` call sites reimplementing state | 6 | 1 hook |

Also deduplicate while you are there:

```ts
// resources/js/lib/format.ts
export const formatCurrency = (value?: number | null, currency = 'ETB'): string =>
    new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(value ?? 0);

export const formatEthiopianDisplay = (isoEc: string | null | undefined): string => {
    if (!isoEc) return '—';
    const [year, month, day] = isoEc.split('-');
    return `${day}/${month}/${year} E.C.`;
};
```

Note `formatCurrency` currently returns `'0.00 ETB'` for falsy input via an early return and `Intl` output otherwise — two different string shapes. The replacement above is consistent. Check any test or snapshot that asserts `'0.00 ETB'` exactly; `Intl` will produce `ETB 0.00`. That is a deliberate normalisation, but it *is* a visible change on every page, so call it out in the release note.

**Estimated effort:** 8–10 days total; `Create` + `Edit` together are 3–4 days, `Profile` is 2 days, the rest 1 day each.

---

## 7. Improvement Area 5 — A real contract layer: shared types + API Resources

**Severity: High (correctness drift).** Today the frontend and backend agree by coincidence.

### 7.1 Problem statement

`resources/js/types/` exists but contains only:

```
index.d.ts     521 bytes   (User, PageProps)
global.d.ts    450 bytes   (window.route, Inertia module augmentation)
vite-env.d.ts   38 bytes
```

There are **no domain types**. Instead, each page declares its own inline `interface Props`, e.g. `Employees/Edit.tsx:84-140` declares a 50-field `employee` object shape by hand, and `Portal/Profile.tsx:73-225` declares **four** interfaces (`Colleague`, `LeaveRequest`, `DiscrepancyReport`, `Employee`) inline.

Two consequences:

1. **Silent drift.** `Employees/Edit.tsx` declares `professional_license?: string`, `cost_sharing_status?: string`; `Portal/Profile.tsx` declares its own `Employee` with a different field set. A backend rename breaks one page and not the other, and TypeScript cannot tell you because the type is local.
2. **Payload over-sharing.** The backend sends raw Eloquent models:

```php
// EmployeeController::show()  — line 298
return Inertia::render('Employees/Show', ['employee' => $employee]);
```

`$employee` serialises **all 57 columns**, plus two `$appends` (`profile_photo_url`, `age`). That includes `bank_account_no`, `tin_no`, `social_security_no`, `poessa_no`, `psssa_no`. On `Employees/Show` for a Manager, that is a PII/credential exposure amplified by the fact that Managers have `role:HRAdmin,SysAdmin,Manager` access to the whole directory.

There are **0** `app/Http/Resources` classes and **28** `Inertia::render` calls that pass raw models or ad-hoc arrays.

### 7.2 Target design

```
resources/js/types/
├── index.d.ts            // PageProps, SharedPageProps
├── employee.ts           // Employee, EmployeeListItem, EmployeeFormValues, Department
├── payroll.ts            // SalaryRecord, PayrollBreakdown
├── leave.ts              // LeaveRequest, LeaveBalance, LeaveType
├── portal.ts             // DiscrepancyReport, Colleague
└── common.ts             // Paginated<T>, FilterOption, Flash

app/Http/Resources/
├── EmployeeResource.php          // full record — HR admin only
├── EmployeeListResource.php      // directory row — Manager-safe
├── EmployeeSelfResource.php      // ESS profile — no payroll internals
├── SalaryResource.php
├── LeaveRequestResource.php
├── LeaveBalanceResource.php
└── DepartmentResource.php
```

**Three resources for one model is correct, not over-engineering.** The whole point is that a Manager, an HR admin, and the employee themselves must receive *different* field sets from the same table. One resource cannot express that without conditionals that will eventually leak.

### 7.3 Implementation

#### Step 5.1 — Write the types once

```ts
// resources/js/types/employee.ts
import type { SalaryRecord } from './payroll';

export type Gender = 'Male' | 'Female';
export type EmploymentType = 'Non-Managerial' | 'Managerial';
export type ContractType = 'Permanent' | 'Contract' | 'Daily';
export type EmployeeStatus = 'Probation' | 'Permanent' | 'Contract' | 'Separated' | 'Retired';

export interface Department {
    id: number;
    name: string;
}

/** The shape returned by EmployeeResource. Full record, HR admin only. */
export interface Employee {
    id: number;
    file_no: string;
    employee_id_no: string | null;
    full_name: string;
    gender: Gender;
    marital_status: string | null;
    education_status: string | null;
    institution: string | null;
    graduation_year_ec: string | null;
    professional_license: string | null;
    cost_sharing_status: string | null;
    department_id: number;
    department: Department | null;
    position: string;
    work_place: string;
    employment_type: EmploymentType;
    contract_type: ContractType;
    status: EmployeeStatus;
    grade: string | null;
    step: string | null;

    employment_date: string;          // ISO YYYY-MM-DD (G.C.)
    employment_date_ec: string | null; // canonical YYYY-MM-DD (E.C.)
    birth_date: string | null;
    birth_date_ec: string | null;
    contract_end_date: string | null;
    retirement_date: string | null;
    probation_end_date: string | null;
    probation_status: 'Pending' | 'Passed' | 'Failed' | 'Extended';

    phone: string | null;
    email: string | null;
    region: string | null;
    city: string | null;
    sub_city: string | null;
    woreda: string | null;
    house_no: string | null;
    emergency_contact_name: string | null;
    emergency_contact_relationship: string | null;
    emergency_contact_phone: string | null;

    tin_no: string | null;
    bank_name: string | null;
    bank_account_no: string | null;    // absent from EmployeeListResource
    social_security_no: string | null;
    poessa_no: string | null;
    psssa_no: string | null;
    plate_number: string | null;
    remarks: string | null;

    profile_photo_url: string | null;
    age: number | null;
}

/** The shape returned by EmployeeListResource. Safe for Managers. */
export type EmployeeListItem = Pick<
    Employee,
    | 'id' | 'file_no' | 'full_name' | 'gender' | 'position' | 'work_place'
    | 'status' | 'department' | 'profile_photo_url'
> & {
    basic_salary: number | null;
    total_salary: number | null;
    employment_date_ec: string | null;
};

/** The shape the Create/Edit forms use. Strings, because inputs are strings. */
export interface EmployeeFormValues {
    full_name: string;
    gender: Gender;
    marital_status: string;
    /* … the 39 fields from employeeFormSchema.ts … */
    basic_salary: string;
    house_allowance: string;
    [key: string]: string; // index signature keeps setData ergonomic without `any`
}
```

```ts
// resources/js/types/common.ts
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface FilterOption {
    label: string;
    value: string;
}
```

#### Step 5.2 — Shape the payloads

```php
<?php
// app/Http/Resources/EmployeeListResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Directory row. Deliberately excludes every statutory identifier,
 * bank detail, and address field.
 */
class EmployeeListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'file_no' => $this->file_no,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'position' => $this->position,
            'work_place' => $this->work_place,
            'status' => $this->status,
            'employment_date_ec' => $this->employment_date_ec,
            'department' => DepartmentResource::make($this->whenLoaded('department')),
            'basic_salary' => $this->when(
                $request->user()?->isAdmin(),
                fn () => (float) ($this->currentSalary?->basic_salary ?? 0),
            ),
            'total_salary' => $this->when(
                $request->user()?->isAdmin(),
                fn () => (float) ($this->currentSalary?->total_salary ?? 0),
            ),
            'profile_photo_url' => $this->profile_photo_url,
        ];
    }
}
```

```php
<?php
// app/Http/Resources/EmployeeResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'file_no' => $this->file_no,
            'employee_id_no' => $this->employee_id_no,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'marital_status' => $this->marital_status,
            'education_status' => $this->education_status,
            'institution' => $this->institution,
            'graduation_year_ec' => $this->graduation_year_ec,
            'professional_license' => $this->professional_license,
            'cost_sharing_status' => $this->cost_sharing_status,
            'department_id' => $this->department_id,
            'department' => DepartmentResource::make($this->whenLoaded('department')),
            'position' => $this->position,
            'work_place' => $this->work_place,
            'employment_type' => $this->employment_type,
            'contract_type' => $this->contract_type,
            'status' => $this->status,
            'grade' => $this->grade,
            'step' => $this->step,

            // Dates are normalised to ISO here, not in the view.
            'employment_date' => $this->employment_date?->toDateString(),
            'employment_date_ec' => $this->employment_date_ec,
            'birth_date' => $this->birth_date?->toDateString(),
            'birth_date_ec' => $this->birth_date_ec,
            'contract_end_date' => $this->contract_end_date?->toDateString(),
            'retirement_date' => $this->retirement_date?->toDateString(),
            'probation_end_date' => $this->probation_end_date?->toDateString(),
            'probation_status' => $this->probation_status,

            'phone' => $this->phone,
            'email' => $this->email,
            'region' => $this->region,
            'city' => $this->city,
            'sub_city' => $this->sub_city,
            'woreda' => $this->woreda,
            'house_no' => $this->house_no,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_relationship' => $this->emergency_contact_relationship,
            'emergency_contact_phone' => $this->emergency_contact_phone,

            'tin_no' => $this->tin_no,
            'bank_name' => $this->bank_name,
            'bank_account_no' => $this->bank_account_no,
            'social_security_no' => $this->social_security_no,
            'poessa_no' => $this->poessa_no,
            'psssa_no' => $this->psssa_no,
            'plate_number' => $this->plate_number,
            'remarks' => $this->remarks,

            'profile_photo_url' => $this->profile_photo_url,
            'age' => $this->age,
        ];
    }
}
```

Then:

```php
// EmployeeController::index()
return Inertia::render('Employees/Index', [
    'employees' => EmployeeListResource::collection($employees),
    'filters' => $request->only([...]),
    'stats' => $stats,
    'departments' => DepartmentResource::collection($departments),
    'workplaces' => $workplaces,
    'positions' => $positions,
]);
```

`EmployeeListResource::collection($paginator)` preserves pagination metadata, so `Paginated<EmployeeListItem>` in TypeScript is accurate.

#### Step 5.3 — Verify the resource boundaries with a test

```php
<?php
// tests/Feature/Employee/ResourceBoundaryTest.php

it('does not leak statutory identifiers to a manager in the directory', function () {
    $manager = User::factory()->create(['role' => 'Manager']);
    $employee = Employee::factory()->create([
        'bank_account_no' => '999888777',
        'tin_no' => 'TIN-1',
        'poessa_no' => 'PO-1',
    ]);

    $this->actingAs($manager)
        ->get(route('employees.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Employees/Index')
            ->has('employees.data.0')
            ->missing('employees.data.0.bank_account_no')
            ->missing('employees.data.0.tin_no')
            ->missing('employees.data.0.poessa_no')
        );
});

it('does leak statutory identifiers to an hr admin on the detail page', function () {
    $admin = User::factory()->create(['role' => 'HRAdmin']);
    $employee = Employee::factory()->create(['bank_account_no' => '999888777']);

    $this->actingAs($admin)
        ->get(route('employees.show', $employee))
        ->assertInertia(fn (Assert $page) => $page
            ->where('employee.bank_account_no', '999888777')
        );
});
```

That first test is worth more than the entire refactor, because it converts a policy decision into an assertion.

#### Step 5.4 — Optional: generate the types instead of maintaining them

You are on Laravel 13 with TypeScript strict mode. Two viable generators:

- `spatie/laravel-typescript-transformer` — transforms Eloquent models, DTOs, and enums into `.d.ts`.
- `laravel/pao` is already in `devDependencies` (`^1.0.6`); check whether it exposes type generation in your installed version before adding another package.

**My recommendation: do not add a generator yet.** Hand-written types in `resources/js/types/` are ~200 lines, readable, and reviewable. A generator adds a build step, a config file, and a regeneration ritual that nobody will remember. Add it only if the types exceed ~600 lines or the team grows past three people.

### 7.4 Acceptance criteria

| Check | Before | After |
|---|---|---|
| Domain type files | 0 | ≥ 4 |
| Inline `interface Props { employee: {...} }` declarations | 12 | 0 |
| `app/Http/Resources` classes | 0 | ≥ 6 |
| Manager receives `bank_account_no` in directory payload | yes | no |
| `Paginated<T>` used in page props | no | yes |
| `any` in page prop types | present | 0 |

**Estimated effort:** 4–5 days (types 2, resources 2, boundary tests 0.5).

---

## 8. Improvement Area 6 — Query discipline: stop loading tables into PHP

**Severity: Medium today, High at 3× scale.** The current row count (362) hides these defects. They are all O(n) in PHP memory and O(n) in query count, so they degrade linearly and then fall off a cliff.

### 8.1 Problem statement

#### 6A — The dashboard filters in PHP

```php
// app/Http/Controllers/DashboardController.php:86-106
$retirementCandidates = Employee::where('status', '!=', 'Separated')
    ->whereNotNull('birth_date')
    ->with('department')
    ->get()                                     // ← every employee row, hydrated
    ->filter(function ($emp) {
        return $this->retirementService->isNearingRetirement(Carbon::parse($emp->birth_date));
    })
    ->values()
    ->map(function ($emp) { /* … */ });
```

With 362 rows this costs maybe 8 MB and 40 ms. With 3,000 rows it costs 70 MB and 400 ms, and every one of those rows is hydrated into a full Eloquent model with 57 columns plus relations. The `filter` runs in PHP, so the database index on `birth_date` is used for the `whereNotNull` only — not for the date window.

#### 6B — The dashboard issues ~30 queries per view, uncached

Rough decomposition (C-tier estimate):

| Block | Queries |
|---|---|
| Headcount counts (`totalActive`, `permanent`, `probation`, `contract`, `separated`, `headOffice`, `male`, `female`) | 8 |
| `TurnoverCalculationService::calculateTurnover` × 2 calls × 4 queries | 8 |
| Payroll sums (`total_salary`, `basic_salary`, `pension_company`) | 3 |
| Probation candidates (`get` + `department` eager load) | 2 |
| Retirement candidates (`get` + `department` eager load) | 2 |
| Discrepancy list + count | 2 |
| Department breakdown (`whereHas` + `withCount`) | 2 |
| Site breakdown | 1 |
| Recent staff | 2 |
| Shared props (`user` + `employee` relation) | 2 |
| **Total** | **≈32** |

Every HR admin's landing page runs 32 queries. It is the single most-hit authenticated route.

#### 6C — `$appends` taxes every serialization

```php
// app/Models/Employee.php:74-77
protected $appends = ['profile_photo_url', 'age'];
```

Every `Employee` → array conversion triggers `asset()` (a URL builder) and a Carbon diff. That includes the 15-row directory page, the import preview, every resource, and every audit log `new_values` payload. The audit log bloat (`old_values` + `new_values` = 57 columns each) is amplified by this.

#### 6D — List stats run 7 count queries that could be one

```php
// EmployeeController::index()  lines 225-233
$stats = [
    'total_headcount' => Employee::count(),
    'permanent_count' => Employee::where('status', 'Permanent')->count(),
    'project_count' => Employee::whereNotIn(...)->count(),
    'head_office_count' => Employee::whereIn(...)->count(),
    'probation_count' => Employee::where('status', 'Probation')->count(),
    'contract_count' => Employee::where('status', 'Contract')->count(),
    'separated_count' => Employee::where('status', 'Separated')->count(),
];
```

Plus three more queries for `departments`, `workplaces` (distinct), and `positions` (distinct). Ten queries to render one table header.

#### 6E — `LeaveBalanceController::index()` loads every active employee to compute an average

```php
// line 61
'average_entitlement' => round((float) (Employee::where('status', '!=', 'Separated')
    ->get()                                  // ← all 362 models
    ->avg(fn ($e) => $this->leaveService->calculateAnnualEntitlement($e)) ?: 16.0), 1),
```

`calculateAnnualEntitlement` is `O(1)` per row, but the `get()` is not. This is the same anti-pattern as 6A in a different controller.

#### 6F — `export()` loads the entire roster then streams it

```php
// ExcelImportExportController::export()  line 349
$employees = $query->get();      // every employee + department + currentSalary
return response()->stream(function () use ($employees) { … });
```

`get()` before `stream()` defeats the purpose of streaming: peak memory is the whole result set, not one row.

#### 6G — Global 10-second polling

```tsx
// resources/js/Components/NotificationBell.tsx:143
const timer = setInterval(fetchFeed, 10000);
```

Mounted from `AuthenticatedLayout`, so it runs on **every** authenticated page. Each tick calls `/notifications/feed`, which runs `getFeed()` — 1 announcement query + 1 unread count + 3 `whereIn` plucks + 1 grouped reaction aggregate ≈ 6–7 queries. That is ~40 queries/minute/tab for a badge.

#### 6H — Lazy loading is not prevented

`AppServiceProvider::boot()` has no `Model::preventLazyLoading()`. Any missed eager load silently becomes N+1 instead of failing loudly in development. Given that `with()` is used inconsistently (e.g. `recentStaff` loads two relations, `retirementCandidates` loads one, `siteBreakdown` loads none and doesn't need to), the safety net is worth having.

### 8.2 Implementation

#### Step 6.1 — Move the retirement window into SQL

```php
<?php
// app/Models/Employee.php  — add scope

use App\Support\Statutory\StatutoryRates;
use Illuminate\Database\Eloquent\Builder;

/**
 * Employees whose statutory retirement date falls inside the alert window.
 *
 * Retirement date = birth_date + configured retirement age (default 60).
 * The window is configured by `retirement_notification_lead_days`.
 *
 * Uses a date comparison instead of hydrating rows and filtering in PHP.
 */
public function scopeNearingRetirement(Builder $query, ?int $withinDays = null): Builder
{
    $rates = app(StatutoryRates::class);
    $withinDays ??= $rates->all()['retirement_alert_days'];
    $age = $rates->retirementAge();

    $windowEnd = CarbonImmutable::now()->addDays($withinDays)->toDateString();

    return $query
        ->whereNotNull('birth_date')
        ->where('status', '!=', 'Separated')
        // birth_date + age years <= windowEnd  ⇔  birth_date <= windowEnd - age years
        ->whereDate('birth_date', '<=', CarbonImmutable::parse($windowEnd)->subYears($age)->toDateString())
        // and not already past retirement (>= today)
        ->whereDate('birth_date', '>=', CarbonImmutable::now()->subYears($age)->toDateString());
}
```

> **Why not use the stored `retirement_date` column?** It exists and is indexed, but it is only populated when `birth_date` is set at create/update time, and it is `null` for rows imported before that logic existed. Using `birth_date` arithmetic is correct for historical rows. If you backfill `retirement_date` (a good idea — see Area 9), switch this scope to `whereBetween('retirement_date', [today, today + window])`, which is a plain index range scan and cheaper.

Then the controller:

```php
$retirementCandidates = Employee::query()
    ->nearingRetirement()
    ->with('department:id,name')
    ->orderBy('birth_date')
    ->get()
    ->map(fn (Employee $emp) => [
        'id' => $emp->id,
        'file_no' => $emp->file_no,
        'full_name' => $emp->full_name,
        'position' => $emp->position,
        'department' => $emp->department?->name,
        'retirement_date' => $emp->retirement_date?->toDateString()
            ?? $this->retirementService->calculateRetirementDate($emp->birth_date)->toDateString(),
        'days_remaining' => $this->retirementService->getDaysRemaining($emp),
    ]);
```

#### Step 6.2 — Collapse the count queries into one grouped aggregate

```php
/**
 * One query instead of seven.
 *
 * @return array<string, int>
 */
private function headcountStats(): array
{
    $rows = Employee::query()
        ->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Permanent' THEN 1 ELSE 0 END) as permanent,
            SUM(CASE WHEN status = 'Probation' THEN 1 ELSE 0 END) as probation,
            SUM(CASE WHEN status = 'Contract'  THEN 1 ELSE 0 END) as contract,
            SUM(CASE WHEN status = 'Separated' THEN 1 ELSE 0 END) as separated,
            SUM(CASE WHEN gender = 'Male'   AND status <> 'Separated' THEN 1 ELSE 0 END) as male_active,
            SUM(CASE WHEN gender = 'Female' AND status <> 'Separated' THEN 1 ELSE 0 END) as female_active,
            SUM(CASE WHEN status <> 'Separated' AND work_place IN ('H.O','Head Office') THEN 1 ELSE 0 END) as head_office,
            SUM(CASE WHEN status <> 'Separated' THEN 1 ELSE 0 END) as total_active
        ")
        ->toBase()
        ->first();

    return collect((array) $rows)->map(fn ($v) => (int) $v)->all();
}
```

This is portable across SQLite and MySQL (both support `CASE WHEN` in aggregates). It works because `status` and `work_place` are low-cardinality enums with indexes.

> **Do not** materialise this into a `dashboard_metrics` table yet. At 362 rows, one aggregate query plus caching is enough. Introducing a metrics table adds an invalidation problem for no gain at this size.

#### Step 6.3 — Cache the dashboard payload, not the query results

```php
// app/Http/Controllers/DashboardController.php
public function index(): Response
{
    $user = request()->user();

    // Per-role cache: a Manager and an HR admin see the same aggregates today,
    // but scoping the key now means a future permission change cannot leak.
    $cacheKey = "dashboard.metrics.{$user->role}";

    $metrics = Cache::remember($cacheKey, now()->addMinutes(5), function () {
        $counts = $this->headcountStats();
        // … build the metrics array …
        return $metrics;
    });

    // Alerts are per-request freshness-sensitive and cheap (indexed + limited),
    // so they are NOT cached.
    return Inertia::render('Dashboard', [
        'metrics' => $metrics,
        'alerts' => [/* fresh */],
        /* … */
    ]);
}
```

Two cautions:

1. **Invalidation.** If metrics are cached 5 minutes, a newly registered employee does not appear on the dashboard immediately. That is acceptable for aggregates. It is **not** acceptable for `recentStaff` — keep that uncached so the "latest 6 hires" widget is truthful.
2. **`CACHE_STORE=file` in production** means the cache is per-server. On a multi-instance deploy, each instance has its own dashboard cache with its own 5-minute window. That is fine for a staleness-tolerant metric, but document it.

#### Step 6.4 — Stream the export properly

```php
public function export(Request $request): StreamedResponse
{
    $query = Employee::query()
        ->with(['department:id,name', 'currentSalary'])
        ->orderBy('file_no');

    if ($status = $request->input('status')) {
        $query->where('status', $status);
    }
    if ($workPlace = $request->input('work_place')) {
        $query->where('work_place', $workPlace);
    }

    return response()->streamDownload(function () use ($query) {
        $handle = fopen('php://output', 'w');

        fputcsv($handle, [/* header row */]);

        // Constant memory: one chunk at a time.
        $query->chunk(500, function ($employees) use ($handle) {
            foreach ($employees as $emp) {
                fputcsv($handle, [/* row */]);
            }
        });

        fclose($handle);
    }, 'Elhadar_Staff_Roster_'.now()->format('Y-m-d').'.csv', [
        'Content-Type' => 'text/csv',
    ]);
}
```

`chunk()` uses `ORDER BY id` internally, so the `orderBy('file_no')` is replaced. If you need file_no ordering in the CSV, use `chunkById` on an `id`-ordered query and sort in the spreadsheet, or accept `file_no` ordering via `cursor()`:

```php
foreach ($query->cursor() as $emp) { fputcsv($handle, [/* … */]); }
```

`cursor()` streams from the PDO buffer and is the cleanest option here — it preserves your `orderBy` and uses constant memory on MySQL. On SQLite it also works but holds the statement open, so do not run writes in the same connection while iterating.

#### Step 6.5 — Kill the global poll, keep the badge live

Three options, in order of preference:

**Option 1 (best): SSE or WebSocket.** Laravel 13 + a queue worker can broadcast on `AnnouncementPublished`. This is the correct architecture but is a bigger change (`BROADCAST_CONNECTION=null` today, and production has `QUEUE_CONNECTION=sync`).

**Option 2 (good, small): poll only when the tab is visible, and back off.**

```tsx
// resources/js/Components/NotificationBell.tsx
useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
        if (cancelled) return;

        // Do not poll a hidden tab. This alone removes ~70% of the traffic.
        if (document.visibilityState !== 'visible') {
            timer = window.setTimeout(tick, 60_000);
            return;
        }

        await fetchFeed();

        // 10s when a notification arrived recently, 60s when quiet.
        const interval = lastActivityRef.current > Date.now() - 120_000 ? 10_000 : 60_000;
        timer = window.setTimeout(tick, interval);
    };

    tick();

    const onVisible = () => {
        if (document.visibilityState === 'visible') void fetchFeed();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
        cancelled = true;
        if (timer) window.clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisible);
    };
}, [fetchFeed]);
```

**Option 3 (cheapest): conditional GET.** Return an `ETag` based on the unread count + latest announcement id, and let the browser 304.

```php
public function feed(Request $request, NotificationCenterService $service): JsonResponse
{
    $payload = $service->getFeed($request->user());
    $etag = md5((string) json_encode($payload['unread_count'] ?? 0).'|'.($payload['items'][0]['id'] ?? ''));

    return response()
        ->json($payload)
        ->setEtag($etag)
        ->setPublic()
        ->setMaxAge(10);
}
```

#### Step 6.6 — Turn on lazy-loading prevention (carefully)

```php
// app/Providers/AppServiceProvider.php  — boot()
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
    Model::preventSilentlyDiscardingAttributes(! app()->isProduction());
    Model::preventAccessingMissingAttributes(! app()->isProduction());
}
```

**Do not ship this blind.** It will throw on the first missed `with()`, and there will be several. Procedure:

1. Add the three lines.
2. Run `php artisan test --compact`. Every failure is a real N+1 in that code path — fix the query, do not add `withoutLazyLoading()` exceptions.
3. Run the app in a browser across all 30 pages with `APP_ENV=local`. Any `LazyLoadingViolationException` is a page-level N+1.
4. Only then merge.

`preventSilentlyDiscardingAttributes` is the one that would have caught `Employee::create($data)` silently dropping the nine allowance fields. That alone justifies the change.

> **Production note:** `! app()->isProduction()` means production never throws. Some teams prefer to throw in production and log; that is a policy call. Throwing in production turns a slow page into a 500. Do not do that without a logged-only mode first.

#### Step 6.7 — Remove `$appends` from the model

```php
// app/Models/Employee.php  — delete $appends
```

Then expose them explicitly where needed:

```php
// EmployeeResource
'profile_photo_url' => $this->profile_photo_path
    ? route('employees.photo.show', $this->id)   // or Storage::disk('public')->url(...)
    : null,
'age' => $this->birth_date?->age,
```

Better: use `Storage::disk('public')->url($this->profile_photo_path)` instead of `asset('storage/'.$path)`, so the disk configuration (S3, CDN) is respected instead of hardcoding `/storage`.

**Caveat:** `profile_photo_url` and `age` are currently consumed by `EmployeeAvatar` and several pages via the raw payload. Removing `$appends` will make them `undefined` wherever a raw model is still serialized. That is why this step must land **after** Area 5 (Resources) — or, if you do it first, add the accessors to every ad-hoc array manually. Sequence matters here.

### 8.3 Acceptance criteria

| Check | Before | After |
|---|---|---|
| Dashboard queries per view | ≈32 | ≤ 12 (cold) / ≤ 3 (cached) |
| Retirement filter location | PHP `filter()` | SQL `whereDate` |
| `Employee::all()`-style `get()` for aggregation | 2 sites | 0 |
| Export peak memory | whole roster | constant |
| Notification requests/minute/tab (hidden) | 6 | 0–1 |
| `$appends` on `Employee` | 2 entries | 0 |
| `preventLazyLoading` | off | on outside production |

**Estimated effort:** 3–4 days.

---

## 9. Improvement Area 7 — Excel ingestion: get it out of the request cycle

**Severity: Medium (operational).** Not broken today; will time out on a large sheet.

### 9.1 Problem statement

`ExcelImportExportController::preview()` loads the entire spreadsheet into memory:

```php
$spreadsheet = IOFactory::load($file->getRealPath());     // line 36
$sheet = $spreadsheet->getActiveSheet();
$rows = $sheet->toArray(null, true, true, true);          // line 38 — every cell
```

and then loops all rows in PHP doing fuzzy header matching (lines 61-181). `execute()` then runs a per-row `Employee::where('file_no', …)->first()` inside one transaction, creating an N+1 write pattern where N is the row count.

For a 300-row sheet this is fine. For a 5,000-row master list (which is exactly the historical use case — `ImportExcelMasterListCommand` exists because they loaded a large workbook) it is:

- memory: `toArray()` on 5,000 × 40 cells ≈ tens of MB of PHP arrays, plus PhpSpreadsheet's own DOM (typically 5-10× the file size),
- time: 5,000 × (1 select + 1 insert + 1 salary insert + 1 leave insert + 1 audit insert) = 25,000 queries in one HTTP request,
- failure mode: PHP `max_execution_time`, and if it fails mid-transaction, the user sees a 504 with no indication of what was written.

There is also a **data-quality** defect: `preview()` and `execute()` are separate requests, and `execute()` trusts the `records` array the client posts back. The client could modify previewed rows between the two calls. Preview is advisory, not a contract.

### 9.2 Target design

```
app/
├── Jobs/
│   └── ProcessEmployeeImportJob.php
├── Imports/
│   ├── EmployeeImportService.php        // parse → validated DTO rows
│   ├── EmployeeImportRow.php            // readonly DTO
│   └── ImportSummary.php                // created/updated/skipped/errors
└── Models/
    └── ImportBatch.php                  // + migration
```

New migration:

```php
Schema::create('import_batches', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('original_filename');
    $table->string('stored_path');
    $table->string('status', 20)->default('queued')->index(); // queued|processing|completed|failed
    $table->unsignedInteger('total_rows')->default(0);
    $table->unsignedInteger('created_count')->default(0);
    $table->unsignedInteger('updated_count')->default(0);
    $table->unsignedInteger('skipped_count')->default(0);
    $table->json('errors')->nullable();
    $table->timestamp('started_at')->nullable();
    $table->timestamp('finished_at')->nullable();
    $table->timestamps();
});
```

Service parses into typed rows so invalid rows are rejected **before** any write:

```php
<?php
// app/Imports/EmployeeImportRow.php

namespace App\Imports;

final readonly class EmployeeImportRow
{
    public function __construct(
        public int $lineNumber,
        public string $fileNo,
        public string $fullName,
        public string $gender,
        public string $departmentName,
        public string $position,
        public string $workPlace,
        public float $basicSalary,
        public ?string $employmentDate,
        public ?string $employmentDateEc,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toActionPayload(int $departmentId): array
    {
        return [
            'file_no' => $this->fileNo,
            'full_name' => $this->fullName,
            'gender' => $this->gender,
            'department_id' => $departmentId,
            'position' => $this->position,
            'work_place' => $this->workPlace,
            'basic_salary' => $this->basicSalary,
            'employment_date' => $this->employmentDate ?? now()->toDateString(),
            'employment_date_ec' => $this->employmentDateEc ?? '2017-01-01',
            'employment_type' => 'Non-Managerial',
            'contract_type' => 'Permanent',
            'status' => 'Permanent',
        ];
    }
}
```

Job:

```php
<?php
// app/Jobs/ProcessEmployeeImportJob.php

namespace App\Jobs;

use App\Actions\Employees\RegisterEmployeeAction;
use App\Actions\Employees\UpdateEmployeeAction;
use App\Models\Employee;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;

class ProcessEmployeeImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $timeout = 900;
    public int $tries = 1;      // an import is not idempotent; do not retry blindly

    public function __construct(public readonly int $batchId) {}

    public function handle(EmployeeImportService $service, RegisterEmployeeAction $register, UpdateEmployeeAction $update): void
    {
        $batch = ImportBatch::findOrFail($this->batchId);
        $actor = User::findOrFail($batch->user_id);

        $batch->update(['status' => 'processing', 'started_at' => now()]);

        try {
            $rows = $service->parse($batch->stored_path);
            $batch->update(['total_rows' => $rows->count()]);

            $created = $updated = $skipped = 0;
            $errors = [];

            foreach ($rows->chunk(100) as $chunk) {
                DB::transaction(function () use ($chunk, $actor, $register, $update, &$created, &$updated, &$skipped, &$errors) {
                    foreach ($chunk as $row) {
                        $departmentId = Department::where('name', $row->departmentName)->value('id');

                        if ($departmentId === null) {
                            $skipped++;
                            $errors[] = "Line {$row->lineNumber}: unknown department '{$row->departmentName}'";

                            continue;
                        }

                        $existing = Employee::where('file_no', $row->fileNo)->first();

                        if ($existing) {
                            $update->execute($existing, $row->toActionPayload($departmentId), $actor);
                            $updated++;
                        } else {
                            $register->execute($row->toActionPayload($departmentId), $actor);
                            $created++;
                        }
                    }
                });

                $batch->update(compact('created_count', 'updated_count', 'skipped_count', 'errors'));
            }

            $batch->update([
                'status' => 'completed',
                'finished_at' => now(),
                'created_count' => $created,
                'updated_count' => $updated,
                'skipped_count' => $skipped,
                'errors' => $errors,
            ]);
        } catch (\Throwable $e) {
            $batch->update([
                'status' => 'failed',
                'finished_at' => now(),
                'errors' => [$e->getMessage()],
            ]);

            throw $e;
        }
    }
}
```

### 9.3 Deployment prerequisite — this will silently not work as written

Production has:

```
QUEUE_CONNECTION=sync      # .env.production
```

With `sync`, `ProcessEmployeeImportJob::dispatch()` executes **inline in the HTTP request**, which defeats the entire purpose. Before shipping this area you must:

1. Set `QUEUE_CONNECTION=database` (the `jobs` table already exists — migration `0001_01_01_000002_create_jobs_table.php`).
2. Run a supervised worker: `php artisan queue:work --tries=1 --timeout=900`.
3. Add a process supervisor (systemd unit or Laravel Cloud worker).
4. Verify with `php artisan queue:monitor`.

If you are not ready to run a worker, **do not ship this area.** A job that executes synchronously is strictly worse than the current code: it adds a `jobs` table row, a `ImportBatch` row, and indirection, while keeping the same timeout.

The pragmatic middle path if no worker is available: keep it synchronous but use `cursor()` reading and chunked transactions, so peak memory is bounded and a timeout leaves a consistent partial state with an `ImportBatch` record explaining what happened. That is a 1-day change and a real improvement even without a queue.

### 9.4 Also fix: preview must not be the source of truth

`execute()` currently accepts `records` from the client. Even after the job refactor, keep a server-side artefact:

- `preview()` stores the parsed rows in `import_batches` (or a cache entry keyed by batch id) and returns a `batch_id`.
- `execute()` posts only `{ batch_id }` and the job re-reads the server-side rows.

That closes the "client edits rows between preview and commit" gap, which is currently wide open and invisible.

### 9.5 Acceptance criteria

| Check | Before | After |
|---|---|---|
| Spreadsheet parse location | HTTP request | queue job |
| `toArray()` on full sheet | yes | no (row iterator) |
| Queries per row | 5 | 3 (with `upsert`-style batching, fewer) |
| Client can alter previewed rows before commit | yes | no |
| Partial-failure visibility | none | `import_batches.errors` |
| Peak memory | whole sheet | bounded by chunk size |

**Estimated effort:** 4–5 days (including worker setup), or 1 day for the synchronous-but-bounded variant.

---

## 10. Improvement Area 8 — Delete dead code before optimising bundles

**Severity: Medium (velocity).** This is the cheapest area in the document, and it corrects the prior audit's most expensive mistake: Gemini's Phase 1 spent two days lazy-loading a component that nothing imports.

### 10.1 Problem statement — measured dead weight

#### Dead `ui/*` components

56 files in `resources/js/Components/ui`. **34 have zero importers.** They account for **4,525 of 6,452 lines (70%)**.

```
accordion, alert, animated-theme-toggler, aspect-ratio, avatar, background-cubes-grid,
breadcrumb, button-group, carousel, collapsible, command, context-menu, drawer, empty,
field, form, hover-card, input-group, input-otp, item, kbd, menubar, navigation-menu,
pagination, radio-group, resizable, scroll-area, sidebar, skeleton, slider, spinner,
toggle, toggle-group, tooltip
```

Largest offenders: `background-cubes-grid.tsx` (847), `sidebar.tsx` (718), `chart.tsx` is **used** (do not delete), `carousel.tsx` (231), `menubar.tsx` (236), `field.tsx` (225).

#### Dead Breeze components

`PrimaryButton.tsx`, `TextInput.tsx`, `SecondaryButton.tsx`, `DangerButton.tsx`, `Checkbox.tsx`, `Modal.tsx` — **0 importers each**. Only `InputError.tsx` and `InputLabel.tsx` are live (8 files each), and both are trivially replaceable by `ui/` equivalents.

#### Dead npm dependencies — verified

| Package | Status |
|---|---|
| `three` (^0.187.0) | imported **only** by `background-cubes-grid.tsx`, which itself has 0 importers |
| `@types/three` | same |
| `zod` (^4.6.7) | imported **only** by `ui/form.tsx`, which has 0 importers |
| `react-hook-form` (^7.91.0) | same |
| `@hookform/resolvers` (^7.0.2) | same (and has 0 direct imports anywhere) |
| `@playwright/test` | installed, **no config, no specs** |

#### Bundle reality (measured, not assumed)

```
Dashboard-*.js              435.9 kB
app-*.js                    358.9 kB
AuthenticatedLayout-*.js    247.9 kB
app-*.css                   170.8 kB
Profile-*.js                 81.7 kB
calendar-*.js                70.0 kB
Edit-*.js                    53.9 kB
Create-*.js                  53.8 kB
Show-*.js                    49.1 kB
```

Two facts follow, and they contradict the prior audit:

1. **There is no `GuestLayout` chunk.** `GuestLayout.tsx` imports only `ThemeToggle`, `ApplicationLogo`, `Link`, `ShieldCheck` — no Three.js, no framer-motion. The login page is already light.
2. **`Dashboard` at 435.9 kB is not an outlier.** It is the only page with charts (`recharts`). 436 kB for a charting page in an internal HR tool, on a code-split route, is acceptable.

The **real** shared-chunk problem is `AuthenticatedLayout` at 247.9 kB, and its cause is:

```
AuthenticatedLayout.tsx
  ├── NotificationBell.tsx
  ├── WebPushBanner.tsx
  ├── DarkThemeSelector.tsx  →  framer-motion
  ├── ThemeToggle.tsx
  └── Navigation/SystemSettingsSidebar.tsx
```

`framer-motion` is in the dependency chain of **every authenticated page** because the theme selector uses it.

### 10.2 Implementation

#### Step 8.1 — Delete, in this order

```bash
# 1. Orphaned 3D background — 847 lines, and the only reason `three` is installed
rm resources/js/Components/ui/background-cubes-grid.tsx

# 2. Dead Breeze primitives — 6 files, 0 importers
rm resources/js/Components/PrimaryButton.tsx \
   resources/js/Components/TextInput.tsx \
   resources/js/Components/SecondaryButton.tsx \
   resources/js/Components/DangerButton.tsx \
   resources/js/Components/Checkbox.tsx \
   resources/js/Components/Modal.tsx

# 3. Dead shadcn components — run the audit script from Appendix A first,
#    then remove the 34 confirmed-unused files.
```

#### Step 8.2 — Remove the dead dependencies

```bash
npm uninstall three @types/three zod react-hook-form @hookform/resolvers
```

Then delete `resources/js/Components/ui/form.tsx` (the only consumer of the validation stack, itself unused).

**Verify** with a build and a `tsc` run:

```bash
npx tsc --noEmit
npm run build
```

If `tsc` fails, something imported a deleted file — which means the import scan was wrong, and you should investigate rather than re-adding the file.

#### Step 8.3 — Get `framer-motion` out of the shared layout

`DarkThemeSelector.tsx` is the only reason the layout pulls in an animation library. Two options:

**Option A (recommended):** the theme selector's animation is decorative. Replace its `motion.*` usage with CSS transitions (`transition-all duration-200`) and drop the import. The selector is a small popover of colour swatches; it does not need a physics engine.

```tsx
// before
<motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18 }}
>

// after
<div className="animate-in fade-in slide-in-from-top-2 duration-200">
```

`tailwindcss-animate` is already installed, so `animate-in` / `fade-in` / `slide-in-from-top-2` are available with no new dependency. (Note: `tailwindcss-animate` is currently unused per the import scan — but it is a Tailwind plugin consumed via `tailwind.config.js`, not an import, so it is live. Verify in `tailwind.config.js` before assuming.)

**Option B:** lazy-load the selector, since it only appears when the user opens the theme menu.

```tsx
const DarkThemeSelector = lazy(() => import('@/Components/DarkThemeSelector'));
```

Option B leaves framer-motion in the graph for anyone who opens the selector, but removes it from the initial chunk for everyone. Option A removes it entirely. Prefer A.

**Expected effect:** the `AuthenticatedLayout` chunk should drop from ~248 kB toward ~180 kB. Do not state a number until you measure — take the `dist/assets` sizes before and after and put them in the PR description.

#### Step 8.4 — Dashboard charts: measure before splitting

`Dashboard.tsx` statically imports `recharts` and `framer-motion`. Because Inertia already code-splits the page, the 436 kB only loads when an HR admin opens `/dashboard`. That is the correct behaviour.

Splitting the charts into `React.lazy()` components only helps if they are below the fold. At 1,073 lines the dashboard probably renders above-the-fold metric cards plus below-the-fold charts — so a lazy boundary around the chart grid is justified:

```tsx
const TenureDonut = lazy(() => import('./components/TenureDonut'));
const SiteBreakdownChart = lazy(() => import('./components/SiteBreakdownChart'));
```

But **do this after** the Area 4 decomposition, because splitting a 1,073-line file into lazy chunks is much harder than splitting a 90-line page into lazy components.

#### Step 8.5 — CSS bundle

`app-*.css` is 170.8 kB. For a Tailwind 3 build that means the content globs are close to correct but the purge is not removing everything (Tailwind 3 purges by default in production). Likely causes:

- `safelist` entries in `tailwind.config.js`,
- class strings built by concatenation (Tailwind cannot see them),
- the `@tailwindcss/forms` plugin's base styles.

Check `tailwind.config.js` first:

```bash
# Any safelist or dynamic class construction is the likely culprit
rg -n "safelist" tailwind.config.js
rg -n "className=\{[`'\"]" resources/js --count-matches | sort -t: -k2 -rn | head
```

A 170 kB CSS file is not a bug, but for a 30-page internal app it is larger than expected. Budget 100 kB and investigate if it grows.

#### Step 8.6 — Delete the `improvements.md` / `system-plan.md` archives from the repo root, or move them

The repo root currently contains `improvements.md` (11.9 kB), `system-plan.md` (**131 kB**), `DESIGN.nerdwallet.bak` (36 kB), `EMPLOYEE_LOGIN_CREDENTIALS.md` (27.7 kB), `Employee_Login_Credentials.xlsx`, `mapping_summary.txt`, `elhadar_deploy.tar.gz`, `update_2019.tar.gz`.

**`EMPLOYEE_LOGIN_CREDENTIALS.md` and the matching `.xlsx` are a credential leak in the repository.** Even if the passwords are temporary, a committed file listing employee credentials is a security incident waiting for the repo to be shared, forked, or pushed to a public remote. Check immediately:

```bash
git log --oneline -- EMPLOYEE_LOGIN_CREDENTIALS.md
git log --oneline -- Employee_Login_Credentials.xlsx
```

If they are tracked, removing them from `HEAD` is not enough — they remain in history. Rotate every password in that file, then consider history rewriting (`git filter-repo`) if the repo was ever pushed anywhere untrusted.

The `.tar.gz` files (1.0 MB and 628 kB) are deploy artefacts. They do not belong in version control.

### 10.3 Acceptance criteria

| Check | Before | After |
|---|---|---|
| `ui/*` files | 56 | 22 |
| Dead `ui/` lines | 4,525 | 0 |
| Breeze dead primitives | 6 | 0 |
| `three` in `package.json` | yes | no |
| `zod` / `react-hook-form` in `package.json` | yes | no |
| `framer-motion` in `AuthenticatedLayout` chain | yes | no |
| `AuthenticatedLayout` chunk | 247.9 kB | measured, target ≤ 180 kB |
| Credentials in repo | yes | removed + rotated |
| Deploy tarballs in repo | 2 | 0 |

**Estimated effort:** 1 day for deletions and dependency removal, plus the credential rotation (which is not a coding task and should not wait for the rest).

> **Do the credential check today.** It is independent of every other area in this document and has a non-zero chance of being an active problem.

---

## 11. Improvement Area 9 — The data model: canonical dates and one table that does too much

**Severity: Medium (data integrity), Low urgency (no live defect at 362 rows).** Do not rush this one. A schema split is the only area in this plan that cannot be shipped in a single reversible PR.

### 11.1 Problem statement

#### 9A — Ethiopian dates have no canonical form

```php
// 2026_10_29_000002_create_employees_table.php
$table->string('employment_date_ec', 20);   // not indexed, not typed, not validated
$table->string('birth_date_ec', 20)->nullable();
```

`employment_date_ec` is required (`NOT NULL`) but has no format contract. The codebase itself proves three formats are in use:

- `EmployeeController` lines 272-279 guard against `'=DATEDIF(...)'` and `'Year,'` — Excel formulas stored as text,
- `Profile.tsx:401` builds `DD/MM/YYYY E.C.` by splitting an ISO string,
- `ExcelImportExportController` templates ship `2016-05-07` (ISO),
- `Create.tsx` initialises `initialEcDate` as `` `${d}/${m}/${y}` `` (slash format).

So the same column holds `2016-05-07`, `07/05/2016`, and `=DATEDIF(...)` simultaneously. The two defensive guards are the symptom; the absence of a cast is the disease.

#### 9B — One table, 57 columns, six concerns

`employees` (57 columns) currently holds:

| Concern | Columns |
|---|---|
| Organisational identity | `file_no`, `employee_id_no`, `full_name`, `gender`, `department_id`, `position`, `work_place`, `employment_type`, `contract_type`, `status`, `grade`, `step` |
| Statutory milestone dates | `employment_date(_ec)`, `birth_date(_ec)`, `probation_end_date`, `probation_status`, `permanent_status_date`, `contract_end_date`, `retirement_date` |
| Demographics & address | `marital_status`, `phone`, `email`, `region`, `city`, `sub_city`, `woreda`, `house_no` |
| Emergency contact | `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone` |
| Education | `education_status`, `institution`, `graduation_year_ec`, `professional_license`, `cost_sharing_status` |
| Statutory identifiers & banking | `social_security_no`, `poessa_no`, `psssa_no`, `tin_no`, `bank_name`, `bank_account_no`, `plate_number` |
| Performance / misc | `company_experience`, `previous_experience`, `total_experience`, `performance_score_round_1`, `performance_score_round_2`, `disciplinary_action`, `remarks` |

That is not fatal — a wide `employees` table is a legitimate design for an HR master record, and splitting it aggressively creates join-heavy reads for the most common query (the directory list). But three groups are genuinely separable and cause real problems:

- **Experience columns are text.** `company_experience`, `previous_experience`, `total_experience` are `string(50)`. They hold `"=DATEDIF(...)"` (proven by the guards) and human strings like `"3 Years 2 Months"`. They are **not computable**. The code works around this by recomputing tenure at render time (`TenureCalculationService`) and overwriting the model attribute in the controller — which is why `EmployeeController::show()` mutates `$employee->company_experience` before serializing. That is a presentation concern leaking into a model attribute.

- **Migrations as data fixes.** `2026_11_05_092410_remove_dummy_abay_discrepancy_reports.php` deletes rows for a named employee with hardcoded bank numbers, and its `down()` is empty. Replaying migrations on a fresh database executes a deletion based on data that may not exist; replaying on an old database re-deletes. Neither is schema.

- **`retirement_date` is not backfilled.** It is `nullable` and only set on create/update. Any employee imported before that logic has `null` retirement date, which is why Area 6's scope had to use `birth_date` arithmetic.

### 11.2 Implementation

#### Step 9.1 — Canonical Ethiopian date format + cast

Decide once: **`YYYY-MM-DD` in the Ethiopian calendar**, stored in `varchar(10)`. Everything else is display.

```php
<?php
// app/Casts/EthiopianDate.php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * Stores an Ethiopian-calendar date as canonical YYYY-MM-DD.
 *
 * Accepts, on write:  YYYY-MM-DD | DD/MM/YYYY | array{year,month,day}
 * Emits, on read:     YYYY-MM-DD | null
 *
 * Never accepts Excel formulas; rejects anything that is not a valid
 * Ethiopian date triple.
 */
class EthiopianDate implements CastsAttributes
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $this->normalise((string) $value);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $this->normalise((string) $value);
    }

    private function normalise(string $value): ?string
    {
        $value = trim($value);

        // Reject spreadsheet formulas outright instead of storing them.
        if (str_starts_with($value, '=') || stripos($value, 'DATEDIF') !== false) {
            throw new InvalidArgumentException(
                "Refusing to store a spreadsheet formula in an Ethiopian date column: {$value}",
            );
        }

        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $value, $m)) {
            [, $year, $month, $day] = $m;
        } elseif (preg_match('/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/', $value, $m)) {
            [, $day, $month, $year] = $m;
        } else {
            return null;
        }

        $month = (int) $month;
        $day = (int) $day;
        $year = (int) $year;

        // Ethiopian calendar: 13 months, 30 days each, Pagume has 5 or 6.
        $maxDay = $month === 13 ? 6 : 30;

        if ($month < 1 || $month > 13 || $day < 1 || $day > $maxDay) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }
}
```

```php
// app/Models/Employee.php  — casts()
'employment_date_ec' => EthiopianDate::class,
'birth_date_ec' => EthiopianDate::class,
'graduation_year_ec' => EthiopianDate::class,   // if it is a full date; otherwise leave as string(4)
```

#### Step 9.2 — Backfill before enforcing

This is the step people skip and then break production. Do it in this exact order.

**1. Audit the existing data. It is 362 rows — inspect all of it.**

```sql
-- Distinct non-canonical shapes. Should return zero rows when clean.
SELECT employment_date_ec, COUNT(*) AS n
FROM employees
WHERE employment_date_ec NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
GROUP BY employment_date_ec
ORDER BY n DESC;
```

(On MySQL, use `REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'` instead of `GLOB`.)

**2. Write a one-off normaliser with a dry-run mode.** Not a migration.

```php
<?php
// app/Console/Commands/HrmsNormaliseEthiopianDates.php

namespace App\Console\Commands;

use App\Casts\EthiopianDate;
use App\Models\Employee;
use Illuminate\Console\Command;

class HrmsNormaliseEthiopianDates extends Command
{
    protected $signature = 'hrms:normalise-ethiopian-dates {--dry-run : Report changes without writing}';

    protected $description = 'Normalise Ethiopian calendar date columns to canonical YYYY-MM-DD';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $cast = new EthiopianDate();
        $changed = 0;
        $rejected = [];

        Employee::withTrashed()
            ->whereNotNull('employment_date_ec')
            ->chunkById(200, function ($employees) use ($cast, $dry, &$changed, &$rejected) {
                foreach ($employees as $employee) {
                    $raw = (string) $employee->getRawOriginal('employment_date_ec');

                    try {
                        $normalised = $cast->set($employee, 'employment_date_ec', $raw, []);
                    } catch (\InvalidArgumentException $e) {
                        $rejected[] = [$employee->id, $employee->file_no, $raw, $e->getMessage()];

                        continue;
                    }

                    if ($normalised === null) {
                        $rejected[] = [$employee->id, $employee->file_no, $raw, 'unparseable'];

                        continue;
                    }

                    if ($normalised !== $raw) {
                        $changed++;

                        if (! $dry) {
                            // Query builder write, bypassing the cast, so the
                            // canonical value lands exactly as computed.
                            Employee::withTrashed()
                                ->whereKey($employee->id)
                                ->toBase()
                                ->update(['employment_date_ec' => $normalised]);
                        }
                    }
                }
            });

        $this->table(
            ['id', 'file_no', 'raw', 'reason'],
            array_slice($rejected, 0, 50),
        );

        $this->info(($dry ? '[dry-run] ' : '')."Normalised {$changed} rows; {$rejectedProfile = count($rejected)} rejected.");

        return count($rejected) === 0 ? self::SUCCESS : self::FAILURE;
    }
}
```

**3. Run dry, fix rejects by hand, run for real, then add the cast.** The cast goes in only after `hrms:normalise-ethiopian-dates --dry-run` exits 0.

**4. Add a `NOT NULL`/format check constraint** (MySQL 8 supports `CHECK`):

```php
DB::statement("
    ALTER TABLE employees
    ADD CONSTRAINT chk_employment_date_ec_format
    CHECK (employment_date_ec REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
");
```

SQLite does not enforce `CHECK` the same way across versions and `REGEXP` is unavailable there, so guard it:

```php
if (DB::connection()->getDriverName() === 'mysql') {
    DB::statement(/* … */);
}
```

#### Step 9.3 — Replace the experience text columns with a computed accessor

Do **not** add a migration for this yet. First stop the leak:

```php
// app/Models/Employee.php — remove company_experience / previous_experience /
// total_experience from $fillable and from the serialized payload (Area 5 Resource).
```

Then expose tenure as a real value object via `TenureCalculationService`, which already computes it correctly. The three text columns become vestigial; drop them in a later migration once no code reads them.

If HR genuinely needs "previous experience" as an input (it is prior-service data that cannot be derived), keep **one** numeric column:

```php
$table->unsignedSmallInteger('prior_service_months')->nullable()->after('position')
    ->comment('Months of service before joining, used for leave seniority');
```

and compute total tenure as `prior_service_months + company tenure`. That is computable, sortable, and testable — unlike `"3 Years 2 Months"`.

#### Step 9.4 — Move the data-fix migration out of `database/migrations`

The `remove_dummy_abay_discrepancy_reports` migration is already applied in every existing environment. **Do not delete the file** — that breaks `migrate:status` on any environment that has run it. Instead:

1. Add a comment at the top marking it as a historical data correction.
2. Add the equivalent logic to a `hrms:cleanup-test-data` command, with a `--dry-run`, for any environment created fresh from `migrate:fresh` (where the dummy data would never exist anyway, making the migration a no-op).
3. Adopt the rule: **migrations only change schema.** Record it in `.ai/rules/` so agents follow it.

#### Step 9.5 — Backfill `retirement_date` and index it

```php
<?php
// app/Console/Commands/HrmsBackfillRetirementDates.php

public function handle(RetirementCalculationService $service): int
{
    $updated = 0;

    Employee::withTrashed()
        ->whereNotNull('birth_date')
        ->whereNull('retirement_date')
        ->chunkById(200, function ($employees) use ($service, &$updated) {
            foreach ($employees as $employee) {
                Employee::withTrashed()
                    ->whereKey($employee->id)
                    ->toBase()
                    ->update([
                        'retirement_date' => $service
                            ->calculateRetirementDate($employee->birth_date)
                            ->toDateString(),
                    ]);
                $updated++;
            }
        });

    $this->info("Backfilled {$updated} retirement dates.");

    return self::SUCCESS;
}
```

Once backfilled, Area 6's scope can use `whereBetween('retirement_date', …)`, which is a covering index range scan.

#### Step 9.6 — What **not** to do

Do not, in this pass:

- split `employees` into `employee_addresses`, `employee_emergency_contacts`, `employee_education`. It would touch every controller, every page, `PortalController`, `EmployeeController`, the import path, and every factory and test — and the payoff is organisational tidiness, not correctness. If you want it, do it as a deliberate project with its own spec once Areas 1-5 have stabilised the write path. Splitting a table is easy **after** there is one write path. It is dangerous before.
- rename columns. Every rename is a coordination event with the frontend, the imports, and the Excel exports. Not worth it now.
- convert `enum` columns to native DB enums. On MySQL, `ALTER TABLE … MODIFY ENUM` is a table rebuild, and adding a value (e.g. a new `status`) becomes a migration that locks. `string(20)` + a PHP enum cast is more flexible. If you want type safety, add `App\Enums\EmployeeStatus` and cast to it — you get the type safety without the lock.

### 11.3 Acceptance criteria

| Check | Before | After |
|---|---|---|
| Ethiopian date formats in DB | ≥ 3 | 1 (`YYYY-MM-DD`) |
| Excel formulas in date columns | possible | rejected at cast level |
| `str_contains($x, 'DATEDIF')` guards in controllers | 2 sites × 2 conditions | 0 |
| `employees.retirement_date` populated | partial | 100% of rows with `birth_date` |
| Data-correction logic in migrations | yes | no new ones; historical one documented |
| Experience columns sortable/computable | no | yes (`prior_service_months`) |

**Estimated effort:** 3–4 days, mostly the audit + dry-run cycle. The schema split is explicitly **out of scope**.

---

## 12. Improvement Area 10 — Quality gates: tests and lint that actually run

**Severity: Medium-High (compounding).** Every area above is a refactor. Refactors without a safety net are how the current mess happened. This area is what makes the other nine safe to execute.

### 12.1 Problem statement

**Backend: good.** 137 tests, 783 assertions, 22.9s. 22 feature files covering the risky domains. This is the single strongest asset in the repo.

**Frontend: zero.** No Vitest, no Jest, no Playwright config, no `test` script:

```json
"scripts": {
    "build": "tsc && vite build",
    "dev": "vite"
}
```

`@playwright/test` is installed but unused.

**Lint: zero.** No ESLint config, no Prettier config, no Biome. `vendor/bin/pint` is installed but CI never runs it.

**CI: partial.** `.github/workflows/deploy.yml` runs `composer validate`, `npm install`, `npm run build` (which does run `tsc`), and `php artisan test`. It does **not** run Pint, ESLint, or any frontend test.

### 12.2 What to test, in priority order

Do not aim for coverage. Aim for the four things that will actually break during the refactors above.

#### Priority 1 — Ethiopian calendar round-trip (pure function, 30 minutes to write)

`resources/js/lib/ethiopianDate.ts` (3.6 kB) is used by `Create`, `Edit`, `Profile`, `Leave/Index`, `Show`, and `EthiopianDatePicker`. A wrong conversion silently shifts employment dates by 8 years.

```ts
// resources/js/lib/ethiopianDate.test.ts
import { describe, expect, it } from 'vitest';
import { ecToGc, gcToEc, formatEthiopianDisplay } from './ethiopianDate';

describe('Ethiopian ⇄ Gregorian conversion', () => {
    it('converts Ethiopian New Year (Meskerem 1, 2017) to 11 Sep 2024', () => {
        expect(ecToGc('2017-01-01')).toBe('2024-09-11');
    });

    it('converts the day before New Year (Pagume 6, 2016) to 10 Sep 2024', () => {
        expect(ecToGc('2016-13-06')).toBe('2024-09-10');
    });

    it('round-trips every day across a leap year boundary', () => {
        // Walks 400 consecutive Gregorian days, asserting gc→ec→gc is identity.
        let cursor = new Date('2023-01-01T00:00:00Z');

        for (let i = 0; i < 400; i++) {
            const gc = cursor.toISOString().slice(0, 10);
            const ec = gcToEc(gc);
            expect(ec, `gcToEc(${gc})`).not.toBeNull();
            expect(ecToGc(ec as string), `round-trip via ${ec}`).toBe(gc);
            cursor = new Date(cursor.getTime() + 86_400_000);
        }
    });

    it('formats canonical EC as DD/MM/YYYY E.C.', () => {
        expect(formatEthiopianDisplay('2017-01-01')).toBe('01/01/2017 E.C.');
    });

    it('returns null for garbage instead of throwing', () => {
        expect(gcToEc('not-a-date')).toBeNull();
        expect(ecToGc('2017-13-07')).toBeNull();   // Pagume has at most 6 days
        expect(ecToGc('2017-14-01')).toBeNull();   // no 14th month
    });
});
```

The 400-day round-trip is the high-value test: it catches off-by-one errors in the Pagume leap rule, which is exactly the kind of bug that would otherwise surface as "an employee's retirement date is one day off."

#### Priority 2 — Payroll preview math must match the backend

The live preview in `Create.tsx:241-242` computes pension in TypeScript. The backend computes it in PHP. They must agree — and today they only agree because both hardcode 0.07/0.11.

```ts
// resources/js/lib/payroll.test.ts
import { describe, expect, it } from 'vitest';
import { computePension } from './payroll';

describe('client payroll preview', () => {
    const rates = { employee: 7, employer: 11 };

    it('matches the backend for a typical salary', () => {
        expect(computePension(18_500, rates)).toEqual({
            employee: 1_295,
            employer: 2_035,
        });
    });

    it('rounds half-pennies the same way PHP round() does', () => {
        // 1000.005 * 0.07 = 70.00035 → 70.0
        expect(computePension(1_000.005, rates).employee).toBe(70);
    });

    it('handles zero without NaN', () => {
        expect(computePension(0, rates)).toEqual({ employee: 0, employer: 0 });
    });
});
```

This requires extracting the two lines from `Create.tsx` into `lib/payroll.ts` first — which is the point. **A function you cannot test is a function that will drift.**

#### Priority 3 — Playwright smoke tests for the five critical flows

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : { command: 'php artisan serve --port=8000', url: 'http://127.0.0.1:8000', reuseExistingServer: true },
});
```

```ts
// tests/e2e/employee-onboarding.spec.ts
import { expect, test } from '@playwright/test';

test('HR admin can walk the 5-step registration wizard', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto('/login');
    await page.getByLabel(/phone|email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /log in/i }).click();

    await page.goto('/employees/create');
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();

    // Step 1 → 5 using whichever next button exists
    for (let step = 1; step <= 4; step++) {
        await page.getByRole('button', { name: /next|continue/i }).click();
    }

    await expect(page.getByText(/pre-flight|review/i)).toBeVisible();

    expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
});
```

The `expect(errors).toEqual([])` assertion is the part that matters. A 2,062-line component that throws during render still "looks fine" in a screenshot; a console-error assertion catches it.

Five flows worth covering:

1. login as each role (Employee → `/portal/profile`, Manager → `/employees`, Admin → `/dashboard`),
2. the 5-step registration wizard end to end,
3. portal profile loads and the leave request dialog opens,
4. employee directory filters and pagination,
5. Excel export downloads a file with a header row.

#### Priority 4 — Backend guards for the new invariants

Already specified inline in Areas 1, 3, 5, 6:

- `UnlinkedAccountTest` — the `Employee::first()` fix,
- `SettingsAreAuthoritativeTest` — the settings fix,
- `ResourceBoundaryTest` — the PII exposure fix,
- `WritePathParityTest` — the duplication fix,
- `LeaveBalanceConcurrencyTest` — the lost-update fix.

That is five tests that lock in five of the ten areas. Add them **with** the refactor, not after.

### 12.3 Tooling

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    resolve: { alias: { '@': path.resolve(__dirname, './resources/js') } },
    test: {
        environment: 'jsdom',
        include: ['resources/js/**/*.test.{ts,tsx}'],
        setupFiles: ['./tests/js/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['resources/js/lib/**', 'resources/js/hooks/**'],
            thresholds: { lines: 70, functions: 70, branches: 60 },
        },
    },
});
```

```ts
// tests/js/setup.ts
import '@testing-library/jest-dom/vitest';
```

```json
{
    "scripts": {
        "build": "tsc && vite build",
        "dev": "vite",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "test:e2e": "playwright test",
        "lint": "eslint resources/js --max-warnings=0",
        "format:check": "prettier --check resources/js"
    }
}
```

Coverage thresholds scoped to `lib/` and `hooks/` — **not** to `Pages/`. Chasing page coverage produces tests that assert implementation details and break on every refactor. Test the logic layer, smoke-test the pages.

ESLint:

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
    { ignores: ['public/build/**', 'resources/js/types/vite-env.d.ts'] },
);
```

Start with `no-explicit-any` as **warn** (there are 17 + 14 existing violations), fix them, then flip to `error`. Do not start at `error` or the lint gate will be disabled on day one.

### 12.4 CI

```yaml
# .github/workflows/deploy.yml — replace the test/build steps

      - name: PHP code style (Pint)
        run: vendor/bin/pint --test

      - name: Frontend type check
        run: npx tsc --noEmit

      - name: Frontend lint
        run: npm run lint

      - name: Frontend unit tests
        run: npm run test -- --reporter=verbose

      - name: Build frontend
        run: npm run build

      - name: Backend tests
        run: php artisan test --compact

      - name: Enforce page size budget
        run: |
          fail=0
          while IFS= read -r file; do
            lines=$(wc -l < "$file")
            if [ "$lines" -gt 400 ]; then
              echo "::error file=$file::Page exceeds 400 lines ($lines). See PLAN-CODEBASE-REMEDIATION.md §6."
              fail=1
            fi
          done < <(find resources/js/Pages -name '*.tsx')
          exit $fail
```

Add a separate nightly/manual Playwright job, not a per-PR one:

```yaml
  e2e:
    if: github.event_name == 'workflow_dispatch' || github.ref == 'refs/heads/main'
    # …
```

Per-PR E2E on a 5-minute suite is fine; on a flaky 20-minute suite it becomes the reason people stop trusting CI.

### 12.5 Acceptance criteria

| Check | Before | After |
|---|---|---|
| `npm test` | no such script | ≥ 20 unit tests passing |
| `lib/` coverage | 0 | ≥ 70% |
| Playwright specs | 0 | ≥ 5 |
| ESLint configured | no | yes, `--max-warnings=0` |
| Pint in CI | no | `--test` gate |
| `tsc` in CI | via `build` | explicit step |
| Page size budget enforced | no | yes (400, ratcheting to 250) |

**Estimated effort:** 3 days for the unit tests + config, 1 day for the E2E suite, 0.5 day for CI.

---

## 13. Execution roadmap

The ten areas are not independent. The dependency graph below is what determines the order, and getting it wrong is how refactors stall at 70% done.

```
Area 10 (tests/lint) ──┐
                       ├──► Area 1 (authz + integrity)  ──► Area 2 (one write path)
Area 8 (dead code) ────┘                                      │
                                                              ├──► Area 3 (rates)
                                                              │
                                                              ├──► Area 5 (types + resources) ──► Area 4 (components)
                                                              │                                     │
                                                              └──► Area 6 (queries) ◄───────────────┘
                                                                       │
                                                                       └──► Area 7 (import) ──► Area 9 (data model)
```

Reading the edges:

- **Area 8 has no dependencies and unblocks nothing dangerous.** Do it first because it makes every later diff smaller.
- **Area 10 must start early**, but only the parts you need. You do not need the full E2E suite before Area 1; you need it before Area 4.
- **Area 1 → Area 2** is a hard dependency: the Actions in Area 2 take a `User $actor`, which only exists cleanly once `$request->user()` is authoritative (no `Employee::first()` fallback).
- **Area 2 → Area 3** is a soft dependency: the rates refactor is easier once `PayrollCalculator` owns the math.
- **Area 5 → Area 4** is a hard dependency: you cannot share `useEmployeeFormState` between Create and Edit without a shared `EmployeeFormValues` type. Attempting Area 4 first means inventing a local type, then rewriting it.
- **Area 5 → Area 6** is a hard dependency for the `$appends` removal: removing `$appends` breaks any page still consuming raw models.
- **Area 7 → Area 9** is a soft dependency: the import is the biggest writer of un-canonical Ethiopian dates, so fixing ingestion first reduces the backfill surface.
- **Area 9 is a "whenever, carefully"** — it can run in parallel with Areas 4-7 by a different person, because it touches `database/`, `app/Casts/`, and `app/Console/Commands/` almost exclusively.

### 13.1 Phase plan

**Phase 0 — two days, no PR risk**

| # | Task | Why now |
|---|---|---|
| 0.1 | Audit `EMPLOYEE_LOGIN_CREDENTIALS.md` / `.xlsx` in git history; rotate if tracked | Security, independent of everything |
| 0.2 | Decide `.mcp.json`: add `codebase-memory-mcp` or delete the `AGENTS.md` block | Every future agent session is degraded until this is resolved |
| 0.3 | Add Pint `--test` + `tsc --noEmit` to CI | Free, catches style drift immediately |
| 0.4 | `npm install -D vitest`, add the `test` script, land the `ethiopianDate` round-trip test | 30 minutes, and it is the highest-value test in the repo |
| 0.5 | Delete the 34 dead `ui/*` files + 6 dead Breeze files + `three`/`zod`/`react-hook-form` | −4,525 lines, no behaviour change |

**Phase 1 — week 1: integrity**

| PR | Scope | Tests added |
|---|---|---|
| 1.1 | `User` role predicates; replace all 14 `in_array($user->role, …)` | `RoleAccessControlTest` extension |
| 1.2 | `EmployeePolicy`, `LeaveRequestPolicy`, `DataCorrectionReportPolicy`; `authorize()` in every FormRequest | policy unit tests |
| 1.3 | Remove `Employee::first()` ×3; add `Portal/UnlinkedAccount` | `UnlinkedAccountTest` (2 cases) |
| 1.4 | `StoreLeaveRequestRequest` + `StatutoryLeaveCalendar`; server-computed days | day-computation tests |
| 1.5 | `ApproveLeaveRequestAction` (transaction + lock + overdraft error) | `LeaveBalanceConcurrencyTest` |
| 1.6 | `ApproveCorrectionAction` + `applied_column`/`applied_at` migration + `FIELD_MAP` | correction validation tests |

End of week 1: the two "wrong money" paths are closed. This is the point where you can stop and still have a materially safer system.

**Phase 2 — week 2: one write path**

| PR | Scope | Tests added |
|---|---|---|
| 2.1 | `PayrollBreakdown`, `PayrollCalculator`, `StatutoryRates` | rate-parity unit tests |
| 2.2 | `EmployeeRules` trait; rewrite both FormRequests | validation parity test |
| 2.3 | `RegisterEmployeeAction`; `EmployeeController::store` delegates | `WritePathParityTest` |
| 2.4 | `UpdateEmployeeAction`; diff-only audit | audit-diff test |
| 2.5 | `RecordAuditLogAction`; replace 14 `AuditLog::create` | — |
| 2.6 | `ExcelImportExportController::execute` delegates; chunked transactions | import parity test |
| 2.7 | Move 4 import commands to `database/legacy-import/` with README | — |
| 2.8 | `SettingsAreAuthoritativeTest`; `StatutoryRates::flush()` in the settings controller | 3 tests |

End of week 2: there is exactly one way to create an employee, and the settings screen is truthful.

**Phase 3 — week 3: contract layer**

| PR | Scope |
|---|---|
| 3.1 | `resources/js/types/{employee,payroll,leave,portal,common}.ts` |
| 3.2 | `EmployeeListResource` + wire `Employees/Index` |
| 3.3 | `EmployeeResource` + wire `Employees/Show` |
| 3.4 | `EmployeeSelfResource` + wire `Portal/Profile` |
| 3.5 | `ResourceBoundaryTest` |
| 3.6 | Remove `Employee::$appends`; move to resources |

End of week 3: the frontend has types that come from somewhere, and Managers stop receiving bank account numbers.

**Phase 4 — weeks 4-5: frontend decomposition**

| PR | Scope | Target page size |
|---|---|---|
| 4.1 | `lib/format.ts` (one `formatCurrency`, one `formatEthiopianDisplay`); replace 10 copies | — |
| 4.2 | `useInertiaFilters`; migrate `Employees/Index`, `Announcements/Index`, `NewEmployees/Index` | −90 lines each |
| 4.3 | `Employees/shared/*` schema + field components | — |
| 4.4 | Split `Create.tsx` into `Create/index.tsx` + 5 steps + hook | 1,491 → ≤ 90 |
| 4.5 | Split `Edit.tsx` into sections reusing the shared fields | 1,692 → ≤ 120 |
| 4.6 | Split `Profile.tsx` into 4 panels + 4 dialogs + 2 hooks | 2,062 → ≤ 110 |
| 4.7 | Split `Dashboard.tsx` | 1,073 → ≤ 80 |
| 4.8 | Split `Employees/Index.tsx`, `Show.tsx`, `Leave/Index.tsx` | each ≤ 200 |
| 4.9 | Enable the 400-line CI budget | — |

End of week 5: no page exceeds ~250 lines and the budget prevents regression.

**Phase 5 — week 6: performance + data**

| PR | Scope |
|---|---|
| 5.1 | `scopeNearingRetirement`; dashboard `filter()` → SQL |
| 5.2 | `headcountStats()` single aggregate |
| 5.3 | Dashboard `Cache::remember` (metrics only) |
| 5.4 | `preventLazyLoading` + fix every violation it reveals |
| 5.5 | Export → `cursor()` |
| 5.6 | `NotificationBell` visibility-aware backoff |
| 5.7 | `EthiopianDate` cast + `hrms:normalise-ethiopian-dates --dry-run` |
| 5.8 | Backfill + `CHECK` constraint |
| 5.9 | `hrms:backfill-retirement-dates`; switch scope to `retirement_date` |
| 5.10 | Import job (only if a queue worker is provisioned) |

**Phase 6 — week 7: gate hardening**

| PR | Scope |
|---|---|
| 6.1 | ESLint config at `warn`, fix the 31 `any` sites, flip to `error` |
| 6.2 | Vitest coverage thresholds on `lib/` and `hooks/` |
| 6.3 | Playwright: 5 smoke flows |
| 6.4 | Ratchet page budget 400 → 250 |
| 6.5 | Delete the deploy tarballs, archive the planning docs out of the repo root |

**Total: ~7 weeks for one engineer, ~4 weeks for two working on disjoint areas (A: backend 1-3-6-7-9, B: frontend 4-5-8-10).**

### 13.2 Sequencing mistakes to avoid

| Tempting | Why it fails |
|---|---|
| "Let's split `Profile.tsx` first, it's the biggest" | You will have no shared types, no Resources, and no E2E test. The split will be right for today's props and wrong after Area 5 changes them. |
| "Let's add `preventLazyLoading` in Phase 0" | It will fail on unknown N+1s and block unrelated PRs. Add it in Phase 5 when you are already touching queries. |
| "Let's rewrite `Dashboard` with a charting library swap" | The 436 kB chunk is not the problem. The 30 queries are. Swapping `recharts` for something smaller changes nothing that hurts. |
| "Let's normalise the `employees` table" | Not in this plan, on purpose. One write path first (Area 2), then decide. |
| "Let's do the queue job now" | Production is `QUEUE_CONNECTION=sync`. Without a supervised worker, a queued job is a synchronous job with extra steps. |
| "Let's raise the page budget to 250 immediately" | It will fail on day one across 7 files and someone will disable it. Ratchet. |

---

## 14. The first five days, concretely

If you do nothing else from this document, do this. It is ordered by value-per-hour and every item is independently shippable.

**Day 1 (morning)**
1. `git log --oneline -- EMPLOYEE_LOGIN_CREDENTIALS.md Employee_Login_Credentials.xlsx` — determine exposure. If tracked, rotate.
2. Fix `.mcp.json` or `AGENTS.md` (the `codebase-memory-mcp` mismatch).

**Day 1 (afternoon)**
3. `npm install -D vitest jsdom @testing-library/jest-dom` + `vitest.config.ts` + `npm test`.
4. Write the `ethiopianDate` round-trip test. Run it. **If it fails, stop everything and fix the calendar** — that is a live payroll bug.
5. Add Pint `--test` and `tsc --noEmit` to CI.

**Day 2**
6. Delete the 34 dead `ui/*` files and 6 dead Breeze files. `npx tsc --noEmit` to confirm nothing broke.
7. `npm uninstall three @types/three zod react-hook-form @hookform/resolvers`. Rebuild.
8. Commit as `chore: remove 4,900 lines of dead frontend code`.

**Day 3**
9. Write `UnlinkedAccountTest` (two cases from §3.3 step 1.2). Watch both fail.
10. Remove the three `Employee::first()` fallbacks and add `Portal/UnlinkedAccount`. Watch both pass.

**Day 4**
11. Add `User::isAdmin()` / `isHRAdmin()` / `isManager()` / `isSysAdmin()`.
12. `rg "in_array\(\$user->role" app/` → replace all 14 with predicates. Suite must stay at 137+ green.

**Day 5**
13. `EmployeePolicy` + `authorize()` in `StoreEmployeeRequest` / `UpdateEmployeeRequest`.
14. `StatutoryRates` + `SettingsAreAuthoritativeTest`. Watch it fail (proving the settings are decorative), then make it pass.

By end of day 5 you will have: 4,900 fewer lines, a calendar that is proven correct, an identity bug that is closed, a policy layer that exists, and a settings screen that tells the truth. That is a materially better codebase, and none of it required a big-bang rewrite.

---

## 15. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Page-size CI budget is disabled after the first red build | High | Budget becomes theatre | Set at 400, ratchet later; document the reason in the workflow comment |
| `preventLazyLoading` surfaces 20 N+1s and blocks a sprint | Medium | Schedule slip | Do it in Phase 5, not Phase 0; fix incrementally, and remember it only throws outside production |
| `EthiopianDate` cast rejects existing rows and breaks Edit pages | Medium | Users cannot save | Always dry-run `hrms:normalise-ethiopian-dates` first; ship the cast only when dry-run exits 0 |
| Removing `$appends` blanks avatars across the app | High if done out of order | Visible regression | Do it **after** Area 5 Resources, one page at a time |
| Overdraft exception turns a currently-succeeding approval into a 422 | Medium | HR workflow interruption | Announce before deploy; add a "allow overdraft with reason" escape hatch if HR insists |
| `StatutoryRates` cache serves stale rates after a settings change | Medium | Payroll uses wrong rate for up to 1h | Ship `flush()` in the same PR; the third test in §5.3 enforces it |
| Component split introduces subtle UI regression | High | Trust loss | Playwright snapshot per page before splitting; move-only diffs; one component per commit |
| Queue job shipped with `QUEUE_CONNECTION=sync` | Medium | Worse than before | Gate Area 7 on a provisioned worker; add the check to the PR description template |
| `formatCurrency` normalisation changes `0.00 ETB` → `ETB 0.00` everywhere | Certain | Cosmetic churn on 10 pages | Call it out in the release note; or keep the old shape for zero and normalise only non-zero |
| Two engineers edit `Create.tsx` and `Edit.tsx` concurrently during Phase 4 | High | Painful conflicts | Serialise 4.4 and 4.5 on one engineer, or land the shared `Employees/shared/*` extraction first so the two files stop sharing content |

---

## 16. Conventions this codebase should adopt

Write these into `.ai/rules/` so agents and humans follow them without re-deriving them. `laravel-boost`'s `record-rule` tool is the right mechanism once you confirm it is available; otherwise a plain markdown file.

### 16.1 Backend

1. **Controllers do not contain business logic.** They validate (FormRequest), authorize (Policy), delegate (Action), and redirect or render. If a method exceeds 25 lines, something belongs in an Action.
2. **Every multi-model mutation is inside `DB::transaction`.** Creating an employee touches 3 tables; creating a leave approval touches 2. If you write more than one `->create(` or `->update()` in a method, wrap it.
3. **Money and statutory values come from `StatutoryRates`.** No literal `0.07`, `0.11`, `16`, or `60` in `app/`. This is greppable and should be grepped in review.
4. **Never `get()` a table to aggregate it in PHP.** Use SQL aggregates, `chunk`, `cursor`, or `lazy`.
5. **Payloads go through a Resource.** `Inertia::render('X', ['model' => $model])` is not allowed for models containing statutory identifiers or bank details.
6. **Migrations change schema.** Data corrections belong in an Artisan command with `--dry-run`.
7. **Authorization is a Policy, not an `in_array` on `role`.** Role predicates live on `User`.
8. **Every state transition writes an audit row** through `RecordAuditLogAction`, with the *diff*, not the full model.
9. **Type everything.** Explicit return types on every method (already the project convention per `AGENTS.md`), `readonly` constructor promotion for injected services, and `@return array{…}` shapes on array-returning methods.

### 16.2 Frontend

1. **A page is a composition shell.** ≤ 250 lines, hard ceiling. State and handlers live in `hooks/`, JSX in `components/`, both scoped to the feature directory.
2. **No domain type declarations inside page files.** Import from `@/types/*`.
3. **No hardcoded statutory constants.** Read from the shared Inertia `statutory` prop.
4. **Never trust a computed number from the client.** If the UI shows a total, the server recomputes it.
5. **Use `ui/` primitives only.** `InputError` / `InputLabel` are the last two Breeze survivors; migrate and delete.
6. **No new `any`.** If a third-party type is missing, write a narrow local interface.
7. **Formatting lives in `lib/format.ts`.** Currency, dates, phone numbers: one implementation each.
8. **Every list page uses `useInertiaFilters`.** Do not hand-roll URL sync again.

### 16.3 Suggested `.ai/rules` entries

```
.ai/rules/
├── index.md
├── backend/
│   ├── controllers.md        glob: app/Http/Controllers/**
│   ├── actions.md            glob: app/Actions/**
│   ├── models.md             glob: app/Models/**
│   ├── migrations.md         glob: database/migrations/**
│   └── statutory.md          glob: app/Services/**, app/Support/Statutory/**
├── frontend/
│   ├── pages.md              glob: resources/js/Pages/**
│   ├── components.md         glob: resources/js/Components/**
│   └── types.md              glob: resources/js/types/**
└── testing.md                glob: tests/**
```

Two rules worth writing verbatim:

> **`app/Http/Controllers/**`** — No statutory literal (`0.07`, `0.11`, `16`, `60`). No `Employee::first()`. No `->get()` followed by in-PHP aggregation. Mutations of 2+ models must be in an Action wrapped in a transaction.

> **`resources/js/Pages/**`** — Page file ≤ 250 lines. No inline domain interfaces. No `interface Props { employee: { …50 fields… } }`. Import from `@/types`.

---

## Appendix A — Reproducible measurement commands

Everything in this document can be re-measured. Run these after each phase and commit the numbers into the PR description.

### A.1 Largest files

```powershell
# Frontend
Get-ChildItem -Recurse -File -Filter *.tsx resources/js |
  ForEach-Object {
    [PSCustomObject]@{
      Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
      Path  = $_.FullName.Replace("$PWD\","")
    }
  } | Sort-Object Lines -Descending | Select-Object -First 25 | Format-Table -AutoSize

# Backend
$dirs = @('app','database','routes')
$files = foreach ($d in $dirs) { Get-ChildItem -Path $d -Recurse -File -Filter *.php }
$files | ForEach-Object {
  [PSCustomObject]@{
    Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    Path  = $_.FullName.Replace("$PWD\","")
  }
} | Sort-Object Lines -Descending | Select-Object -First 25 | Format-Table -AutoSize
```

### A.2 Dead `ui/*` components

```powershell
$comps = Get-ChildItem resources/js/Components/ui -File | ForEach-Object { $_.BaseName }
$usage = foreach ($c in $comps) {
  $count = (Get-ChildItem resources/js -Recurse -Include *.tsx |
    Select-String -Pattern "/ui/$c'" -SimpleMatch | Measure-Object).Count
  [PSCustomObject]@{ Component = $c; Imports = $count }
}
$usage | Where-Object { $_.Imports -eq 0 } | Sort-Object Component | Format-Table -AutoSize
"Unused: {0} of {1}" -f ($usage | Where-Object Imports -eq 0).Count, $usage.Count

# Dead lines
$dead = ($usage | Where-Object Imports -eq 0).Component
$total = 0
foreach ($c in $comps) {
  if ($dead -contains $c) {
    $total += (Get-Content "resources/js/Components/ui/$c.tsx" | Measure-Object -Line).Lines
  }
}
"Dead UI lines: $total"
```

### A.3 Dependency usage

```bash
# For each dependency, list the files that import it
npx depcheck
```

`depcheck` is a one-off (`npx`, no install) and reports unused dependencies and missing ones. Cross-check its output against the manual scan in §1.2, because `depcheck` does not understand Tailwind plugin config or PostCSS.

### A.4 Bundle composition

```bash
npm run build
Get-ChildItem public/build/assets -File |
  Sort-Object Length -Descending |
  Select-Object -First 20 @{n='KB';e={[math]::Round($_.Length/1KB,1)}}, Name |
  Format-Table -AutoSize
```

For per-chunk composition, install `rollup-plugin-visualizer` temporarily:

```ts
// vite.config.js (temporary)
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [laravel({ /* … */ }), react(), visualizer({ open: true, filename: 'build/stats.html' })]
```

### A.5 Statutory hardcodes

```bash
rg -n "0\.07|0\.11|STATUTORY_RETIREMENT_AGE|'entitled_days' => 16|=> 16\.0" app/
rg -n "0\.07|0\.11" resources/js/
```

Target: zero output from both.

### A.6 Role-check duplication

```bash
rg -n "in_array\(\s*\\\$user->role" app/
rg -n "role === 'SysAdmin'|role === 'HRAdmin'" app/
```

Target: zero.

### A.7 Query count on a page

```bash
# In a local environment only
php artisan tinker --execute '
DB::enableQueryLog();
app()->call([app(App\Http\Controllers\DashboardController::class), "index"]);
$log = DB::getQueryLog();
echo count($log) . " queries\n";
foreach ($log as $q) { echo substr($q["query"], 0, 120) . "\n"; }
'
```

Note this counts queries but not the HTTP-level shared props; add 2 for `HandleInertiaRequests`. Alternatively use Telescope/Debugbar, but neither is installed — the tinker snippet is the zero-install option.

### A.8 Schema inspection

```bash
php artisan db:table employees          # Laravel 11+ interactive table view
php artisan db:table --json employees   # if you need machine-readable output
```

Or via `laravel-boost`'s `database-schema` / `database-query` tools during an agent session.

---

## Appendix B — Dead code inventory (delete list)

### B.1 `resources/js/Components/ui/` — 0 importers, 4,525 lines

```
accordion.tsx                alert.tsx
animated-theme-toggler.tsx   aspect-ratio.tsx
avatar.tsx                   background-cubes-grid.tsx   ← 847 lines, imports `three`
breadcrumb.tsx               button-group.tsx
carousel.tsx                 collapsible.tsx
command.tsx                  context-menu.tsx
drawer.tsx                   empty.tsx
field.tsx                    form.tsx                    ← only consumer of zod/RHF
hover-card.tsx               input-group.tsx
input-otp.tsx                item.tsx
kbd.tsx                      menubar.tsx
navigation-menu.tsx          pagination.tsx
radio-group.tsx              resizable.tsx
scroll-area.tsx              sidebar.tsx                 ← 718 lines
skeleton.tsx                 slider.tsx
spinner.tsx                  toggle.tsx
toggle-group.tsx             tooltip.tsx
```

**Do not delete without re-running A.2:** `chart.tsx` (used by `Dashboard`), `calendar.tsx` (used, produces the 70 kB chunk), `tabs.tsx` (used by `Profile`), `date-picker.tsx`, `sonner.tsx`.

### B.2 `resources/js/Components/` — Breeze survivors with 0 importers

```
PrimaryButton.tsx
TextInput.tsx
SecondaryButton.tsx
DangerButton.tsx
Checkbox.tsx
Modal.tsx
```

Still live (migrate, then delete): `InputError.tsx` (8 files), `InputLabel.tsx` (8 files).

### B.3 npm packages

Verified dead:

```
three, @types/three                      → only background-cubes-grid.tsx
zod, react-hook-form, @hookform/resolvers → only ui/form.tsx
@playwright/test                          → no config, no specs (keep if you adopt §12)
```

Verify with `npx depcheck` before removing:

```
embla-carousel-react      (ui/carousel.tsx — dead)
input-otp                 (ui/input-otp.tsx — dead)
cmdk                      (ui/command.tsx — dead)
vaul                      (ui/drawer.tsx — dead)
react-resizable-panels    (ui/resizable.tsx — dead)
```

### B.4 Repository artefacts

```
elhadar_deploy.tar.gz              1.0 MB   deploy artefact
update_2019.tar.gz                 628 kB   data patch artefact
DESIGN.nerdwallet.bak              36 kB    stale design export
EMPLOYEE_LOGIN_CREDENTIALS.md      27.7 kB  ← credentials
Employee_Login_Credentials.xlsx    41.6 kB  ← credentials
mapping_summary.txt                8.5 kB   one-off import mapping notes
```

**Treat the two credential files as an incident, not a cleanup item.**

### B.5 One-off import commands (relocate, do not delete)

```
app/Console/Commands/ImportExcelMasterListCommand.php        515 lines
app/Console/Commands/ImportTerminatedEmployeesCommand.php    395 lines
app/Console/Commands/InsertTikemetEmployeesCommand.php       271 lines
app/Console/Commands/ImportAnnualLeaveCommand.php            106 lines
                                                     total 1,287 lines
```

Move to `database/legacy-import/` with the workbook hash and a README. Keep `ProcessSeparationsCommand` (82) and `SyncEmployeeUsersCommand` (48) — those are operational, not migration.

---

## Appendix C — File inventory (measured)

### C.1 Frontend, ≥ 300 lines

| Lines | File |
|---:|---|
| 2,062 | `Pages/Portal/Profile.tsx` |
| 1,692 | `Pages/Employees/Edit.tsx` |
| 1,491 | `Pages/Employees/Create.tsx` |
| 1,162 | `Pages/Employees/Index.tsx` |
| 1,116 | `Pages/Employees/Show.tsx` |
| 1,073 | `Pages/Dashboard.tsx` |
| 1,013 | `Pages/Leave/Index.tsx` |
| 847 | `Components/ui/background-cubes-grid.tsx` (dead) |
| 718 | `Components/ui/sidebar.tsx` (dead) |
| 644 | `Pages/Announcements/Create.tsx` |
| 621 | `Components/NoticeBoardWidget.tsx` |
| 558 | `Pages/Separations/Index.tsx` |
| 517 | `Pages/Announcements/Edit.tsx` |
| 505 | `Pages/Audit/Index.tsx` |
| 504 | `Pages/Import/Index.tsx` |
| 464 | `Pages/Contracts/Index.tsx` |
| 462 | `Pages/Promotions/Index.tsx` |
| 441 | `Pages/NewEmployees/Index.tsx` |
| 418 | `Pages/Announcements/Index.tsx` |
| 397 | `Components/NotificationBell.tsx` |
| 393 | `Pages/Training/Index.tsx` |
| 371 | `Layouts/AuthenticatedLayout.tsx` |
| 364 | `Pages/Probation/Index.tsx` |
| 341 | `Components/InteractiveTour.tsx` |
| 340 | `Components/ui/chart.tsx` (live) |
| 339 | `Components/AnnouncementAnalyticsDrawer.tsx` |
| 325 | `Components/AnnouncementReaderModal.tsx` |
| 318 | `Components/ui/animated-theme-toggler.tsx` (dead) |
| 314 | `Components/ExcelColumnFilter.tsx` |

Total frontend: **27,505 lines across 30 pages**.

### C.2 Backend, ≥ 150 lines

| Lines | File |
|---:|---|
| 515 | `Console/Commands/ImportExcelMasterListCommand.php` |
| 397 | `Http/Controllers/ExcelImportExportController.php` |
| 395 | `Console/Commands/ImportTerminatedEmployeesCommand.php` |
| 282 | `Services/NotificationCenterService.php` |
| 271 | `Console/Commands/InsertTikemetEmployeesCommand.php` |
| 263 | `Http/Controllers/EmployeeController.php` |
| 263 | `Http/Controllers/PortalController.php` |
| 249 | `Http/Controllers/AnnouncementController.php` |
| 217 | `Http/Controllers/SystemSettingController.php` |
| 192 | `Http/Controllers/DashboardController.php` |
| 178 | `Http/Controllers/LeaveBalanceController.php` |
| 168 | `Models/Employee.php` |
| 158 | `Models/Announcement.php` |

### C.3 Directory state

```
app/
├── Console/Commands/   7 commands
├── Http/
│   ├── Controllers/   19 controllers + 5 in Auth/
│   ├── Middleware/    3
│   └── Requests/      13 FormRequests + 1 in Auth/
├── Models/            ~20
├── Providers/
└── Services/          11

app/Policies/          DOES NOT EXIST
app/Actions/           DOES NOT EXIST
app/DTOs/              DOES NOT EXIST
app/Resources/         DOES NOT EXIST
app/Enums/             DOES NOT EXIST
app/Jobs/              DOES NOT EXIST
app/Events/            DOES NOT EXIST
app/Observers/         DOES NOT EXIST
```

---

## Appendix D — Architectural decision records to write

Four decisions in this plan are consequential enough to deserve a 1-page ADR each, so that in 18 months nobody "simplifies" them back into the bug.

**ADR-001 — Three resources for one Employee model.**
Context: `employees` holds PII and payroll identifiers. Three audiences read it. Decision: separate `EmployeeResource`, `EmployeeListResource`, `EmployeeSelfResource` rather than conditional fields. Consequence: more files, no leakage path.

**ADR-002 — Statutory rates live in `system_settings`, cached, and must be flushed on write.**
Context: rates were hardcoded in 10 places while a settings UI pretended to control them. Decision: one `StatutoryRates` facade, 1-hour cache, explicit flush. Consequence: a rate change takes effect within one flush; forgetting the flush is a test failure.

**ADR-003 — Migrations do not contain data corrections.**
Context: `remove_dummy_abay_discrepancy_reports` deletes rows by hardcoded values with an empty `down()`. Decision: schema only; data fixes are `hrms:*` commands with `--dry-run`. Consequence: fresh installs are reproducible, and corrections are auditable.

**ADR-004 — Pages are composition shells; the 250-line ceiling is enforced in CI.**
Context: seven files exceeded 1,000 lines; the largest was 2,062. Decision: enforce with a ratcheting budget rather than a policy document. Consequence: the build fails on the file that grows, not on the person who reviews it later.

---

## Appendix E — What I did *not* find (so you can stop worrying about it)

An audit that only lists problems is not calibrated. These were plausible-sounding risks that measurement disproved:

| Suspected problem | Reality |
|---|---|
| Three.js bloating the login page | `GuestLayout` never imported it. The component is orphaned. Delete it, done. |
| Login page bundle is heavy | There is no `GuestLayout` chunk. `Login.tsx` is 223 lines and uses `ui/` primitives. |
| Pages are eagerly bundled | `app.tsx` uses non-eager `import.meta.glob`. Route-level splitting already works. |
| `Create.tsx` and `Edit.tsx` are literal copy-paste | 9% exact-line overlap. The duplication is *field-level* (39/45), which is cheaper to fix than a line-level clone. |
| No service layer whatsoever | 11 services exist, several well-written. The gap is orchestration, not computation. |
| No backend tests | 137 tests, 783 assertions, 22.9s. Better than most codebases this size. |
| No CI | There is a workflow that installs PHP 8.4, builds, and tests. |
| TypeScript is untyped in practice | 0 `@ts-ignore`, 0 `console.log`, 31 `any` in 27,505 lines. |
| Dashboard causes memory exhaustion | 362 rows. The pattern is wrong; the current cost is negligible. |
| `Breeze` and `shadcn` are both actively used | Breeze is dead except `InputError`/`InputLabel`. |
| Migration chaos | 23 migrations, sensibly numbered. One data-fix migration. |
| Auth is broken | Sanctum + Breeze + phone-login, with `AuthenticationTest` and `PhoneLoginTest` passing. |

The codebase's actual problem is narrower than it feels when you are inside a 2,062-line file: **duplication along write paths, monoliths along read paths, and no gate that notices either.** That is a good problem to have, because it is fixable in seven weeks without a rewrite.

---

## 17. Summary

**Verify these three things before you start anything:**

1. `git log -- EMPLOYEE_LOGIN_CREDENTIALS.md` — if those credentials are in git history, that is the highest-priority item in this document and it is not a coding task.
2. `npm test` — it does not exist. Add Vitest and the `ethiopianDate` round-trip test before touching any component.
3. `.mcp.json` — either install `codebase-memory-mcp` or delete the `AGENTS.md` block that claims it is installed.

**Then fix the two things that can produce wrong money:**

- `PortalController` falling back to `Employee::first()` (three sites), and
- client-supplied statutory values (`requested_days`, unvalidated `bank_account_no` corrections).

**Then make there be one write path**, because that is what stops the divergence from growing while you are doing everything else.

**Then split the components**, types-first, one file per PR, with Playwright snapshots so a blank page cannot pass unnoticed.

**Do not rewrite.** The service layer is sound, the test suite is real, and the route-level code splitting already works. What is missing is discipline at the boundaries — and boundaries can be added incrementally, behind a green suite, without asking anyone to stop shipping features for two months.

---

*End of plan. All line counts, column counts, bundle sizes, dependency usages, and database row counts in this document were measured on 2026-11-08 against the working tree described in §0. Query-count figures marked as estimates are reasoned from source, not profiled, and are labelled as such.*
