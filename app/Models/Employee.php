<?php

namespace App\Models;

use App\Observers\EmployeeObserver;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy([EmployeeObserver::class])]
class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'file_no',
        'employee_id_no',
        'full_name',
        'gender',
        'education_status',
        'institution',
        'graduation_year_ec',
        'professional_license',
        'cost_sharing_status',
        'department_id',
        'position',
        'work_place',
        'company_experience',
        'previous_experience',
        'total_experience',
        'performance_score_round_1',
        'performance_score_round_2',
        'disciplinary_action',
        'employment_type',
        'contract_type',
        'employment_date_ec',
        'employment_date',
        'birth_date_ec',
        'birth_date',
        'probation_end_date',
        'probation_status',
        'permanent_status_date',
        'contract_end_date',
        'retirement_date',
        'status',
        'grade',
        'step',
        'social_security_no',
        'poessa_no',
        'psssa_no',
        'marital_status',
        'phone',
        'email',
        'region',
        'city',
        'sub_city',
        'woreda',
        'house_no',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone',
        'tin_no',
        'bank_name',
        'bank_account_no',
        'plate_number',
        'remarks',
        'profile_photo_path',
    ];

    protected $appends = [
        'profile_photo_url',
        'age',
    ];

    protected function casts(): array
    {
        return [
            'employment_date' => 'date:Y-m-d',
            'birth_date' => 'date:Y-m-d',
            'probation_end_date' => 'date:Y-m-d',
            'permanent_status_date' => 'date:Y-m-d',
            'contract_end_date' => 'date:Y-m-d',
            'retirement_date' => 'date:Y-m-d',
        ];
    }

    protected function age(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->birth_date ? Carbon::parse($this->birth_date)->age : null
        );
    }

    protected function profilePhotoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->profile_photo_path
                ? asset('storage/'.$this->profile_photo_path)
                : null
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(EmployeeSalary::class);
    }

    public function currentSalary(): HasOne
    {
        return $this->hasOne(EmployeeSalary::class)->where('is_current', true)->latestOfMany();
    }

    public function trainingRecords(): HasMany
    {
        return $this->hasMany(TrainingRecord::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function currentLeaveBalance(): HasOne
    {
        $year = (int) date('Y');

        return $this->hasOne(LeaveBalance::class)->where('leave_year', $year);
    }

    public function separation(): HasOne
    {
        return $this->hasOne(Separation::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function contractRenewals(): HasMany
    {
        return $this->hasMany(ContractRenewal::class);
    }

    public function dataCorrectionReports(): HasMany
    {
        return $this->hasMany(DataCorrectionReport::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * Determine whether this employee belongs to the managerial staff tier:
     * Division Head, Department Manager, Director, DCEO, Chief Officer, or CEO.
     */
    public function isManagerial(): bool
    {
        if (! $this->position) {
            return false;
        }

        $pos = trim($this->position);

        if (strcasecmp($pos, 'Chief Surveyor') === 0) {
            return false;
        }

        return (bool) preg_match('/(\bCEO\b|\bDCEO\b|Chief\s+.*Officer|Director|Departm.*Manager|Development\s+Manager|Division\s+(Head|Manager))/i', $pos);
    }

    /**
     * Get the standardized managerial classification level.
     */
    public function getManagerialLevel(): ?string
    {
        if (! $this->position) {
            return null;
        }

        $pos = trim($this->position);

        if (strcasecmp($pos, 'Chief Surveyor') === 0) {
            return null;
        }

        if (preg_match('/\bCEO\b/i', $pos) && ! preg_match('/\bDCEO\b/i', $pos)) {
            return 'CEO';
        }
        if (preg_match('/\bDCEO\b/i', $pos)) {
            return 'DCEO';
        }
        if (preg_match('/Chief\s+.*Officer/i', $pos)) {
            return 'Chief Officer';
        }
        if (preg_match('/Director/i', $pos)) {
            return 'Director';
        }
        if (preg_match('/(Departm.*Manager|Development\s+Manager)/i', $pos)) {
            return 'Department Manager';
        }
        if (preg_match('/Division\s+(Head|Manager)/i', $pos)) {
            return 'Division Head';
        }

        return null;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'Separated');
    }

    public function scopePermanent($query)
    {
        return $query->where('status', 'Permanent');
    }

    public function scopeProbationary($query)
    {
        return $query->where('status', 'Probation');
    }

    public function scopeProjectStaff($query)
    {
        return $query->where('work_place', 'Project');
    }

    public function scopeHeadOfficeStaff($query)
    {
        return $query->where('work_place', 'Head Office');
    }
}
