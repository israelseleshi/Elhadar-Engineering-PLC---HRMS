import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xs border border-[#d8d9da] bg-white px-3 py-2 text-sm text-[#000000] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#b1b3b5] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#008254] focus-visible:border-[#008254] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
