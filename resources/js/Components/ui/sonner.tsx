import {
    CheckCircle2,
    Info,
    Loader2,
    AlertCircle,
    AlertTriangle,
    Trash2,
} from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            className="toaster group"
            closeButton={false}
            icons={{
                success: <CheckCircle2 className="h-4 w-4 text-[#34c759] shrink-0" strokeWidth={2.2} />,
                info: <Info className="h-4 w-4 text-[#0066cc] dark:text-[#2997ff] shrink-0" strokeWidth={2.2} />,
                warning: <AlertTriangle className="h-4 w-4 text-[#ff9f0a] shrink-0" strokeWidth={2.2} />,
                error: <AlertCircle className="h-4 w-4 text-white shrink-0" strokeWidth={2.2} />,
                loading: <Loader2 className="h-4 w-4 text-[#0066cc] dark:text-[#2997ff] animate-spin shrink-0" strokeWidth={2.2} />,
            }}
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-[#1d1d1f] " +
                        "group-[.toaster]:backdrop-blur-2xl " +
                        "group-[.toaster]:text-[#1d1d1f] dark:group-[.toaster]:text-[#f5f5f7] " +
                        "group-[.toaster]:border group-[.toaster]:border-black/[0.08] dark:group-[.toaster]:border-white/[0.12] " +
                        "group-[.toaster]:shadow-[0_12px_36px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.04)] dark:group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] " +
                        "group-[.toaster]:rounded-2xl " +
                        "group-[.toaster]:p-3.5 group-[.toaster]:px-4 " +
                        "group-[.toaster]:gap-3",
                    error:
                        "!bg-[#dc2626] !text-white !border-red-700 !opacity-100 shadow-xl " +
                        "[&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_[data-icon]]:!text-white",
                    title: "group-[.toast]:text-[13px] group-[.toast]:font-semibold group-[.toast]:tracking-tight group-[.toast]:text-[#1d1d1f] dark:group-[.toast]:text-[#f5f5f7]",
                    description: "group-[.toast]:text-[12px] group-[.toast]:font-normal group-[.toast]:text-[#6e6e73] dark:group-[.toast]:text-[#a1a1a6] group-[.toast]:leading-snug group-[.toast]:mt-0.5",
                    actionButton:
                        "group-[.toast]:bg-[#0066cc] hover:group-[.toast]:bg-[#0071e3] dark:group-[.toast]:bg-[#2997ff] dark:hover:group-[.toast]:bg-[#3da4ff] " +
                        "group-[.toast]:text-white " +
                        "group-[.toast]:font-medium group-[.toast]:text-[12px] " +
                        "group-[.toast]:rounded-full " +
                        "group-[.toast]:px-3.5 group-[.toast]:py-1.5 " +
                        "group-[.toast]:h-auto " +
                        "group-[.toast]:shadow-xs group-[.toast]:transition-all active:group-[.toast]:scale-95",
                    cancelButton:
                        "group-[.toast]:bg-black/5 hover:group-[.toast]:bg-black/10 dark:group-[.toast]:bg-white/10 dark:hover:group-[.toast]:bg-white/15 " +
                        "group-[.toast]:text-[#1d1d1f] dark:group-[.toast]:text-[#f5f5f7] " +
                        "group-[.toast]:font-medium group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-[12px] group-[.toast]:transition-all",
                    closeButton: "hidden group-[.toast]:hidden",
                },
            }}
            {...props}
        />
    );
};

export const toastDelete = (message: string, description?: string) => {
    toast(message, {
        description,
        className: '!bg-[#dc2626] !text-white !border-red-700 !opacity-100 shadow-xl font-medium',
        style: {
            backgroundColor: '#dc2626',
            color: '#ffffff',
            opacity: 1,
            border: '1px solid #b91c1c',
        },
        icon: <Trash2 className="h-4 w-4 text-white shrink-0" strokeWidth={2.2} />,
    });
};
