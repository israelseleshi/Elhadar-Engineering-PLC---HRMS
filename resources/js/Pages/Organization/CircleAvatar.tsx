import { useState } from 'react';
import { getInitials, getAvatarGradient } from './employeeOrgMapping';

interface CircleAvatarProps {
    name: string;
    photoUrl?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showStatusDot?: boolean;
    status?: string;
}

export function CircleAvatar({
    name,
    photoUrl,
    size = 'md',
    className = '',
    showStatusDot = false,
    status = 'Permanent',
}: CircleAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initials = getInitials(name);
    const gradient = getAvatarGradient(name);

    const sizeClasses = {
        xs: 'w-5 h-5 min-w-5 min-h-5 text-[8.5px]',
        sm: 'w-6 h-6 min-w-6 min-h-6 text-[9.5px]',
        md: 'w-8 h-8 min-w-8 min-h-8 text-[11px]',
        lg: 'w-10 h-10 min-w-10 min-h-10 text-xs',
        xl: 'w-14 h-14 min-w-14 min-h-14 text-base',
    };

    const hasValidPhoto = photoUrl && !imgError;

    return (
        <div className={`relative inline-block shrink-0 ${className}`}>
            <div
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold tracking-tight overflow-hidden select-none shadow-2xs border border-black/5 dark:border-white/10 transition-transform`}
            >
                {hasValidPhoto ? (
                    <img
                        src={photoUrl}
                        alt={name}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div
                        style={{
                            background: gradient,
                            color: '#ffffff',
                        }}
                        className="w-full h-full flex items-center justify-center font-bold text-white shadow-inner select-none"
                    >
                        {initials}
                    </div>
                )}
            </div>

            {showStatusDot && (
                <span
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-gray-900 ${
                        status === 'Permanent' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={status}
                />
            )}
        </div>
    );
}
