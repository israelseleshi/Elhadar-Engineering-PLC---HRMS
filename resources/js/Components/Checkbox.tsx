import { InputHTMLAttributes } from 'react';
import { Checkbox as ShadcnCheckbox } from '@/Components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function Checkbox({
    className = '',
    checked,
    onChange,
    name,
    disabled,
    id,
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <ShadcnCheckbox
            id={id}
            name={name}
            disabled={disabled}
            checked={Boolean(checked)}
            className={cn(
                'rounded border-gray-300 text-indigo-600 shadow-sm focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-indigo-600 dark:focus-visible:ring-offset-gray-800',
                className
            )}
            onCheckedChange={(next) => {
                if (!onChange) return;
                const synthetic = { target: { checked: next === true, name, type: 'checkbox' } } as unknown as React.ChangeEvent<HTMLInputElement>;
                onChange(synthetic);
            }}
            {...(props as any)}
        />
    );
}
