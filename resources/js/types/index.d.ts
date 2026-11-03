export interface User {
    id: number;
    name: string;
    email: string;
    role?: 'SysAdmin' | 'HRAdmin' | 'Manager' | 'Employee' | string;
    is_active?: boolean;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
