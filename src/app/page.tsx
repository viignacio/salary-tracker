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
      
      // Calculate totals
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
      const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0)
      const netPay = salaryAmount + totalBonuses - totalDeductions
      
      // Check if there's a "Fully paid" deduction that covers the net pay
      const fullyPaidDeduction = deductions.find(d => d.purpose === 'Fully paid')
      const isFullyPaid = fullyPaidDeduction && fullyPaidDeduction.amount >= netPay
      
      console.log(`Helper ${helper.name}:`, {
        salaryAmount,
        totalDeductions,
        totalBonuses,
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
          <Typography mt={2} color="text.secondary">Checking authentication...</Typography>
        </Box>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
        <Box textAlign="center">
          <CircularProgress color="primary" />
          <Typography mt={2} color="text.secondary">Loading...</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      height="100vh" 
      sx={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <Container maxWidth={false} sx={{ 
        width: '80%', 
        py: { xs: 3, sm: 6 }, 
        px: { xs: 2, sm: 3 }, 
        position: 'relative', 
        zIndex: 1 
      }}>
        {/* Header */}
        <Box 
          mb={{ xs: 4, sm: 6 }}
          sx={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            p: { xs: 3, sm: 4 },
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            gap={{ xs: 2, sm: 0 }}
            mb={2}
          >
            <Box>
              <Typography 
                variant="h3" 
                fontWeight={700} 
                sx={{ 
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                  lineHeight: { xs: 1.2, sm: 1.3 },
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Claver GC Salary Tracker
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                Manage monthly salaries and deductions for your household helpers
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 1.5 },
                borderRadius: 2,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.05)',
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
          gap={{ xs: 2, sm: 3 }} 
          mb={{ xs: 4, sm: 6 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent={{ xs: 'stretch', sm: 'space-between' }}
          sx={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.7) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            p: 3,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddHelper(true)}
            sx={{ 
              minWidth: { xs: 'auto', sm: 160 }, 
              fontWeight: 600,
              py: { xs: 1.5, sm: 1.5 },
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                transform: 'translateY(-1px)',
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
            py={{ xs: 8, sm: 10 }}
            sx={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              }}
            >
              <MonetizationOnOutlinedIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography 
              variant="h5" 
              fontWeight={600} 
              color="text.primary" 
              mb={2}
              sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
              No helpers added yet
            </Typography>
            <Typography 
              color="text.secondary" 
              mb={4}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Get started by adding your first household helper
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddHelper(true)}
              sx={{ 
                minWidth: { xs: 'auto', sm: 160 }, 
                fontWeight: 600,
                py: { xs: 1.5, sm: 1.5 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Add Helper
            </Button>
          </Box>
        ) : (
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3 }} 
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
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  minWidth: { xs: '100%', sm: 'calc(50% - 12px)' },
                  maxWidth: { xs: '100%', sm: 'calc(50% - 12px)' }
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
