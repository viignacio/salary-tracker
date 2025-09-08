'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import AddDeductionModal from './AddDeductionModal'
import AddBonusModal from './AddBonusModal'
import { Card, CardContent, Typography, Button, IconButton, TextField, Divider, List, ListItem, Box, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import React from 'react'

interface InvalidMonth {
  id: string
  helperId: string
  month: string
  year: number
  reason?: string | null
}

interface Deduction {
  id: string
  helperId: string
  purpose: string
  amount: number
  date: string
  month: string
  year: number
}

interface Bonus {
  id: string
  helperId: string
  purpose: string
  amount: number
  date: string
  month: string
  year: number
  given?: boolean
}

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

interface HelperCardProps {
  helper: Helper
  selectedMonth: string
  onUpdate: () => void
}

export default function HelperCard({ helper, selectedMonth, onUpdate }: HelperCardProps) {
  const [salary, setSalary] = useState<number>(0)
  const [isEditingSalary, setIsEditingSalary] = useState(false)
  const [showAddDeduction, setShowAddDeduction] = useState(false)
  const [showAddBonus, setShowAddBonus] = useState(false)
  const [monthDeductions, setMonthDeductions] = useState<Helper['deductions']>([])
  const [monthBonuses, setMonthBonuses] = useState<Helper['bonuses']>([])
  const [isPaying, setIsPaying] = useState(false)
  const [invalidMonth, setInvalidMonth] = useState<InvalidMonth | null>(null)
  const [showInvalidDialog, setShowInvalidDialog] = useState(false)
  const [invalidReason, setInvalidReason] = useState('')
  const [loadingInvalid, setLoadingInvalid] = useState(false)

  const [month, year] = selectedMonth.split('-')

  // Create stable references for the filtered data using useMemo
  const monthSalary = useMemo(() => {
    return helper.salaries.find(
      s => s.month === month && s.year === parseInt(year)
    )
  }, [helper.salaries, month, year])

  const monthDeductionsData = useMemo(() => {
    return helper.deductions.filter(
      d => d.month === month && d.year === parseInt(year)
    )
  }, [helper.deductions, month, year])

  const monthBonusesData = useMemo(() => {
    return helper.bonuses.filter(
      b => b.month === month && b.year === parseInt(year)
    )
  }, [helper.bonuses, month, year])

  // Update state when computed values change
  useEffect(() => {
    setSalary(monthSalary?.amount ?? 6000)
    setMonthDeductions(monthDeductionsData)
    setMonthBonuses(monthBonusesData)
  }, [monthSalary, monthDeductionsData, monthBonusesData])

  // Fetch invalid month when helper or month changes
  useEffect(() => {
    const fetchInvalidMonth = async () => {
      setLoadingInvalid(true)
      try {
        const res = await fetch(`/api/invalid-months?helperId=${helper.id}`)
        if (res.ok) {
          const data = await res.json()
          const found = data.find((m: InvalidMonth) => m.month === month && m.year === parseInt(year))
          setInvalidMonth(found || null)
        } else {
          setInvalidMonth(null)
        }
      } catch {
        setInvalidMonth(null)
      } finally {
        setLoadingInvalid(false)
      }
    }
    fetchInvalidMonth()
  }, [helper.id, month, year])

  const totalDeductions = monthDeductions.reduce((sum, d) => sum + d.amount, 0)
  const totalBonuses = monthBonuses.reduce((sum, b) => sum + b.amount, 0)
  
  // Calculate net pay excluding "Fully paid" deduction
  const deductionsExcludingFullyPaid = monthDeductions
    .filter(d => d.purpose !== 'Fully paid')
    .reduce((sum, d) => sum + d.amount, 0)
  const netPay = salary + totalBonuses - deductionsExcludingFullyPaid

  // Check if "Fully paid" deduction exists for this month
  const isFullyPaid = monthDeductions.some(d => d.purpose === 'Fully paid')

  // Calculate To Pay: salary + sum of bonuses not given - deductions
  const totalBonusesToPay = monthBonuses.filter(b => !b.given).reduce((sum, b) => sum + b.amount, 0)
  const toPay = salary + totalBonusesToPay - totalDeductions

  // Toggle bonus 'given' status
  const handleToggleBonusGiven = async (bonusId: string, given: boolean) => {
    try {
      await fetch('/api/bonuses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bonusId, given }),
      })
      
      // Update local bonuses state immediately
      setMonthBonuses(prevBonuses => 
        prevBonuses.map(bonus => 
          bonus.id === bonusId ? { ...bonus, given } : bonus
        )
      )
      
      onUpdate()
    } catch (error) {
      console.error('Error updating bonus given status:', error)
    }
  }

  const handleSalaryUpdate = async (newSalary: number) => {
    try {
      const response = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          amount: newSalary,
          month,
          year: parseInt(year),
        }),
      })

      if (response.ok) {
        setSalary(newSalary)
        setIsEditingSalary(false)
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating salary:', error)
    }
  }

  const handleAddDeduction = async (purpose: string, amount: number, date: string) => {
    try {
      const response = await fetch('/api/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          purpose,
          amount,
          date,
          month,
          year: parseInt(year),
        }),
      })

      if (response.ok) {
        setShowAddDeduction(false)
        // Fetch updated deductions data immediately
        try {
          const deductionsRes = await fetch('/api/deductions')
          if (deductionsRes.ok) {
            const allDeductions = await deductionsRes.json()
            const monthDeductions = allDeductions.filter(
              (d: Deduction) => d.helperId === helper.id && d.month === month && d.year === parseInt(year)
            )
            setMonthDeductions(monthDeductions)
          }
        } catch (error) {
          console.error('Error fetching updated deductions:', error)
        }
        onUpdate()
      }
    } catch (error) {
      console.error('Error adding deduction:', error)
    }
  }

  const handleAddBonus = async (purpose: string, amount: number, date: string, given: boolean) => {
    try {
      const response = await fetch('/api/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          purpose,
          amount,
          date,
          month,
          year: parseInt(year),
          given,
        }),
      })

      if (response.ok) {
        setShowAddBonus(false)
        // Fetch updated bonuses data immediately
        try {
          const bonusesRes = await fetch('/api/bonuses')
          if (bonusesRes.ok) {
            const allBonuses = await bonusesRes.json()
            const monthBonuses = allBonuses.filter(
              (b: Bonus) => b.helperId === helper.id && b.month === month && b.year === parseInt(year)
            )
            setMonthBonuses(monthBonuses)
          }
        } catch (error) {
          console.error('Error fetching updated bonuses:', error)
        }
        onUpdate()
      }
    } catch (error) {
      console.error('Error adding bonus:', error)
    }
  }

  const handleExportCSV = () => {
    const url = `/api/export?helperId=${helper.id}&month=${month}&year=${year}`
    window.open(url, '_blank')
  }

  const handleMarkPaid = async () => {
    if (toPay <= 0 || isFullyPaid) return
    setIsPaying(true)
    try {
      const response = await fetch('/api/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          purpose: 'Fully paid',
          amount: toPay,
          date: format(new Date(), 'yyyy-MM-dd'),
          month,
          year: parseInt(year),
        }),
      })
      if (response.ok) {
        // Fetch updated deductions data immediately
        try {
          const deductionsRes = await fetch('/api/deductions')
          if (deductionsRes.ok) {
            const allDeductions = await deductionsRes.json()
            const monthDeductions = allDeductions.filter(
              (d: Deduction) => d.helperId === helper.id && d.month === month && d.year === parseInt(year)
            )
            setMonthDeductions(monthDeductions)
          }
        } catch (error) {
          console.error('Error fetching updated deductions:', error)
        }
        onUpdate()
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
    } finally {
      setIsPaying(false)
    }
  }

  const handleUnmarkPaid = async () => {
    if (!isFullyPaid) return
    setIsPaying(true)
    try {
      // Find the "Fully paid" deduction
      const fullyPaidDeduction = monthDeductions.find(d => d.purpose === 'Fully paid')
      if (!fullyPaidDeduction) return

      const response = await fetch(`/api/deductions?id=${fullyPaidDeduction.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        // Fetch updated deductions data immediately
        try {
          const deductionsRes = await fetch('/api/deductions')
          if (deductionsRes.ok) {
            const allDeductions = await deductionsRes.json()
            const monthDeductions = allDeductions.filter(
              (d: Deduction) => d.helperId === helper.id && d.month === month && d.year === parseInt(year)
            )
            setMonthDeductions(monthDeductions)
          }
        } catch (error) {
          console.error('Error fetching updated deductions:', error)
        }
        onUpdate()
      }
    } catch (error) {
      console.error('Error unmarking as paid:', error)
    } finally {
      setIsPaying(false)
    }
  }

  const handleMarkInvalid = async () => {
    setLoadingInvalid(true)
    try {
      const res = await fetch('/api/invalid-months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          month,
          year: parseInt(year),
          reason: invalidReason,
        }),
      })
      if (res.ok) {
        setShowInvalidDialog(false)
        setInvalidReason('')
        // Refresh invalid month status
        const invalidRes = await fetch(`/api/invalid-months?helperId=${helper.id}`)
        if (invalidRes.ok) {
          const data = await invalidRes.json()
          const found = data.find((m: InvalidMonth) => m.month === month && m.year === parseInt(year))
          setInvalidMonth(found || null)
        }
        onUpdate()
      } else if (res.status === 409) {
        // Month is already marked as invalid
        setShowInvalidDialog(false)
        setInvalidReason('')
        // Refresh invalid month status
        const invalidRes = await fetch(`/api/invalid-months?helperId=${helper.id}`)
        if (invalidRes.ok) {
          const data = await invalidRes.json()
          const found = data.find((m: InvalidMonth) => m.month === month && m.year === parseInt(year))
          setInvalidMonth(found || null)
        }
        onUpdate()
      } else {
        console.error('Failed to mark month as invalid:', res.status, await res.text())
      }
    } catch (error) {
      console.error('Error marking month as invalid:', error)
    } finally {
      setLoadingInvalid(false)
    }
  }

  const handleUnmarkInvalid = async () => {
    setLoadingInvalid(true)
    try {
      const res = await fetch(`/api/invalid-months?helperId=${helper.id}&month=${month}&year=${year}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        // Clear the invalid month status immediately
        setInvalidMonth(null)
        onUpdate()
      }
    } finally {
      setLoadingInvalid(false)
    }
  }

  return (
    <Card elevation={0} sx={{ 
      borderRadius: 4, 
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      height: '100%', // Make card take full height
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      }
    }}>
      <CardContent sx={{ 
        p: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
      }}>
        {/* Invalid Month Banner */}
        {invalidMonth && (
          <Alert 
            severity="warning" 
            icon={<WarningAmberIcon />} 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: 'rgba(255, 255, 255, 0.9)',
              '& .MuiAlert-icon': {
                color: '#fbbf24',
                alignSelf: 'center',
              },
              '& .MuiAlert-message': {
                color: 'rgba(255, 255, 255, 0.9)',
              }
            }}
          >
            <strong>This month is marked as invalid.</strong>
            {invalidMonth.reason && (
              <><br />Reason: {invalidMonth.reason}</>
            )}
          </Alert>
        )}
        {/* Header */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'row', sm: 'row' }}
          alignItems={{ xs: 'center', sm: 'center' }} 
          justifyContent="space-between" 
          gap={{ xs: 1, sm: 0 }}
          mb={3}
          pb={2}
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        >
          <Typography 
            variant="h5" 
            fontWeight={700}
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {helper.name}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              sx={{ 
                fontWeight: 600,
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#6366f1',
                '&:hover': {
                  borderColor: '#6366f1',
                  background: 'rgba(99, 102, 241, 0.05)',
                }
              }}
            >
              Export
            </Button>
          </Box>
        </Box>
        
        {/* Main Content with Flexbox */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 3,
          }}
        >
          {/* Scrollable Content Area */}
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              flex: 1,
              minHeight: 0, // Allow shrinking
            }}
          >
        {/* Salary Section */}
        <Box 
          p={3}
          sx={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: 3,
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <Box 
            display="flex" 
            flexDirection="row"
            alignItems="center"
            gap={1}
            mb={2}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Monthly Salary
            </Typography>
            {!isEditingSalary && (
              <IconButton 
                color="primary" 
                onClick={() => setIsEditingSalary(true)} 
                size="small" 
                sx={{ 
                  ml: 0,
                  background: 'rgba(99, 102, 241, 0.1)',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          {isEditingSalary ? (
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }} 
              gap={{ xs: 1, sm: 1 }}
            >
              <TextField
                type="number"
                value={salary === 0 ? '' : salary}
                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                onFocus={() => { if (salary === 0) setSalary(NaN); }}
                size="small"
                variant="outlined"
                placeholder="0"
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ 
                  flex: 1,
                  '& .MuiOutlinedInput-input': {
                    color: 'text.primary',
                    fontWeight: 500,
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                  },
                }}
              />
              <Box 
                display="flex" 
                gap={1}
                sx={{ flexDirection: { xs: 'row', sm: 'row' } }}
              >
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => handleSalaryUpdate(isNaN(salary) ? 0 : salary)}
                  sx={{ flex: { xs: 1, sm: 'auto' } }}
                >
                  Save
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={() => setIsEditingSalary(false)}
                  sx={{ flex: { xs: 1, sm: 'auto' } }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography 
              variant="h4" 
              color="success.main" 
              fontWeight={700}
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2rem' },
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
              }}
            >
              ₱{salary.toFixed(2)}
            </Typography>
          )}
        </Box>

        {/* Deductions Section */}
        <Box 
          p={3}
          sx={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
            borderRadius: 3,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            minHeight: 120, // Consistent minimum height
          }}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: 'row', sm: 'row' }}
            alignItems={{ xs: 'center', sm: 'center' }} 
            justifyContent="space-between" 
            gap={{ xs: 1, sm: 0 }}
            mb={2}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: '#dc2626',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Deductions
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<AddIcon />}
                onClick={() => setShowAddDeduction(true)}
                sx={{ 
                  fontWeight: 600,
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  '&:hover': {
                    borderColor: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.05)',
                  }
                }}
              >
                Add
              </Button>
            </Box>
          </Box>
          {monthDeductions.length === 0 ? (
            <Box 
              textAlign="center" 
              py={2}
              sx={{
                background: 'rgba(239, 68, 68, 0.03)',
                borderRadius: 2,
                border: '1px dashed rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 60,
              }}
            >
              <Typography 
                color="text.secondary" 
                fontSize={14}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                No deductions for this month
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {monthDeductions.map((deduction, idx) => (
                <React.Fragment key={deduction.id}>
                  <ListItem sx={{ pl: 0, pr: 0 }} disableGutters>
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="flex-start"
                      width="100%"
                      gap={1}
                    >
                      {/* Amount+Icon and Date (always column) */}
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        minWidth={90}
                        sx={{ mr: { sm: 1 } }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <RemoveCircleOutlineIcon fontSize="small" color="error" />
                          <Typography
                            fontWeight={600}
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              color: 'rgba(255, 255, 255, 0.9)'
                            }}
                          >
                            ₱{deduction.amount.toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mt: 0.5 }}
                        >
                          {format(new Date(deduction.date), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      {/* Reason chip and Delete Icon in same row, vertically centered */}
                      <Box flex={1} display="flex" alignItems="center" justifyContent="flex-start" gap={1}>
                        <Chip
                          label={deduction.purpose}
                          size="small"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            '& .MuiChip-label': {
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontWeight: 600
                            }
                          }}
                        />
                        <Box ml="auto" display="flex" alignItems="center">
                          <IconButton
                            edge="end"
                            aria-label="delete deduction"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            onClick={async () => {
                              if (window.confirm('Delete this deduction?')) {
                                const response = await fetch(`/api/deductions?id=${deduction.id}`, { method: 'DELETE' })
                                if (response.ok) {
                                  // Update local deductions state immediately
                                  setMonthDeductions(prevDeductions => 
                                    prevDeductions.filter(d => d.id !== deduction.id)
                                  )
                                }
                                onUpdate()
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {idx < monthDeductions.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
          {monthDeductions.length > 0 && (
            <Box mt={2} pt={2} borderTop={1} borderColor="grey.200">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography 
                  fontWeight={600}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  Total Deductions:
                </Typography>
                <Typography 
                  fontWeight={700}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <RemoveCircleOutlineIcon fontSize="small" sx={{ mr: 0.5, color: 'rgba(255, 255, 255, 0.7)' }} />₱{totalDeductions.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>


        {/* Additions Section */}
        <Box 
          p={3}
          sx={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: 3,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            minHeight: 120, // Consistent minimum height
          }}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: 'row', sm: 'row' }}
            alignItems={{ xs: 'center', sm: 'center' }} 
            justifyContent="space-between" 
            gap={{ xs: 1, sm: 0 }}
            mb={2}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Additions
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}>
              <Button
                variant="outlined"
                size="small"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setShowAddBonus(true)}
                sx={{ 
                  fontWeight: 600,
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    borderColor: '#10b981',
                    background: 'rgba(16, 185, 129, 0.05)',
                  }
                }}
              >
                Add
              </Button>
            </Box>
          </Box>
          {monthBonuses.length === 0 ? (
            <Box 
              textAlign="center" 
              py={2}
              sx={{
                background: 'rgba(16, 185, 129, 0.03)',
                borderRadius: 2,
                border: '1px dashed rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 60,
              }}
            >
              <Typography 
                color="text.secondary" 
                fontSize={14}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                No additions for this month
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {monthBonuses.map((bonus, idx) => (
                <React.Fragment key={bonus.id}>
                  <ListItem sx={{ pl: 0, pr: 0 }} disableGutters>
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="flex-start"
                      width="100%"
                      gap={1}
                    >
                      {/* Amount+Icon and Date (always column) */}
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        minWidth={90}
                        sx={{ mr: { sm: 1 } }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <AddCircleOutlineIcon 
                            fontSize="small" 
                            sx={{ 
                              color: bonus.given ? 'rgba(255, 255, 255, 0.4)' : '#10b981' 
                            }} 
                          />
                          <Typography
                            fontWeight={600}
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              color: bonus.given ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)'
                            }}
                          >
                            ₱{bonus.amount.toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                            mt: 0.5,
                            color: bonus.given ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.6)'
                          }}
                        >
                          {format(new Date(bonus.date), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      {/* Reason chip and action buttons */}
                      <Box flex={1} display="flex" alignItems="center" justifyContent="flex-start" gap={1}>
                        <Chip
                          label={bonus.purpose}
                          size="small"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                            backgroundColor: bonus.given ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                            color: bonus.given ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                            border: bonus.given ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
                            '& .MuiChip-label': {
                              color: bonus.given ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: 600
                            }
                          }}
                        />
                        <Box ml="auto" display="flex" alignItems="center" gap={0.5}>
                          {/* Given toggle - Circle checkbox */}
                          <IconButton
                            size="small"
                            onClick={() => handleToggleBonusGiven(bonus.id, !bonus.given)}
                            sx={{ 
                              p: 0.5,
                              '&:hover': {
                                backgroundColor: bonus.given ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                              }
                            }}
                            aria-label={bonus.given ? 'Mark as not given' : 'Mark as given'}
                          >
                            {bonus.given ? (
                              <CheckCircleIcon 
                                sx={{ 
                                  color: '#10b981', 
                                  fontSize: 20,
                                  '&:hover': {
                                    color: '#059669',
                                  }
                                }} 
                              />
                            ) : (
                              <RadioButtonUncheckedIcon 
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.6)', 
                                  fontSize: 20,
                                  '&:hover': {
                                    color: 'rgba(255, 255, 255, 0.8)',
                                  }
                                }} 
                              />
                            )}
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete bonus"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            onClick={async () => {
                              if (window.confirm('Delete this addition?')) {
                                const response = await fetch(`/api/bonuses?id=${bonus.id}`, { method: 'DELETE' })
                                if (response.ok) {
                                  // Update local bonuses state immediately
                                  setMonthBonuses(prevBonuses => 
                                    prevBonuses.filter(b => b.id !== bonus.id)
                                  )
                                }
                                onUpdate()
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {idx < monthBonuses.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
          {monthBonuses.length > 0 && (
            <Box mt={2} pt={2} borderTop={1} borderColor="grey.200">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography 
                  fontWeight={600}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  Total Additions:
                </Typography>
                <Typography 
                  fontWeight={700}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <AddCircleOutlineIcon fontSize="small" sx={{ mr: 0.5, color: 'rgba(255, 255, 255, 0.7)' }} />₱{totalBonuses.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
          </Box> {/* Close Scrollable Content Area */}

          {/* Bottom Section - Always Sticky */}
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              flexShrink: 0, // Don't shrink this section
            }}
          >
            {/* Divider */}
            <Box sx={{ height: '32px', display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: '100%', 
                  height: '1px', 
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)' 
                }} 
              />
            </Box>
        {/* Net Pay Section */}
        <Box 
          p={3}
          sx={{
            background: netPay >= 0 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            borderRadius: 3,
            border: netPay >= 0 
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: netPay >= 0 ? '#059669' : '#dc2626',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Net Pay:
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              color={netPay >= 0 ? 'success.main' : 'error.main'}
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2rem' },
                background: netPay >= 0 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: netPay >= 0 
                  ? '0 2px 4px rgba(16, 185, 129, 0.1)'
                  : '0 2px 4px rgba(239, 68, 68, 0.1)',
              }}
            >
              ₱{netPay.toFixed(2)}
            </Typography>
          </Box>
          <Button
            fullWidth
            variant={isFullyPaid ? 'contained' : 'contained'}
            color={isFullyPaid ? 'error' : 'success'}
            onClick={isFullyPaid ? handleUnmarkPaid : handleMarkPaid}
            disabled={(!isFullyPaid && toPay <= 0) || isPaying}
            sx={{ 
              fontWeight: 700, 
              py: { xs: 1.5, sm: 1.2 }, 
              mb: 2,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              borderRadius: 2,
              background: isFullyPaid 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: isFullyPaid 
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              }
            }}
          >
            {isFullyPaid ? (isPaying ? 'Unmarking...' : 'Unmark as Paid') : (isPaying ? 'Marking...' : 'Mark as Paid')}
          </Button>
        </Box>
        {/* Mark/Unmark Invalid Button */}
        <Box>
          {invalidMonth ? (
            <Button
              variant="contained"
              color="warning"
              onClick={handleUnmarkInvalid}
              disabled={loadingInvalid}
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                }
              }}
              fullWidth
            >
              Unmark as Invalid
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setShowInvalidDialog(true)}
              disabled={loadingInvalid}
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                borderRadius: 2,
                borderColor: '#f59e0b',
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.1)',
                '&:hover': {
                  borderColor: '#d97706',
                  color: '#d97706',
                  background: 'rgba(245, 158, 11, 0.2)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  color: 'rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.05)',
                }
              }}
              fullWidth
            >
              Mark as Invalid
            </Button>
          )}
        </Box>
        {/* Reason Dialog */}
        <Dialog open={showInvalidDialog} onClose={() => setShowInvalidDialog(false)}>
          <DialogTitle>Mark Month as Invalid</DialogTitle>
          <form onSubmit={e => { e.preventDefault(); handleMarkInvalid(); }}>
            <DialogContent sx={{ px: { xs: 3, sm: 4 }, pt: 3, pb: 2 }}>
              <Stack spacing={2}>
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Optionally specify a reason for marking this month as invalid (e.g., not started, on leave):
                </Typography>
                <TextField
                  label="Reason"
                  value={invalidReason}
                  onChange={e => setInvalidReason(e.target.value)}
                  fullWidth
                  autoFocus
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 3, sm: 4 }, pb: 3, pt: 2 }}>
              <Button onClick={() => setShowInvalidDialog(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="warning" disabled={loadingInvalid}>Mark as Invalid</Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* To Pay Section */}
        <Box 
          p={3}
          sx={{
            background: toPay >= 0 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            borderRadius: 3,
            border: toPay >= 0 
              ? '1px solid rgba(99, 102, 241, 0.4)'
              : '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography 
              fontWeight={700} 
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: toPay >= 0 ? '#6366f1' : '#dc2626',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              To Pay:
            </Typography>
            <Typography 
              fontWeight={700} 
              color={toPay >= 0 ? 'primary.main' : 'error.main'} 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                background: toPay >= 0 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: toPay >= 0 
                  ? '0 2px 4px rgba(99, 102, 241, 0.1)'
                  : '0 2px 4px rgba(239, 68, 68, 0.1)',
              }}
            >
              ₱{toPay.toFixed(2)}
            </Typography>
          </Box>
        </Box>
          </Box> {/* Close Bottom Section */}
        </Box> {/* Close Main Content Flexbox */}
      </CardContent>
      <AddDeductionModal
        isOpen={showAddDeduction}
        onClose={() => setShowAddDeduction(false)}
        onAdd={handleAddDeduction}
      />
      <AddBonusModal
        isOpen={showAddBonus}
        onClose={() => setShowAddBonus(false)}
        onAdd={handleAddBonus}
      />
    </Card>
  )
} 