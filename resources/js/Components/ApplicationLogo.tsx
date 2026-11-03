import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo({
    className = '',
    alt = 'Elhadar Engineering Logo',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/elhadar_logo.png"
            alt={alt}
            className={`object-contain ${className}`}
            {...props}
        />
    );
}
