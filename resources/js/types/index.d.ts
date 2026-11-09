export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role?: 'SysAdmin' | 'HRAdmin' | 'Manager' | 'Employee' | string;
    is_active?: boolean;
    email_verified_at?: string;
    is_managerial?: boolean;
    can_approve_leave?: boolean;
    pending_leave_approvals_count?: number;
    managerial_level?: string | null;
    managerial_scope?: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string | null;
        error?: string | null;
        warning?: string | null;
        info?: string | null;
    };
};
