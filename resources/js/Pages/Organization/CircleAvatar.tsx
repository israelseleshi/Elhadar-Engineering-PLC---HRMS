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

    // 2x enlarged avatar dimensions for bold Apple-inspired visual clarity
    const sizeClasses = {
        xs: 'w-7 h-7 min-w-7 min-h-7 text-[10px]',
        sm: 'w-12 h-12 min-w-12 min-h-12 text-sm',
        md: 'w-14 h-14 min-w-14 min-h-14 text-base font-bold',
        lg: 'w-16 h-16 min-w-16 min-h-16 text-lg font-bold',
        xl: 'w-20 h-20 min-w-20 min-h-20 text-2xl font-bold',
    };

    const hasValidPhoto = photoUrl && !imgError;

    return (
        <div className={`relative inline-block shrink-0 ${className}`}>
            <div
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold tracking-tight overflow-hidden select-none shadow-xs border border-black/10 dark:border-white/15 transition-transform`}
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
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-2xs ${
                        status === 'Permanent' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={status}
                />
            )}
        </div>
    );
}
