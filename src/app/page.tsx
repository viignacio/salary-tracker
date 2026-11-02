'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, addMonths } from 'date-fns'
import { parseYearMonth } from '@/lib/date'
import HelperCard from '@/components/HelperCard'
import AddHelperModal from '@/components/AddHelperModal'
import MonthSelector from '@/components/MonthSelector'
import UnlockDialog from '@/components/UnlockDialog'
import { Box, Container, Typography, Button, IconButton, Skeleton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import Grid from '@mui/material/Grid'

interface Helper {
  id: string
  name: string
  salaries: Array<{
    id: string
    amount: number
    month: string
    year: number
  }>
  deductions: Array<{
    id: string
    purpose: string
    amount: number
    date: string
    month: string
    year: number
  }>
  bonuses: Array<{
    id: string
    purpose: string
    amount: number
    date: string
    month: string
    year: number
    given?: boolean
  }>
}

type AuthState = 'checking' | 'locked' | 'ready'

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showAddHelper, setShowAddHelper] = useState(false)
  const isInitialLoad = useRef(true)

  const checkAndRedirectIfMonthFullyPaid = useCallback((helpersToCheck: Helper[]) => {
    // Check if all helpers are fully paid for the current month
    const [month, year] = selectedMonth.split('-')

    const allHelpersFullyPaid = helpersToCheck.every(helper => {
      // Get salary for this helper and month
      const salary = helper.salaries.find(s => s.month === month && s.year === parseInt(year))
      const salaryAmount = salary?.amount || 0

      // Get deductions and bonuses for this helper and month
      const deductions = helper.deductions.filter(d => d.month === month && d.year === parseInt(year))
      const bonuses = helper.bonuses.filter(b => b.month === month && b.year === parseInt(year))

      // Calculate totals (net pay only includes bonuses not yet given)
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
      const totalBonusesNotGiven = bonuses.filter(b => !b.given).reduce((sum, b) => sum + b.amount, 0)
      const netPay = salaryAmount + totalBonusesNotGiven - totalDeductions

      // Check if there's a "Fully paid" deduction that covers the net pay
      const fullyPaidDeduction = deductions.find(d => d.purpose === 'Fully paid')
      const isFullyPaid = fullyPaidDeduction && fullyPaidDeduction.amount >= netPay

      return isFullyPaid
    })

    // If all helpers are fully paid AND there are helpers, move to next month
    if (allHelpersFullyPaid && helpersToCheck.length > 0) {
      const currentDate = parseYearMonth(selectedMonth)
      const nextMonth = addMonths(currentDate, 1)
      const nextMonthString = format(nextMonth, 'yyyy-MM')
      setSelectedMonth(nextMonthString)
    }
  }, [selectedMonth])

  const fetchHelpers = useCallback(async () => {
    try {
      const response = await fetch('/api/helpers')
      if (!response.ok) {
        if (response.status === 401) {
          setHelpers([])
          setAuthState('locked')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const helpersData = Array.isArray(data) ? data : []
      setHelpers(helpersData)
      setAuthState('ready')

      // Only check for redirect on the very first load AND when helpers are loaded
      if (isInitialLoad.current && helpersData.length > 0) {
        isInitialLoad.current = false
        setTimeout(() => {
          checkAndRedirectIfMonthFullyPaid(helpersData)
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching helpers:', error)
      setHelpers([]) // Set empty array on error
      setAuthState('ready')
    }
  }, [checkAndRedirectIfMonthFullyPaid])

  useEffect(() => {
    fetchHelpers()
  }, [fetchHelpers])

  const handleUnlock = async (password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) return false
    await fetchHelpers()
    return true
  }

  const handleAddHelper = async (name: string) => {
    try {
      const response = await fetch('/api/helpers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        await fetchHelpers()
        setShowAddHelper(false)
      }
    } catch (error) {
      console.error('Error adding helper:', error)
    }
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    setHelpers([])
    setAuthState('locked')
  }

  const shellLocked = authState !== 'ready'

  return (
    <Box sx={{ minHeight: '100dvh', background: 'var(--color-paper)' }}>
      {authState === 'locked' && <UnlockDialog onUnlock={handleUnlock} />}
      <Box
        inert={shellLocked || undefined}
        sx={{
          filter: shellLocked ? 'blur(6px)' : 'none',
          transition: 'filter var(--dur-long) var(--ease-out)',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Container maxWidth={false} sx={{ width: '100%', maxWidth: '1400px', py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Box mb={{ xs: 2, sm: 3 }} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h1" sx={{ color: 'var(--color-ink)', mb: 0.5 }}>
                Salary Tracker
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                For private use only
              </Typography>
            </Box>
            <IconButton
              onClick={handleLogout}
              aria-label="Logout"
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'var(--color-error)', flexShrink: 0 }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
            <Button
              variant="text"
              size="small"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={handleLogout}
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'var(--color-error)', flexShrink: 0 }}
            >
              Logout
            </Button>
          </Box>

          {/* Controls */}
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={{ xs: 1.5, sm: 2 }}
            mb={{ xs: 2, sm: 3 }}
            alignItems="center"
            justifyContent="space-between"
          >
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setShowAddHelper(true)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Add helper
            </Button>
          </Box>

          {/* Helpers Grid */}
          {!shellLocked && helpers.length === 0 ? (
            <Box textAlign="center" py={{ xs: 6, sm: 8 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--color-paper-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <MonetizationOnOutlinedIcon sx={{ fontSize: 28, color: 'var(--color-muted)' }} />
              </Box>
              <Typography variant="h3" sx={{ color: 'var(--color-ink)', mb: 1 }}>
                No helpers added yet
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', mb: 3 }}>
                Add the first helper to start tracking their pay.
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon fontSize="small" />} onClick={() => setShowAddHelper(true)}>
                Add helper
              </Button>
            </Box>
          ) : (
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
              {shellLocked
                ? [0, 1, 2].map((i) => (
                    <Grid key={i} item xs={12} sm={6} md={4}>
                      <Skeleton variant="rounded" height={320} sx={{ borderRadius: 'var(--radius-card)', bgcolor: 'var(--color-paper-2)' }} />
                    </Grid>
                  ))
                : helpers.map((helper) => (
                    <Grid key={helper.id} item xs={12} sm={6} md={4}>
                      <HelperCard helper={helper} selectedMonth={selectedMonth} onUpdate={fetchHelpers} />
                    </Grid>
                  ))}
            </Grid>
          )}
        </Container>

        <AddHelperModal isOpen={showAddHelper} onClose={() => setShowAddHelper(false)} onAdd={handleAddHelper} />
      </Box>
    </Box>
  )
}
