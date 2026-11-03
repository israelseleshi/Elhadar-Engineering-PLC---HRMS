# Excel Import / Data Ingestion

## Overview

The HRMS imports the historical Elhadar Engineering master Excel workbook directly into normalized tables. The workbook has 9 sheets; the primary one is `All Permanent Employees` with 33 columns.

## Import flow

1. HR uploads an `.xlsx`/`.csv` via the `/import` flow.
2. The controller **dry-runs** the file: it parses rows, maps fuzzy headers to fields, validates required columns, and classifies rows as new, update, or error.
3. After review, HR executes the import. Rows are inserted/updated in a transaction with `AuditLog` entries for each change.
4. Department names are auto-created on first import (via `Department::firstOrCreate`).

## Column mapping

| Excel column | DB field | Notes |
|---|---|---|
| File No | `employees.file_no` | Unique business key (e.g. A-001) |
| Full Name | `employees.full_name` | |
| Department | `departments.name → department_id` | Normalized |
| Position | `employees.position` | |
| Work Place | `employees.work_place` | `Project` / `Head Office` |
| Gender | `employees.gender` | `Male` / `Female` |
| Basic Salary | `employee_salaries.basic_salary` | Decimal(12,2) |
| Employment Date | `employees.employment_date` | G.C. |
| Employment Date EC | `employees.employment_date_ec` | E.C. string |
| Annual Leave | `leave_balances.remaining_days` | Default 16 |
| Social Security No | `employees.social_security_no` | POESSA |
| Emergency Contact | `employees.emergency_contact_phone` | |
| Remarks | `employees.remarks` | |

## Date handling

- G.C. dates are parsed with Carbon and stored as `date` columns.
- E.C. dates are computed via `EthiopianCalendarService::toEthiopian()` from the G.C. date, or imported directly as E.C. strings.
- The template CSV can be downloaded from `/import/template`.

## Validation

The dry-run returns `summary` (new/update/error counts) and `error_records` with specific errors (e.g. missing File No, missing Full Name, bad date). Only rows with errors are flagged for review.
