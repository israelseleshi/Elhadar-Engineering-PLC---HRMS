<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    /**
     * Default legal and statutory parameters per Ethiopian proclamations.
     */
    protected array $defaultParameters = [
        // Pension Proclamation 1268/2022
        'pension_employee_rate' => [
            'value' => '7.0',
            'type' => 'float',
            'category' => 'Pension Proclamation No. 1268/2022',
            'article' => 'Art. 18(1)',
            'description' => 'Mandatory employee private organization pension contribution percentage deducted from basic wage.',
            'unit' => '%',
        ],
        'pension_employer_rate' => [
            'value' => '11.0',
            'type' => 'float',
            'category' => 'Pension Proclamation No. 1268/2022',
            'article' => 'Art. 18(2)',
            'description' => 'Mandatory employer counterpart pension contribution percentage on employee basic wage.',
            'unit' => '%',
        ],
        'statutory_retirement_age' => [
            'value' => '60',
            'type' => 'integer',
            'category' => 'Pension Proclamation No. 1268/2022',
            'article' => 'Art. 19',
            'description' => 'Statutory retirement age threshold in years triggering automatic pension eligibility.',
            'unit' => 'Years',
        ],
        'retirement_notification_lead_days' => [
            'value' => '90',
            'type' => 'integer',
            'category' => 'Pension Proclamation No. 1268/2022',
            'article' => 'Directive POESSA/2022',
            'description' => 'Prior notification window in calendar days before employee turns 60 to initiate pension filing.',
            'unit' => 'Days',
        ],

        // Labour Proclamation 1156/2019
        'probation_max_working_days_non_managerial' => [
            'value' => '60',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 11',
            'description' => 'Maximum statutory probationary period in working days (excluding Sundays and official public holidays).',
            'unit' => 'Working Days',
        ],
        'probation_max_calendar_days_managerial' => [
            'value' => '90',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Executive Directive',
            'description' => 'Statutory probation window in calendar days for managerial and executive personnel.',
            'unit' => 'Days',
        ],
        'annual_leave_base_days' => [
            'value' => '16',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 77(1)',
            'description' => 'Base statutory annual leave entitlement for the initial first year of continuous employment.',
            'unit' => 'Days',
        ],
        'annual_leave_service_step_years' => [
            'value' => '2',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 77(2)',
            'description' => 'Continuous service increment interval in completed years required for additional leave day.',
            'unit' => 'Years',
        ],
        'annual_leave_service_step_days' => [
            'value' => '1',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 77(2)',
            'description' => 'Additional statutory working day of annual leave granted for every service step completed.',
            'unit' => 'Day / Step',
        ],
        'severance_year_one_days' => [
            'value' => '30',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 39(1)',
            'description' => 'Severance wage entitlement in basic days for the first completed year of continuous service.',
            'unit' => 'Days Base',
        ],
        'severance_subsequent_year_fraction' => [
            'value' => '33.33',
            'type' => 'float',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 39(1)(b)',
            'description' => 'Percentage of monthly basic wage added for each subsequent year of service (1/3 of monthly salary).',
            'unit' => '% of Monthly Basic',
        ],
        'severance_cap_months' => [
            'value' => '12',
            'type' => 'integer',
            'category' => 'Labour Proclamation No. 1156/2019',
            'article' => 'Art. 40',
            'description' => 'Statutory absolute upper cap on severance payout in multiples of monthly basic salary.',
            'unit' => 'Months Basic',
        ],

        // Corporate & Fiscal
        'active_fiscal_year_ec' => [
            'value' => '2017/2018',
            'type' => 'string',
            'category' => 'Corporate & Fiscal Parameters',
            'article' => 'Fiscal Directive',
            'description' => 'Current operating Ethiopian Fiscal Calendar period applied across payroll and leave cycles.',
            'unit' => 'E.C.',
        ],
        'new_hire_cutoff_date' => [
            'value' => '2026-07-08',
            'type' => 'string',
            'category' => 'Corporate & Fiscal Parameters',
            'article' => 'Fiscal Directive',
            'description' => 'Earliest employment date (G.C.) included in the New Employees onboarding roster; defaults to Hamle 1, 2018 E.C.',
            'unit' => 'Date',
        ],
        'company_registered_name' => [
            'value' => 'Elhadar Engineering PLC',
            'type' => 'string',
            'category' => 'Corporate & Fiscal Parameters',
            'article' => 'Commercial Registry',
            'description' => 'Official registered enterprise title on contract agreements and statutory tax submissions.',
            'unit' => 'Text',
        ],
    ];

    /**
     * Display the statutory parameter registry.
     */
    public function index(): Response
    {
        // Ensure defaults are populated in DB
        foreach ($this->defaultParameters as $key => $meta) {
            $existing = SystemSetting::where('key', $key)->first();
            if (! $existing) {
                SystemSetting::create([
                    'key' => $key,
                    'value' => $meta['value'],
                    'data_type' => $meta['type'],
                    'description' => $meta['description'],
                ]);
            }
        }

        $allSettings = SystemSetting::all()->keyBy('key');

        $grouped = [];
        foreach ($this->defaultParameters as $key => $meta) {
            $currentVal = $allSettings->has($key) ? $allSettings[$key]->value : $meta['value'];
            $cat = $meta['category'];
            $grouped[$cat][] = [
                'key' => $key,
                'value' => $currentVal,
                'data_type' => $meta['type'],
                'article' => $meta['article'],
                'description' => $meta['description'],
                'unit' => $meta['unit'],
            ];
        }

        return Inertia::render('Settings/Index', [
            'groupedSettings' => $grouped,
        ]);
    }

    /**
     * Update statutory parameters and write to audit trail.
     */
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['required'],
        ]);

        $oldValues = [];
        $newValues = [];

        foreach ($data['settings'] as $key => $value) {
            $setting = SystemSetting::where('key', $key)->first();
            if ($setting) {
                if ((string) $setting->value !== (string) $value) {
                    $oldValues[$key] = $setting->value;
                    $setting->update(['value' => (string) $value]);
                    $newValues[$key] = (string) $value;
                }
            } else {
                SystemSetting::create([
                    'key' => $key,
                    'value' => (string) $value,
                    'data_type' => is_numeric($value) ? (str_contains((string) $value, '.') ? 'float' : 'integer') : 'string',
                    'description' => $key,
                ]);
                $newValues[$key] = (string) $value;
            }
        }

        if (! empty($newValues)) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'SETTINGS_UPDATE',
                'auditable_type' => SystemSetting::class,
                'auditable_id' => null,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return back()->with('success', 'Statutory parameters successfully updated and archived to audit log.');
    }
}
