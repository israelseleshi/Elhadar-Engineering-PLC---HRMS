# Dual-Calendar Engine

The application works primarily in the **Ethiopian Calendar (E.C.)** while storing all dates in standard Gregorian SQL columns.

## Ethiopian calendar facts

- 12 months × 30 days + a 13th month **Pagume** (5 days normal, 6 in leap).
- Leap year: `year % 4 === 3`.
- New Year (Enkutatash) = 11/12 September G.C.

## Conversions

Two E.C. ↔ G.C. conversion utilities are provided:

- `EthiopianCalendarService::toGregorian(year, month, day)` → Carbon
- `EthiopianCalendarService::toEthiopian(Carbon)` → `['year', 'month', 'day', 'formatted']`

All dates in employee records are stored as Gregorian `date` columns, with the E.C. equivalent exposed in the UI alongside them.

## UI display

- Date pickers have E.C./G.C. toggle modes.
- Table rows show E.C. date prominently with a muted tooltip of the Gregorian equivalent.
- Themigration schema stores both `employment_date_ec` (string) and `employment_date` (date) to enable this.
