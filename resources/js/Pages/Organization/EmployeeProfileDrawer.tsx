import React, { useEffect } from 'react';
import { X, ExternalLink, MapPin, Briefcase, Building2, ShieldCheck, User } from 'lucide-react';
import { OrgEmployee } from './employeeOrgMapping';
import { CircleAvatar } from './CircleAvatar';

interface EmployeeProfileDrawerProps {
    employee: OrgEmployee | null;
    onClose: () => void;
}

export function EmployeeProfileDrawer({ employee, onClose }: EmployeeProfileDrawerProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (employee) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [employee, onClose]);

    if (!employee) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            />

            {/* Slide-over Drawer Panel */}
            <div className="fixed inset-y-0 right-0 max-w-sm w-full flex pl-10 pointer-events-auto">
                <div className="w-full bg-white dark:bg-[#16181e] border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Employee Profile
                        </span>
                        <button
                            onClick={onClose}
                            className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 flex-1 flex flex-col items-center text-center">
                        {/* Large Avatar */}
                        <div className="relative mb-4">
                            <CircleAvatar
                                name={employee.name}
                                photoUrl={employee.photo_url}
                                size="xl"
                                showStatusDot
                                status={employee.status}
                            />
                        </div>

                        {/* Name & Title */}
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            {employee.name}
                        </h3>
                        <p className="text-xs font-medium text-[#0066cc] dark:text-[#2997ff] mt-0.5">
                            {employee.position || 'Employee'}
                        </p>

                        {/* Status Badge */}
                        <div className="mt-2.5">
                            <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    employee.status === 'Permanent'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        employee.status === 'Permanent' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                />
                                {employee.status} Staff
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="w-full mt-6 space-y-2.5 text-left text-xs">
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80">
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-1">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    Department
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                    {employee.department || 'Not Assigned'}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80">
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                    Work Location / Site
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                    {employee.workplace || 'Head Office'}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80">
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-1">
                                    <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                    Employee ID
                                </div>
                                <div className="font-mono font-medium text-gray-800 dark:text-gray-200">
                                    EMP-{String(employee.id).padStart(4, '0')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 flex flex-col gap-2">
                        <a
                            href={`/employees/${employee.id}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#0066cc] hover:bg-[#0071e3] text-white shadow-xs hover:shadow transition-all"
                        >
                            <span>Open Full Staff Profile</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
