"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    minDate?: Date
    className?: string
}

// Parse various time input formats into hours and minutes
function parseTimeInput(input: string): { hours: number; minutes: number } | null {
    const cleaned = input.trim().toLowerCase()

    // Try matching patterns like: 9:30pm, 9:30 pm, 21:30, 930pm, 930, 9pm, 9 pm

    // Pattern: HH:MM AM/PM or HH:MM
    let match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/)
    if (match) {
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3]

        if (period === 'pm' && hours < 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            return { hours, minutes }
        }
    }

    // Pattern: HHMM or HMM (e.g., 2130, 930)
    match = cleaned.match(/^(\d{1,2})(\d{2})\s*(am|pm)?$/)
    if (match) {
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3]

        if (period === 'pm' && hours < 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            return { hours, minutes }
        }
    }

    // Pattern: H AM/PM (e.g., 9pm, 9 pm)
    match = cleaned.match(/^(\d{1,2})\s*(am|pm)$/)
    if (match) {
        let hours = parseInt(match[1])
        const period = match[2]

        if (period === 'pm' && hours < 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0

        if (hours >= 0 && hours < 24) {
            return { hours, minutes: 0 }
        }
    }

    // Pattern: Just a number (assume hour in 24h format if > 12, otherwise could be either)
    match = cleaned.match(/^(\d{1,2})$/)
    if (match) {
        const hours = parseInt(match[1])
        if (hours >= 0 && hours < 24) {
            return { hours, minutes: 0 }
        }
    }

    return null
}

// Format time for display
function formatTimeDisplay(hours: number, minutes: number): string {
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const ampm = hours < 12 ? 'AM' : 'PM'
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

// Generate time options in 15-minute increments
function generateTimeOptions(): { value: string; label: string; hours: number; minutes: number }[] {
    const options: { value: string; label: string; hours: number; minutes: number }[] = []
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
            const ampm = h < 12 ? 'AM' : 'PM'
            options.push({
                value: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                label: `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`,
                hours: h,
                minutes: m,
            })
        }
    }
    return options
}

const TIME_OPTIONS = generateTimeOptions()

export function DateTimePicker({
    value,
    onChange,
    minDate,
    className,
}: DateTimePickerProps) {
    const [dateOpen, setDateOpen] = React.useState(false)
    const [timeOpen, setTimeOpen] = React.useState(false)
    const [timeInput, setTimeInput] = React.useState('')
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Sync timeInput with value
    React.useEffect(() => {
        if (value) {
            setTimeInput(formatTimeDisplay(value.getHours(), value.getMinutes()))
        }
    }, [value])

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange?.(undefined)
            return
        }

        // Preserve time from current value if available
        if (value) {
            date.setHours(value.getHours(), value.getMinutes(), 0, 0)
        } else {
            // Default to current time rounded to next 15 min
            const now = new Date()
            const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15
            if (roundedMinutes === 60) {
                date.setHours(now.getHours() + 1, 0, 0, 0)
            } else {
                date.setHours(now.getHours(), roundedMinutes, 0, 0)
            }
        }

        onChange?.(date)
        setDateOpen(false)
    }

    const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimeInput(e.target.value)
    }

    const handleTimeInputBlur = () => {
        const parsed = parseTimeInput(timeInput)
        if (parsed) {
            const newDate = value ? new Date(value) : new Date()
            newDate.setHours(parsed.hours, parsed.minutes, 0, 0)
            onChange?.(newDate)
            setTimeInput(formatTimeDisplay(parsed.hours, parsed.minutes))
        } else if (value) {
            // Reset to current value if parse failed
            setTimeInput(formatTimeDisplay(value.getHours(), value.getMinutes()))
        } else {
            setTimeInput('')
        }
    }

    const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleTimeInputBlur()
            e.currentTarget.blur()
        }
    }

    const handleTimeSelect = (hours: number, minutes: number) => {
        const newDate = value ? new Date(value) : new Date()
        newDate.setHours(hours, minutes, 0, 0)
        onChange?.(newDate)
        setTimeInput(formatTimeDisplay(hours, minutes))
        setTimeOpen(false)
    }

    // Filter times if minDate is today
    const getAvailableTimeOptions = () => {
        if (!minDate || !value) return TIME_OPTIONS

        const isMinDateToday = minDate.toDateString() === value.toDateString()
        if (!isMinDateToday) return TIME_OPTIONS

        const minHour = minDate.getHours()
        const minMinute = Math.ceil(minDate.getMinutes() / 15) * 15

        return TIME_OPTIONS.filter((opt) => {
            if (opt.hours > minHour) return true
            if (opt.hours === minHour && opt.minutes >= minMinute) return true
            return false
        })
    }

    return (
        <div className={cn("flex gap-2", className)}>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-[55%] justify-start text-left font-normal border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                            {value ? format(value, "MMM d") : "Date"}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-zinc-700 bg-zinc-900" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        disabled={(date) => {
                            if (!minDate) return false
                            const minDateStart = new Date(minDate)
                            minDateStart.setHours(0, 0, 0, 0)
                            const dateStart = new Date(date)
                            dateStart.setHours(0, 0, 0, 0)
                            return dateStart < minDateStart
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <div className="relative w-[45%]">
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 hover:text-zinc-200 cursor-pointer z-10"
                            onClick={() => setTimeOpen(true)}
                        >
                            <Clock className="h-4 w-4" />
                        </button>
                    </PopoverTrigger>
                    <input
                        ref={inputRef}
                        type="text"
                        value={timeInput}
                        onChange={handleTimeInputChange}
                        onBlur={handleTimeInputBlur}
                        onKeyDown={handleTimeInputKeyDown}
                        placeholder="9:30 PM"
                        className="w-full h-9 pl-10 pr-3 rounded-md border border-zinc-700 bg-zinc-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 placeholder:text-zinc-500"
                    />
                </div>
                <PopoverContent className="w-[200px] p-0 border-zinc-700 bg-zinc-900 max-h-[300px] overflow-y-auto" align="start">
                    <div className="py-1">
                        {getAvailableTimeOptions().map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleTimeSelect(option.hours, option.minutes)}
                                className={cn(
                                    "w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors",
                                    value && value.getHours() === option.hours && value.getMinutes() === option.minutes
                                        ? "bg-emerald-600/20 text-emerald-400"
                                        : "text-zinc-300"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
