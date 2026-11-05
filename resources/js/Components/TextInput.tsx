import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <Input
            {...props}
            type={type}
            className={cn(
                'rounded-md border-gray-300 shadow-sm focus-visible:border-indigo-500 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus-visible:border-indigo-600 dark:focus-visible:ring-indigo-600',
                className
            )}
            ref={localRef}
        />
    );
});
