'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addMonths } from 'date-fns'
import HelperCard from '@/components/HelperCard'
import AddHelperModal from '@/components/AddHelperModal'
import MonthSelector from '@/components/MonthSelector'
import { Box, Container, Typography, Button, CircularProgress } from '@mui/material'
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

export default function Home() {
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showAddHelper, setShowAddHelper] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const isInitialLoad = useRef(true)
  const router = useRouter()

  const checkAndRedirectIfMonthFullyPaid = useCallback((helpersToCheck: Helper[]) => {
    console.log('Checking for redirect...', { selectedMonth, helpersCount: helpersToCheck.length })
    
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
      
      console.log(`Helper ${helper.name}:`, {
        salaryAmount,
        totalDeductions,
        totalBonusesNotGiven,
        netPay,
        fullyPaidDeduction: fullyPaidDeduction?.amount,
        isFullyPaid
      })
      
      return isFullyPaid
    })
    
    console.log('All helpers fully paid:', allHelpersFullyPaid)
    
    // If all helpers are fully paid AND there are helpers, move to next month
    if (allHelpersFullyPaid && helpersToCheck.length > 0) {
      const currentDate = new Date(selectedMonth + '-01')
      const nextMonth = addMonths(currentDate, 1)
      const nextMonthString = format(nextMonth, 'yyyy-MM')
      console.log('Redirecting from', selectedMonth, 'to', nextMonthString)
      setSelectedMonth(nextMonthString)
    } else {
      console.log('Not redirecting - no helpers or not all fully paid')
    }
  }, [selectedMonth])

  const fetchHelpers = useCallback(async () => {
    try {
      const response = await fetch('/api/helpers')
      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const helpersData = Array.isArray(data) ? data : []
      setHelpers(helpersData)
      
      // Only check for redirect on the very first load AND when helpers are loaded
      if (isInitialLoad.current && helpersData.length > 0) {
        console.log('Initial load detected with helpers, will check for redirect')
        isInitialLoad.current = false
        setTimeout(() => {
          console.log('Calling checkAndRedirectIfMonthFullyPaid')
          checkAndRedirectIfMonthFullyPaid(helpersData)
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching helpers:', error)
      setHelpers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    // Check authentication by making a request to a protected endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/helpers')
        if (response.status === 401) {
          router.replace('/login')
          return
        }
        setAuthChecked(true)
        fetchHelpers()
      } catch (error) {
        console.error('Auth check failed:', error)
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router])

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
    router.push('/login')
  }

  if (!authChecked) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
        <Box textAlign="center">
          <CircularProgress color="primary" />
          <Typography mt={2} color="text.secondary" sx={{ fontFamily: 'monospace' }}>Checking authentication...</Typography>
        </Box>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
        <Box textAlign="center">
          <CircularProgress color="primary" />
          <Typography mt={2} color="text.secondary" sx={{ fontFamily: 'monospace' }}>Loading...</Typography>
        </Box>
      </Box>
    )
  }

  return (
      <Box 
        height="100vh" 
        sx={{
          background: '#f8fafc',
          position: 'relative',
          overflow: 'auto',
        }}
      >
      <Container maxWidth={false} sx={{ 
        width: '95%', 
        maxWidth: '1400px',
        py: { xs: 2, sm: 3 }, 
        px: { xs: 1.5, sm: 2 }, 
        position: 'relative', 
        zIndex: 1 
      }}>
        {/* Header */}
        <Box 
          mb={{ xs: 2, sm: 3 }}
          sx={{
            p: 0,
          }}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            gap={{ xs: 1.5, sm: 0 }}
          >
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={600} 
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  lineHeight: 1.3,
                  color: '#1e293b',
                  mb: 0.5,
                  fontFamily: 'monospace',
                }}
              >
                Claver GC Salary Tracker
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 400,
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}
              >
                Manage monthly salaries and deductions for your household helpers
              </Typography>
            </Box>
            <Button
              variant="text"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                minWidth: { xs: 'auto', sm: 100 },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1, sm: 1 },
                color: '#dc2626',
                fontWeight: 600,
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                textTransform: 'none',
                '&:hover': {
                  background: 'transparent',
                  textDecoration: 'underline',
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Controls */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }} 
          gap={{ xs: 1.5, sm: 2 }} 
          mb={{ xs: 2, sm: 3 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent={{ xs: 'stretch', sm: 'space-between' }}
          sx={{
            p: 0,
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'block' }, flex: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
            <Button
            variant="text"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAddHelper(true)}
            sx={{ 
              minWidth: { xs: 'auto', sm: 120 }, 
              fontWeight: 600,
              py: { xs: 1, sm: 1 },
              px: { xs: 1.5, sm: 2 },
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              textTransform: 'none',
              color: '#1e293b',
              '&:hover': {
                background: 'transparent',
                textDecoration: 'underline',
              }
            }}
          >
            Add Helper
          </Button>
          </Box>
        </Box>

        {/* Helpers Grid */}
        {helpers.length === 0 ? (
          <Box 
            textAlign="center" 
            py={{ xs: 6, sm: 8 }}
            sx={{
              p: 0,
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <MonetizationOnOutlinedIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              color="text.primary" 
              mb={1}
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontFamily: 'monospace' }}
            >
              No helpers added yet
            </Typography>
            <Typography 
              color="text.secondary" 
              mb={3}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontFamily: 'monospace' }}
            >
              Get started by adding your first household helper
            </Typography>
            <Button
              variant="text"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowAddHelper(true)}
              sx={{ 
                minWidth: { xs: 'auto', sm: 120 }, 
                fontWeight: 600,
                py: { xs: 1, sm: 1 },
                px: { xs: 1.5, sm: 2 },
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                textTransform: 'none',
                color: '#1e293b',
                '&:hover': {
                  background: 'transparent',
                  textDecoration: 'underline',
                }
              }}
            >
              Add Helper
            </Button>
          </Box>
        ) : (
          <Grid 
            container 
            spacing={{ xs: 1.5, sm: 2 }} 
            justifyContent="center" 
            sx={{ 
              width: '100%', 
              mx: 'auto'
            }}
          >
            {helpers.map((helper) => (
              <Grid 
                key={helper.id} 
                item 
                xs={12} 
                sm={6}
                md={4}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                }}
              >
                <HelperCard
                  helper={helper}
                  selectedMonth={selectedMonth}
                  onUpdate={fetchHelpers}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Add Helper Modal */}
      <AddHelperModal
        isOpen={showAddHelper}
        onClose={() => setShowAddHelper(false)}
        onAdd={handleAddHelper}
      />
    </Box>
  )
}
