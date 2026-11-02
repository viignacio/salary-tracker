'use client'

import { useState } from 'react'
import { Box, IconButton, Menu, MenuItem, Typography, Button } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { format, subMonths, addMonths } from 'date-fns'
import { parseYearMonth } from '@/lib/date'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export default function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const currentDate = parseYearMonth(selectedMonth)
  const displayText = format(currentDate, 'MMMM yyyy')

  const handlePreviousMonth = () => {
    onMonthChange(format(subMonths(currentDate, 1), 'yyyy-MM'))
  }

  const handleNextMonth = () => {
    onMonthChange(format(addMonths(currentDate, 1), 'yyyy-MM'))
  }

  const handleMonthSelect = (month: string) => {
    onMonthChange(month)
    setAnchorEl(null)
  }

  // Generate recent months for quick selection
  const today = new Date()
  const recentMonths = Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(today, i)
    return { value: format(month, 'yyyy-MM'), label: format(month, 'MMMM yyyy') }
  })

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <IconButton onClick={handlePreviousMonth} size="small" aria-label="Previous month">
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <Button
        variant="text"
        size="small"
        startIcon={<CalendarMonthIcon fontSize="small" />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: 'var(--color-ink)', fontWeight: 600 }}
      >
        {displayText}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { maxHeight: 360, minWidth: 220, mt: 0.5 } } }}
      >
        <Box px={2} pt={1} pb={0.5}>
          <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Recent months</Typography>
        </Box>
        {recentMonths.map((month) => (
          <MenuItem
            key={month.value}
            selected={month.value === selectedMonth}
            onClick={() => handleMonthSelect(month.value)}
            sx={{ minHeight: 44, fontSize: 'var(--text-sm)' }}
          >
            {month.label}
          </MenuItem>
        ))}
      </Menu>
      <IconButton onClick={handleNextMonth} size="small" aria-label="Next month">
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
