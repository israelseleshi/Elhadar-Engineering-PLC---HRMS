<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmployeePhotoController extends Controller
{
    /**
     * Upload and update an employee's avatar photo.
     */
    public function store(Request $request, Employee $employee): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['HRAdmin', 'SysAdmin']) && $user->id !== $employee->user_id) {
            abort(403, 'You do not have permission to modify this photo.');
        }

        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $oldPath = $employee->profile_photo_path;

        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('photo')->store('photos/employees', 'public');

        $employee->update(['profile_photo_path' => $path]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'EMPLOYEE_PHOTO_UPDATE',
            'auditable_type' => Employee::class,
            'auditable_id' => $employee->id,
            'old_values' => ['profile_photo_path' => $oldPath],
            'new_values' => ['profile_photo_path' => $path],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Profile photo for {$employee->full_name} updated successfully.");
    }

    /**
     * Remove an employee's avatar photo.
     */
    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['HRAdmin', 'SysAdmin']) && $user->id !== $employee->user_id) {
            abort(403, 'You do not have permission to modify this photo.');
        }

        $oldPath = $employee->profile_photo_path;

        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $employee->update(['profile_photo_path' => null]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'EMPLOYEE_PHOTO_REMOVE',
            'auditable_type' => Employee::class,
            'auditable_id' => $employee->id,
            'old_values' => ['profile_photo_path' => $oldPath],
            'new_values' => ['profile_photo_path' => null],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Profile photo for {$employee->full_name} removed.");
    }
}
