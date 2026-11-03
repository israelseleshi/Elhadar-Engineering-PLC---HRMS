<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExcelImportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_import_or_export(): void
    {
        $response = $this->get('/import');
        $response->assertRedirect('/login');

        $responseExport = $this->get('/export/employees');
        $responseExport->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_import_center(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Engineering']);
        Employee::factory()->count(3)->create(['department_id' => $dept->id]);

        $response = $this->actingAs($user)->get('/import');

        $response->assertRedirect(route('employees.index', ['openImport' => 'true']));
    }

    public function test_user_can_download_import_template(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);

        $response = $this->actingAs($user)->get('/import/template');

        $response->assertOk();
        $response->assertHeader('Content-Disposition', 'attachment; filename="Elhadar_HRMS_Import_Template.csv"');
    }

    public function test_user_can_download_employee_export_csv(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Surveying']);
        Employee::factory()->create([
            'department_id' => $dept->id,
            'file_no' => 'SRV-888',
            'full_name' => 'Tewodros Kassahun',
            'status' => 'Permanent',
        ]);

        $response = $this->actingAs($user)->get('/export/employees?status=Permanent');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename=', $response->headers->get('Content-Disposition'));
    }

    public function test_user_can_commit_spreadsheet_records_with_audit_trail(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Project Operations']);

        $payload = [
            'records' => [
                [
                    'file_no' => 'IMP-001',
                    'full_name' => 'Biruk Assefa',
                    'department_id' => $dept->id,
                    'position' => 'Senior Site Supervisor',
                    'work_place' => 'Project',
                    'gender' => 'Male',
                    'employment_type' => 'Non-Managerial',
                    'contract_type' => 'Permanent',
                    'status' => 'Permanent',
                    'employment_date' => '2024-03-01',
                    'employment_date_ec' => '2016-06-22',
                    'basic_salary' => 17500,
                ],
            ],
        ];

        $response = $this->actingAs($user)->post('/import/execute', $payload);

        $response->assertRedirect('/employees');

        $emp = Employee::where('file_no', 'IMP-001')->first();
        $this->assertNotNull($emp);
        $this->assertEquals('Biruk Assefa', $emp->full_name);
        $this->assertEquals(17500, (float) $emp->currentSalary->basic_salary);
        $this->assertEquals(1225, (float) $emp->currentSalary->pension_employee); // 7%

        // Verify AuditLog written
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'IMPORT_CREATE',
            'auditable_type' => Employee::class,
            'auditable_id' => $emp->id,
        ]);
    }

    public function test_employee_export_csv_includes_sections_6_7_and_8_columns(): void
    {
        $user = User::factory()->create(['role' => 'HRAdmin']);
        $dept = Department::factory()->create(['name' => 'Surveying']);
        Employee::factory()->create([
            'department_id' => $dept->id,
            'file_no' => 'SRV-999',
            'full_name' => 'Tewodros Kassahun',
            'status' => 'Permanent',
            'poessa_no' => 'POESSA-111',
            'psssa_no' => 'PSSSA-222',
            'plate_number' => '3-A-77777',
            'emergency_contact_name' => 'Sara Daniel',
            'emergency_contact_relationship' => 'Sister',
            'emergency_contact_phone' => '0922334455',
            'email' => 'tewodros@elhadar.com',
            'remarks' => 'Certified Senior Surveyor',
        ]);

        $response = $this->actingAs($user)->get('/export/employees');
        $response->assertOk();

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('POESSA No', $content);
        $this->assertStringContainsString('PSSSA No', $content);
        $this->assertStringContainsString('Plate Number', $content);
        $this->assertStringContainsString('Emergency Contact Person', $content);
        $this->assertStringContainsString('Relationship', $content);
        $this->assertStringContainsString('Remarks', $content);
        $this->assertStringContainsString('POESSA-111', $content);
        $this->assertStringContainsString('PSSSA-222', $content);
        $this->assertStringContainsString('3-A-77777', $content);
        $this->assertStringContainsString('Sara Daniel', $content);
        $this->assertStringContainsString('Sister', $content);
        $this->assertStringContainsString('Certified Senior Surveyor', $content);
    }
}
