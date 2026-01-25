'use client'

import { useState } from 'react'
import { Box, IconButton, Menu, MenuItem, Typography, Button } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { format, subMonths, addMonths } from 'date-fns'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export default function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const currentDate = new Date(selectedMonth + '-01')
  const displayText = format(currentDate, 'MMMM yyyy')

  const handlePreviousMonth = () => {
    const previousMonth = subMonths(currentDate, 1)
    onMonthChange(format(previousMonth, 'yyyy-MM'))
  }

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1)
    onMonthChange(format(nextMonth, 'yyyy-MM'))
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMonthSelect = (month: string) => {
    onMonthChange(month)
    setAnchorEl(null)
  }

  // Generate recent months for quick selection
  const recentMonths = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const month = subMonths(today, i)
    recentMonths.push({
      value: format(month, 'yyyy-MM'),
      label: format(month, 'MMMM yyyy'),
    })
  }

  return (
    <>
      {/* Mobile layout: xs only */}
      <Box
        sx={{
          background: '#ffffff',
          borderRadius: 1,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          minHeight: 40,
          px: 0,
          position: 'relative',
          display: { xs: 'block', sm: 'none' },
          width: '100%',
        }}
      >
        <IconButton
          onClick={handlePreviousMonth}
          size="small"
          sx={{
            position: 'absolute',
            left: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            p: 0.75,
            zIndex: 2,
            color: '#64748b',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
              color: '#475569',
            }
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Button
          size="small"
          startIcon={<CalendarMonthIcon fontSize="small" />}
          onClick={handleMenuOpen}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#1e293b',
            px: 1.5,
            py: 1,
            fontSize: '0.8125rem',
            minHeight: 40,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            borderRadius: 1,
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          {displayText}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              maxHeight: 300,
              minWidth: 200,
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          <Box px={1.5} pt={1} pb={0.5}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              mb={1}
              sx={{ fontSize: '0.75rem' }}
            >
              Recent Months
            </Typography>
          </Box>
          {recentMonths.map((month) => (
            <MenuItem
              key={month.value}
              selected={month.value === selectedMonth}
              onClick={() => handleMonthSelect(month.value)}
              sx={{
                py: 1.5,
                fontSize: '0.875rem',
              }}
            >
              {month.label}
            </MenuItem>
          ))}
        </Menu>
        <IconButton
          onClick={handleNextMonth}
          size="small"
          sx={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            p: 0.75,
            zIndex: 2,
            color: '#64748b',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
              color: '#475569',
            }
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
      {/* Desktop layout: sm and up only */}
      <Box
        sx={{
          background: '#ffffff',
          borderRadius: 1,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          minHeight: 36,
          px: 0.75,
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          minWidth: 0,
          maxWidth: 'none',
        }}
      >
        <IconButton
          onClick={handlePreviousMonth}
          size="small"
          sx={{
            p: 0.5,
            minWidth: 32,
            minHeight: 32,
            borderRadius: 1,
            color: '#64748b',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
              color: '#475569',
            }
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Button
          size="small"
          startIcon={<CalendarMonthIcon fontSize="small" />}
          onClick={handleMenuOpen}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#1e293b',
            px: 1.5,
            py: 0.5,
            fontSize: '0.8125rem',
            minHeight: 36,
            mx: 0.5,
            borderRadius: 1,
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          {displayText}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              maxHeight: 400,
              minWidth: 250,
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          <Box px={2} pt={1} pb={0.5}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              mb={1}
              sx={{ fontSize: '0.875rem' }}
            >
              Recent Months
            </Typography>
          </Box>
          {recentMonths.map((month) => (
            <MenuItem
              key={month.value}
              selected={month.value === selectedMonth}
              onClick={() => handleMonthSelect(month.value)}
              sx={{
                py: 1,
                fontSize: '1rem',
              }}
            >
              {month.label}
            </MenuItem>
          ))}
        </Menu>
        <IconButton
          onClick={handleNextMonth}
          size="small"
          sx={{
            p: 0.5,
            minWidth: 32,
            minHeight: 32,
            borderRadius: 1,
            color: '#64748b',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
              color: '#475569',
            }
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </>
  )
} 