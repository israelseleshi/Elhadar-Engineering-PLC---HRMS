import React, { useState } from 'react';

interface Props {
    name: string;
    src?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
    xs: { container: 'w-6 h-6 rounded-full', text: 'text-[10px] font-bold' },
    sm: { container: 'w-8 h-8 rounded-full', text: 'text-xs font-bold' },
    md: { container: 'w-10 h-10 rounded-full', text: 'text-sm font-bold' },
    lg: { container: 'w-14 h-14 rounded-full', text: 'text-lg font-bold' },
    xl: { container: 'w-16 h-16 rounded-full', text: 'text-2xl font-bold' },
    '2xl': { container: 'w-24 h-24 rounded-full', text: 'text-3xl font-bold' },
};

export default function EmployeeAvatar({ name, src, size = 'md', className = '' }: Props) {
    const [imgError, setImgError] = useState(false);

    const initial = (name || '?').trim().charAt(0).toUpperCase();
    const config = sizeClasses[size] || sizeClasses.md;

    // Has valid photo that hasn't errored
    if (src && !imgError) {
        return (
            <div className={`relative shrink-0 overflow-hidden rounded-full ${config.container} ${className}`}>
                <img
                    src={src}
                    alt={name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-center"
                />
            </div>
        );
    }

    // Elegant fallback initials avatar
    return (
        <div 
            className={`shrink-0 flex items-center justify-center bg-[#008254] text-white select-none rounded-full ${config.container} ${className}`}
            title={name}
        >
            <span className={config.text}>{initial}</span>
        </div>
    );
}
