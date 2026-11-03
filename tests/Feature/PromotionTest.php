<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\Promotion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PromotionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_promotions(): void
    {
        $response = $this->get('/promotions');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_promotions_ledger(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Engineering']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'position' => 'Senior Surveyor',
            'grade' => 'VIII',
        ]);

        Promotion::create([
            'employee_id' => $employee->id,
            'promotion_date' => now()->toDateString(),
            'promotion_date_ec' => '2017-02-19',
            'previous_position' => 'Junior Surveyor',
            'previous_grade' => 'VI',
            'previous_basic_salary' => 12000,
            'previous_total_salary' => 12000,
            'new_position' => 'Senior Surveyor',
            'new_grade' => 'VIII',
            'new_basic_salary' => 16000,
            'new_total_salary' => 16000,
            'remarks' => 'Annual performance evaluation merit advance',
        ]);

        $response = $this->actingAs($user)->get('/promotions');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Promotions/Index')
            ->has('promotions.data', 1)
            ->has('stats')
            ->has('activeEmployees')
            ->where('stats.total_promotions', 1)
        );
    }

    public function test_hr_admin_can_record_promotion_and_salary_advancement(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Design & Quality']);
        $employee = Employee::factory()->create([
            'department_id' => $dept->id,
            'position' => 'Junior Draftsman',
            'grade' => 'IV',
            'status' => 'Permanent',
        ]);

        EmployeeSalary::create([
            'employee_id' => $employee->id,
            'effective_date' => Carbon::now()->subYear()->toDateString(),
            'basic_salary' => 9500,
            'total_salary' => 9500,
            'is_current' => true,
        ]);

        $response = $this->actingAs($user)->post('/promotions', [
            'employee_id' => $employee->id,
            'promotion_date' => now()->toDateString(),
            'new_position' => 'Associate Civil Engineer',
            'new_grade' => 'VII',
            'new_basic_salary' => 15500,
            'new_total_salary' => 15500,
            'remarks' => 'Earned BSc degree and passed technical assessment',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('promotions', [
            'employee_id' => $employee->id,
            'new_position' => 'Associate Civil Engineer',
            'new_grade' => 'VII',
            'previous_position' => 'Junior Draftsman',
            'previous_basic_salary' => 9500,
            'new_basic_salary' => 15500,
        ]);

        $employee->refresh();
        $this->assertEquals('Associate Civil Engineer', $employee->position);
        $this->assertEquals('VII', $employee->grade);

        // Verify old salary is no longer current and new salary record exists
        $currentSalary = $employee->currentSalary;
        $this->assertNotNull($currentSalary);
        $this->assertEquals(15500, (float) $currentSalary->basic_salary);
        $this->assertTrue((bool) $currentSalary->is_current);

        // Old salary should be archived
        $previousSalaries = $employee->salaries()->where('is_current', false)->get();
        $this->assertCount(1, $previousSalaries);
        $this->assertEquals(9500, (float) $previousSalaries->first()->basic_salary);
    }
}
