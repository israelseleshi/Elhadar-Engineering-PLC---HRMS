<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeePhotoController;
use App\Http\Controllers\EmployeeSalaryController;
use App\Http\Controllers\ExcelImportExportController;
use App\Http\Controllers\LeaveBalanceController;
use App\Http\Controllers\NewEmployeeController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ProbationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\SeparationController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\TrainingController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (! auth()->check()) {
        return redirect()->route('login');
    }

    return auth()->user()->role === 'Employee'
        ? redirect()->route('portal.profile')
        : redirect()->route('dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'role:HRAdmin,SysAdmin,Manager'])
    ->name('dashboard');

Route::middleware(['auth', 'password.changed'])->group(function () {
    // Employee Self-Service (ESS) - Accessible to all staff
    Route::get('/portal/profile', [PortalController::class, 'profile'])->name('portal.profile');
    Route::post('/portal/discrepancies', [PortalController::class, 'reportDiscrepancy'])->name('portal.discrepancy.store');
    Route::post('/portal/leave-requests', [PortalController::class, 'requestLeave'])->name('portal.leave.store');
    Route::patch('/portal/leave-requests/{leaveRequest}/cancel', [PortalController::class, 'cancelLeaveRequest'])->name('portal.leave.cancel');
    // Staff Photo Management (HR/Admin or Self)
    Route::post('/employees/{employee}/photo', [EmployeePhotoController::class, 'store'])->name('employees.photo.store');
    Route::delete('/employees/{employee}/photo', [EmployeePhotoController::class, 'destroy'])->name('employees.photo.destroy');

    // Announcements - Viewable by all staff, managed by HR Admin & SysAdmin
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');

    // Administrative Governance - Strictly HRAdmin and SysAdmin
    Route::middleware('role:HRAdmin,SysAdmin')->group(function () {
        Route::patch('/portal/discrepancies/{report}', [PortalController::class, 'reviewDiscrepancy'])->name('portal.discrepancy.review');
        // Staff Profile Onboarding (must be declared before /employees/{employee})
        Route::get('/employees/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::post('/employees/{employee}/salaries', [EmployeeSalaryController::class, 'store'])->name('employees.salaries.store');

        // Statutory Actions & Approvals
        Route::post('/probation/{employee}/confirm', [ProbationController::class, 'confirmPermanent'])->name('probation.confirm');
        Route::post('/contracts/{employee}/renew', [ContractController::class, 'renew'])->name('contracts.renew');
        Route::post('/training', [TrainingController::class, 'store'])->name('training.store');
        Route::post('/leave/{employee}/adjust', [LeaveBalanceController::class, 'adjust'])->name('leave.adjust');

        // Statutory Separations & Severance Estimator
        Route::get('/separations', [SeparationController::class, 'index'])->name('separations.index');
        Route::get('/separations/{employee}/calculate', [SeparationController::class, 'calculate'])->name('separations.calculate');
        Route::post('/separations', [SeparationController::class, 'store'])->name('separations.store');
        Route::patch('/separations/{separation}/mark-paid', [SeparationController::class, 'markPaid'])->name('separations.mark-paid');

        // Career Progression & Promotions Ledger
        Route::get('/promotions', [PromotionController::class, 'index'])->name('promotions.index');
        Route::post('/promotions', [PromotionController::class, 'store'])->name('promotions.store');

        // Bulk Excel Ingestion & Roster Export Center
        Route::get('/import', [ExcelImportExportController::class, 'index'])->name('import.index');
        Route::post('/import/preview', [ExcelImportExportController::class, 'preview'])->name('import.preview');
        Route::post('/import/execute', [ExcelImportExportController::class, 'execute'])->name('import.execute');
        Route::get('/import/template', [ExcelImportExportController::class, 'downloadTemplate'])->name('import.template');
        Route::get('/export/employees', [ExcelImportExportController::class, 'export'])->name('export.employees');

        // System Settings & Statutory Parameter Registry
        Route::get('/settings', [SystemSettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [SystemSettingController::class, 'update'])->name('settings.update');

        // Announcements - HR Admin & SysAdmin management
        Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
        Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
        Route::get('/announcements/{announcement}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
        Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update'])->name('announcements.update');
        Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

        // Immutable Security Audit Log & Changes Inspector
        Route::get('/audit', [AuditLogController::class, 'index'])->name('audit.index');
        Route::get('/audit/{auditLog}', [AuditLogController::class, 'show'])->name('audit.show');
    });

    // Operational Core - Accessible to HR Admin, SysAdmin, and Site Managers
    Route::middleware('role:HRAdmin,SysAdmin,Manager')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');

        // New Employees Onboarding Roster (placeholder page)
        Route::get('/new-employees', [NewEmployeeController::class, 'index'])->name('new-employees.index');
        Route::get('/probation', [ProbationController::class, 'index'])->name('probation.index');
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::get('/training', [TrainingController::class, 'index'])->name('training.index');
        Route::get('/leave', [LeaveBalanceController::class, 'index'])->name('leave.index');
        Route::post('/leave/requests/{leaveRequest}/review', [LeaveBalanceController::class, 'reviewRequest'])->name('leave.requests.review');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
