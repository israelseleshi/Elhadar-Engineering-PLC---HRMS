import React, { useState } from 'react';

interface Props {
    name: string;
    src?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    className?: string;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
    xs: { container: 'w-6 h-6 rounded-full', text: 'text-[10px] font-bold' },
    sm: { container: 'w-8 h-8 rounded-full', text: 'text-xs font-bold' },
    md: { container: 'w-10 h-10 rounded-full', text: 'text-sm font-bold' },
    lg: { container: 'w-[140px] h-[140px] rounded-full', text: 'text-[2.8rem] leading-none font-bold' },
    xl: { container: 'w-40 h-40 rounded-full', text: 'text-[3.75rem] leading-none font-bold' },
    '2xl': { container: 'w-60 h-60 rounded-full', text: 'text-[5.625rem] leading-none font-bold' },
    '3xl': { container: 'w-[360px] h-[360px] rounded-full', text: 'text-[7.5rem] leading-none font-bold' },
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
