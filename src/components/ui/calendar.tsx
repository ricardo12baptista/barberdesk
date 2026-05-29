import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      style={
        {
          '--rdp-accent-color': 'var(--primary)',
          '--rdp-accent-background-color': 'hsl(var(--primary) / 0.1)',
        } as React.CSSProperties
      }
      classNames={{
        root: 'w-full bg-background',
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-2',
        month_caption: 'flex items-center justify-between h-7 px-2',
        caption_label: 'text-sm font-display font-semibold text-foreground',
        chevron: 'w-4 h-4 fill-foreground/70',
        month_grid: 'w-full border-collapse',
        weekday: 'w-9 h-8 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider',
        day: 'w-9 h-9 p-0 text-center text-sm font-body',
        day_button: 'w-full h-full rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
        selected: '[&_.rdp-day_button]:bg-primary [&_.rdp-day_button]:text-primary-foreground [&_.rdp-day_button]:hover:bg-primary/90',
        range_start: '[&_.rdp-day_button]:bg-primary [&_.rdp-day_button]:text-primary-foreground [&_.rdp-day_button]:rounded-r-none',
        range_end: '[&_.rdp-day_button]:bg-primary [&_.rdp-day_button]:text-primary-foreground [&_.rdp-day_button]:rounded-l-none',
        range_middle: '[&_.rdp-day_button]:bg-primary/15 [&_.rdp-day_button]:text-foreground [&_.rdp-day_button]:rounded-none',
        today: '[&_.rdp-day_button]:border [&_.rdp-day_button]:border-primary/40',
        outside: '[&_.rdp-day_button]:text-muted-foreground/40',
        disabled: '[&_.rdp-day_button]:text-muted-foreground/30 [&_.rdp-day_button]:cursor-not-allowed',
        hidden: 'hidden',
        nav: 'flex items-center gap-1',
        button_next: 'w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        button_previous: 'w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }