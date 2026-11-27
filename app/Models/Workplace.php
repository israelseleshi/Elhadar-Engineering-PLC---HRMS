<?php

namespace App\Models;

use Database\Factories\WorkplaceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Workplace extends Model
{
    /** @use HasFactory<WorkplaceFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'location',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'work_place', 'name');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Get active workplaces formatted for employee assignment forms,
     * optionally preserving a legacy/inactive value already assigned to an employee.
     *
     * @return Collection<int, array{id: int|null, name: string, type: string, code: string|null}>
     */
    public static function selectableOptions(?string $includeCurrent = null): Collection
    {
        $options = static::active()
            ->orderByRaw("CASE WHEN type = 'Head Office' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'code'])
            ->map(fn (self $wp): array => [
                'id' => $wp->id,
                'name' => $wp->name,
                'type' => $wp->type,
                'code' => $wp->code,
            ]);

        if ($includeCurrent !== null && trim($includeCurrent) !== '') {
            $trimmed = trim($includeCurrent);
            if (! $options->contains(fn (array $item): bool => $item['name'] === $trimmed)) {
                $existing = static::where('name', $trimmed)->first(['id', 'name', 'type', 'code']);
                $options->push([
                    'id' => $existing?->id,
                    'name' => $trimmed,
                    'type' => $existing?->type ?? (in_array(strtolower($trimmed), ['h.o', 'head office', 'ho'], true) ? 'Head Office' : 'Project'),
                    'code' => $existing?->code,
                ]);
            }
        }

        return $options->values();
    }

    /**
     * Merge managed workplace names with distinct employee work_place strings for filters and targeting.
     *
     * @return Collection<int, string>
     */
    public static function allDistinctNames(): Collection
    {
        $managed = static::orderBy('name')->pluck('name');
        $assigned = Employee::whereNotNull('work_place')
            ->where('work_place', '!=', '')
            ->distinct()
            ->pluck('work_place');

        return $managed->merge($assigned)
            ->map(fn (mixed $name): string => trim((string) $name))
            ->filter()
            ->unique()
            ->sort()
            ->values();
    }
}
