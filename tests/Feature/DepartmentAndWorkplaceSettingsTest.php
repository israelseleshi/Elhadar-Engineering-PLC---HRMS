<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\ChatChannelMetadata;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\Workplace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DepartmentAndWorkplaceSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_hr_admin_can_view_settings_with_departments_and_workplaces(): void
    {
        $hrAdmin = User::factory()->hrAdmin()->create();
        $department = Department::factory()->create(['name' => 'Civil Engineering', 'code' => 'CIV']);
        $workplace = Workplace::factory()->create(['name' => 'Bishoftu Project', 'type' => 'Project']);
        Employee::factory()->create([
            'department_id' => $department->id,
            'work_place' => $workplace->name,
        ]);

        $response = $this->actingAs($hrAdmin)->get(route('settings.index'));

        $response->assertStatus(200);
        $response->assertInertia(function (Assert $page): void {
            $page->component('Settings/Index')
                ->has('groupedSettings')
                ->has('departments')
                ->has('workplaces', 1, fn (Assert $wp) => $wp
                    ->where('name', 'Bishoftu Project')
                    ->where('total_employees_count', 1)
                    ->etc()
                );

            $departments = collect($page->toArray()['props']['departments']);
            $civil = $departments->firstWhere('name', 'Civil Engineering');
            $this->assertNotNull($civil);
            $this->assertSame(1, $civil['total_employees_count']);
        });
    }

    public function test_manager_and_employee_cannot_mutate_departments_or_workplaces(): void
    {
        $manager = User::factory()->manager()->create();
        $employeeUser = User::factory()->employee()->create();
        $department = Department::factory()->create();
        $workplace = Workplace::factory()->create();

        $this->actingAs($manager)
            ->post(route('settings.workplaces.store'), ['name' => 'Unauthorized Site', 'type' => 'Project'])
            ->assertStatus(403);

        $this->actingAs($manager)
            ->post(route('settings.departments.store'), ['name' => 'Unauthorized Dept'])
            ->assertStatus(403);

        $this->actingAs($manager)
            ->delete(route('settings.workplaces.destroy', $workplace))
            ->assertStatus(403);

        $this->actingAs($employeeUser)
            ->put(route('settings.departments.update', $department), ['name' => 'Blocked Rename'])
            ->assertStatus(302);
    }

    public function test_hr_admin_can_create_rename_cascade_and_delete_workplace(): void
    {
        $hrAdmin = User::factory()->hrAdmin()->create();

        // Create
        $this->actingAs($hrAdmin)
            ->post(route('settings.workplaces.store'), [
                'name' => 'Adama Power Line',
                'code' => 'APL',
                'type' => 'Project',
                'location' => 'Adama, Ethiopia',
                'description' => 'Transmission corridor team',
                'is_active' => true,
            ])
            ->assertRedirect();

        $workplace = Workplace::where('name', 'Adama Power Line')->firstOrFail();
        $this->assertTrue($workplace->is_active);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'WORKPLACE_CREATE',
            'auditable_type' => Workplace::class,
            'auditable_id' => $workplace->id,
        ]);

        // Assign an employee and create an announcement targeting the workplace
        $employee = Employee::factory()->create(['work_place' => $workplace->name]);
        $announcement = Announcement::create([
            'title' => 'Safety Briefing',
            'content' => 'Mandatory briefing on Monday.',
            'category' => 'general',
            'priority' => 'standard',
            'status' => 'published',
            'target_type' => 'work_places',
            'target_work_places' => ['Adama Power Line', 'H.O'],
            'created_by' => $hrAdmin->id,
            'published_at' => now(),
            'is_active' => true,
        ]);

        // Rename cascades to employee & announcement targets
        $this->actingAs($hrAdmin)
            ->put(route('settings.workplaces.update', $workplace), [
                'name' => 'Adama Substation Phase II',
                'code' => 'APL-2',
                'type' => 'Project',
                'location' => 'Adama, Ethiopia',
                'description' => 'Updated project name',
                'is_active' => false,
            ])
            ->assertRedirect();

        $this->assertSame('Adama Substation Phase II', $employee->fresh()->work_place);
        $this->assertEquals(['Adama Substation Phase II', 'H.O'], $announcement->fresh()->target_work_places);

        // Deactivated workplace is hidden from onboarding, yet preserved on employee edit
        $activeOther = Workplace::factory()->create(['name' => 'H.O', 'type' => 'Head Office', 'is_active' => true]);

        $this->actingAs($hrAdmin)
            ->get(route('employees.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('workplaces', 1, fn (Assert $wp) => $wp->where('name', $activeOther->name)->etc())
            );

        $this->actingAs($hrAdmin)
            ->get(route('employees.edit', $employee))
            ->assertInertia(fn (Assert $page) => $page->has('workplaces', 2));

        // Deletion succeeds once no employees reference the workplace
        $unassigned = Workplace::factory()->create(['name' => 'Temporary Depot', 'type' => 'Project']);
        $this->actingAs($hrAdmin)
            ->delete(route('settings.workplaces.destroy', $unassigned))
            ->assertRedirect();

        $this->assertDatabaseMissing('workplaces', ['id' => $unassigned->id]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'WORKPLACE_DELETE',
            'auditable_type' => Workplace::class,
            'auditable_id' => $unassigned->id,
        ]);
    }

    public function test_workplace_deletion_is_blocked_when_active_or_soft_deleted_employees_reference_it(): void
    {
        $hrAdmin = User::factory()->hrAdmin()->create();
        $workplace = Workplace::factory()->create(['name' => 'Hawassa Plant']);
        $employee = Employee::factory()->create(['work_place' => $workplace->name]);
        $employee->delete();

        $this->actingAs($hrAdmin)
            ->delete(route('settings.workplaces.destroy', $workplace))
            ->assertSessionHasErrors('workplace');

        $this->assertDatabaseHas('workplaces', ['id' => $workplace->id]);
    }

    public function test_workplace_rejects_case_insensitive_duplicate_names_and_invalid_type(): void
    {
        $hrAdmin = User::factory()->hrAdmin()->create();
        Workplace::factory()->create(['name' => 'Modjo Dry Port']);

        $this->actingAs($hrAdmin)
            ->post(route('settings.workplaces.store'), [
                'name' => '  modjo dry port  ',
                'type' => 'Project',
            ])
            ->assertSessionHasErrors('name');

        $this->actingAs($hrAdmin)
            ->post(route('settings.workplaces.store'), [
                'name' => 'New Warehouse',
                'type' => 'InvalidType',
            ])
            ->assertSessionHasErrors('type');
    }

    public function test_hr_admin_can_create_update_and_delete_department_with_chat_sync(): void
    {
        $hrAdmin = User::factory()->hrAdmin()->create();

        $this->actingAs($hrAdmin)
            ->post(route('settings.departments.store'), [
                'name' => 'Geotechnical Survey',
                'code' => 'GEO',
                'description' => 'Soil and foundation testing',
                'is_active' => true,
            ])
            ->assertRedirect();

        $department = Department::where('name', 'Geotechnical Survey')->firstOrFail();
        $meta = ChatChannelMetadata::where('department_id', $department->id)->first();
        $this->assertNotNull($meta);
        $this->assertSame('Geotechnical Survey', $meta->name);

        // Rename department updates chat channel metadata
        $this->actingAs($hrAdmin)
            ->put(route('settings.departments.update', $department), [
                'name' => 'Geotechnical Engineering',
                'code' => 'GEOT',
                'description' => 'Expanded department scope',
                'is_active' => false,
            ])
            ->assertRedirect();

        $meta->refresh();
        $this->assertSame('Geotechnical Engineering', $meta->name);
        $this->assertFalse($department->fresh()->is_active);

        // Active filter on employees.create hides inactive department
        $activeDept = Department::factory()->create(['name' => 'Procurement', 'is_active' => true]);
        $this->actingAs($hrAdmin)
            ->get(route('employees.create'))
            ->assertInertia(function (Assert $page) use ($activeDept, $department): void {
                $ids = collect($page->toArray()['props']['departments'])->pluck('id')->all();
                $this->assertContains($activeDept->id, $ids);
                $this->assertNotContains($department->id, $ids);
            });

        // Delete unassigned department removes department and chat metadata
        $this->actingAs($hrAdmin)
            ->delete(route('settings.departments.destroy', $department))
            ->assertRedirect();

        $this->assertDatabaseMissing('departments', ['id' => $department->id]);
        $this->assertDatabaseMissing('chat_channel_metadata', ['department_id' => $department->id]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'DEPARTMENT_DELETE',
            'auditable_type' => Department::class,
            'auditable_id' => $department->id,
        ]);
    }

    public function test_department_deletion_is_blocked_when_employees_are_assigned(): void
    {
        $hrAdmin = User::factory()->hrAdmin()->create();
        $department = Department::factory()->create(['name' => 'Structural Design']);
        $employee = Employee::factory()->create(['department_id' => $department->id]);
        $employee->delete();

        $this->actingAs($hrAdmin)
            ->delete(route('settings.departments.destroy', $department))
            ->assertSessionHasErrors('department');

        $this->assertDatabaseHas('departments', ['id' => $department->id]);
    }
}
