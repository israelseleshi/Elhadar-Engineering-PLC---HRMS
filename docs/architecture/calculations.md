# Statutory Calculation Engine

The system implements the Ethiopian statutory formulas from Labour Proclamation No. 1156/2019 and Pension Proclamation No. 1268/2022.

## Probation (Art. 11)

- **Non-managerial:** 60 working days, excluding Sundays (and statutory holidays). Working days = Mon–Sat.
- **Managerial:** 90 calendar days (corporate policy, Art. 4 exemption).
- End date is stored in `probation_end_date`; status tracked as `Pending` / `Passed` / `Failed` / `Extended`.

## Tenure

- `tenure_days = current_date - employment_date`, excluding unpaid leaves.
- Formatted as `Y years, M months, D days`. Used for leave accrual and severance.

## Annual leave (Art. 77)

- Base: 16 working days for the first full year.
- Increment: +1 day per additional 2 full years of service.

## Severance (Arts. 39–41)

- `daily_wage = basic_salary / 30`
- Year 1 = 1 month basic wage; each subsequent year = 1/3 of monthly basic.
- Cap: 12 × monthly basic wage.

## Retirement (Art. 19)

- Mandatory retirement age = 60. A warning is triggered 90 days before the 60th birthday.

## Turnover

- `turnover_rate = (separations_in_period / average_headcount) × 100`
