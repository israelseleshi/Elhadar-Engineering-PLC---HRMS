import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/Components/ui/button"
import { Calendar } from "@/Components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover"

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (dateStr: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 15,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value || !value.includes("-")) return undefined
    const [y, m, d] = value.split("T")[0].split("-").map(Number)
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return undefined
    return new Date(y, m - 1, d)
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("")
      setOpen(false)
      return
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    onChange?.(`${y}-${m}-${d}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-11 justify-start text-left font-normal text-sm rounded-xl bg-background border-border text-foreground hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-[#0066cc]",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {selectedDate ? (
            format(selectedDate, "PPP")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl border border-border shadow-md" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate || new Date()}
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
          captionLayout="dropdown"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
