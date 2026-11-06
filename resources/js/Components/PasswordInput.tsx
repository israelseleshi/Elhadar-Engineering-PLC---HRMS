import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

export default forwardRef(function PasswordInput(
    {
        className = '',
        isFocused = false,
        type,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const [visible, setVisible] = useState(false);
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
        <div className="relative">
            <Input
                {...props}
                type={visible ? 'text' : 'password'}
                className={cn(
                    'block w-full rounded-xl border border-input bg-background pr-10 text-sm text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring',
                    className
                )}
                ref={localRef}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                title={visible ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1.5 rounded-lg text-muted-foreground transition-colors hover:text-primary"
            >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
});


