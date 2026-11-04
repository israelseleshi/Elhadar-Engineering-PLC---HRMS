<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NewEmployeePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_new_employees_page(): void
    {
        $this->get('/new-employees')->assertRedirect('/login');
    }

    public function test_manager_can_access_new_employees_page(): void
    {
        $user = User::factory()->create(['role' => 'Manager']);

        $this->actingAs($user)->get('/new-employees')->assertOk();
    }

    public function test_employee_role_cannot_access_new_employees_page(): void
    {
        $user = User::factory()->create(['role' => 'Employee']);

        $this->actingAs($user)->get('/new-employees')
            ->assertRedirect(route('portal.profile'));
    }

    public function test_roster_only_includes_employees_hired_on_or_after_the_cutoff(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $included = Employee::factory()->create(['employment_date' => '2026-07-08']);
        Employee::factory()->create(['employment_date' => '2026-07-07']);

        $this->actingAs($user)->get('/new-employees')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('NewEmployees/Index')
                ->has('newHires.data', 1)
                ->where('newHires.data.0.id', $included->id)
                ->where('cutoff', '2026-07-08')
            );
    }

    public function test_roster_filters_by_department_and_status(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $engineering = Department::factory()->create(['name' => 'Engineering']);
        $finance = Department::factory()->create(['name' => 'Finance']);

        $probationer = Employee::factory()->probation()->create([
            'department_id' => $engineering->id,
            'employment_date' => '2026-08-01',
        ]);
        Employee::factory()->create([
            'department_id' => $finance->id,
            'employment_date' => '2026-08-01',
            'status' => 'Permanent',
        ]);

        $this->actingAs($user)->get('/new-employees?department_id='.$engineering->id.'&status=Probation')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('newHires.data', 1)
                ->where('newHires.data.0.id', $probationer->id)
            );
    }

    public function test_roster_search_matches_name_and_file_number(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $target = Employee::factory()->create([
            'full_name' => 'Abebe Kebede Wolde',
            'file_no' => 'Z-999',
            'employment_date' => '2026-09-01',
        ]);
        Employee::factory()->create(['employment_date' => '2026-09-01']);

        $this->actingAs($user)->get('/new-employees?search=Abebe')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('newHires.data', 1)
                ->where('newHires.data.0.id', $target->id)
            );

        $this->actingAs($user)->get('/new-employees?search=Z-999')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('newHires.data', 1)
                ->where('newHires.data.0.id', $target->id)
            );
    }

    public function test_roster_stats_are_scoped_to_the_cutoff(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        Employee::factory()->probation()->create(['employment_date' => '2026-08-01']);
        Employee::factory()->probation()->create(['employment_date' => '2026-09-01']);
        Employee::factory()->create(['employment_date' => '2026-10-01', 'status' => 'Permanent']);
        Employee::factory()->create(['employment_date' => '2026-01-01', 'status' => 'Probation']);

        $this->actingAs($user)->get('/new-employees')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.total_new_hires', 3)
                ->where('stats.probation_count', 2)
                ->where('stats.permanent_count', 1)
            );
    }
}
