import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-xs px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#008254] text-white hover:bg-[#006642]",
        secondary:
          "border-transparent bg-[#effcf8] text-[#008254] border border-[#b7ecda]",
        lime:
          "border-transparent bg-[#e8fdac] text-[#006642] font-bold",
        mint:
          "border-transparent bg-[#e3faf2] text-[#008254] font-medium",
        destructive:
          "border-transparent bg-[#de2828]/10 text-[#de2828] border border-[#de2828]/20",
        outline: "text-[#3d4045] border border-[#d8d9da] bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
