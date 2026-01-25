'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import AddDeductionModal from './AddDeductionModal'
import AddBonusModal from './AddBonusModal'
import { Card, CardContent, Typography, Button, IconButton, TextField, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
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
      borderRadius: 1, 
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#fefefe',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: '32px',
        top: 0,
        bottom: 0,
        width: '1px',
        background: 'rgba(0, 0, 0, 0.1)',
        zIndex: 1,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(0, 0, 0, 0.05) 23px, rgba(0, 0, 0, 0.05) 24px)',
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      <CardContent sx={{ 
        p: 0,
        pl: { xs: '4rem', sm: '4.5rem' },
        pr: { xs: '1.5rem', sm: '2rem' },
        pt: 0,
        pb: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        position: 'relative',
        zIndex: 2,
        fontFamily: 'monospace',
        lineHeight: '24px',
      }}>
        {/* Invalid Month Banner */}
        {invalidMonth && (
          <Alert 
            severity="warning" 
            icon={<WarningAmberIcon fontSize="small" />} 
            sx={{ 
              mb: 0,
              borderRadius: 1,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#92400e',
              py: 0,
              lineHeight: '24px',
              '& .MuiAlert-icon': {
                color: '#d97706',
              },
              '& .MuiAlert-message': {
                fontSize: '0.75rem',
                lineHeight: '24px',
                fontFamily: 'monospace',
              }
            }}
          >
            <strong style={{ fontFamily: 'monospace' }}>Invalid month.</strong>
            {invalidMonth.reason && <span style={{ fontFamily: 'monospace' }}> {invalidMonth.reason}</span>}
          </Alert>
        )}
        {/* Header */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'row', sm: 'row' }}
          alignItems={{ xs: 'center', sm: 'center' }} 
          justifyContent="space-between" 
          gap={0}
          mb={0}
          pb={0}
          sx={{ height: '24px', lineHeight: '24px', mt: '24px' }}
        >
          <Typography 
            variant="h6" 
            fontWeight={600}
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: '#1e293b',
              fontFamily: 'monospace',
              lineHeight: '24px',
              m: 0,
              p: 0,
              mt: 0,
              mb: 0,
              pt: 0,
              pb: 0,
              height: '24px',
            }}
          >
            {helper.name}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}>
            <IconButton
              size="small"
              onClick={handleExportCSV}
              sx={{ 
                p: 0.25,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.04)',
                  color: '#475569',
                }
              }}
            >
              <DownloadIcon sx={{ fontSize: '20px', width: '20px', height: '20px' }} />
            </IconButton>
          </Box>
        </Box>
        
        {/* Main Content with Flexbox */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 0,
            m: 0,
            p: 0,
            mt: 0,
            mb: 0,
            pt: 0,
            pb: 0,
            marginBottom: 0,
            paddingBottom: 0,
          }}
        >
          {/* Scrollable Content Area */}
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              flex: 1,
              minHeight: 0,
              m: 0,
              p: 0,
              mt: 0,
              mb: 0,
              pt: 0,
              pb: 0,
              marginBottom: 0,
              paddingBottom: 0,
              overflow: 'visible',
            }}
          >
        {/* Salary Section */}
        <Box mb={0} pb={0} mt={0} pt={0} sx={{ height: '24px', lineHeight: '24px', paddingBottom: 0, marginBottom: 0, paddingTop: 0, marginTop: 0, mb: '24px' }}>
          {isEditingSalary ? (
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }} 
              gap={0}
              sx={{ m: 0, p: 0 }}
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
                  fontFamily: 'monospace',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }
                }}
              />
              <Box 
                display="flex" 
                gap={0}
                sx={{ flexDirection: { xs: 'row', sm: 'row' } }}
              >
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => handleSalaryUpdate(isNaN(salary) ? 0 : salary)}
                  sx={{ 
                    flex: { xs: 1, sm: 'auto' },
                    py: 0.25,
                    px: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    minWidth: 'auto',
                    textTransform: 'none',
                  }}
                >
                  Save
                </Button>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => setIsEditingSalary(false)}
                  sx={{ 
                    flex: { xs: 1, sm: 'auto' },
                    py: 0.25,
                    px: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    minWidth: 'auto',
                    textTransform: 'none',
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={0} sx={{ m: 0, p: 0, lineHeight: '24px' }}>
              <Typography 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  color: '#1e293b',
                  fontFamily: 'monospace',
                  lineHeight: '24px',
                  m: 0,
                  p: 0,
                  mt: 0,
                  mb: 0,
                  pt: 0,
                  pb: 0,
                  height: '24px',
                }}
              >
                Salary: ₱{salary.toFixed(2)}
              </Typography>
              <IconButton 
                onClick={() => setIsEditingSalary(true)} 
                size="small" 
                sx={{ 
                  p: 0.25,
                  ml: 0,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                  '&:hover': {
                    background: 'transparent',
                    color: '#64748b',
                  }
                }}
              >
                <EditIcon sx={{ fontSize: '20px', width: '20px', height: '20px' }} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Deductions Section */}
        <Box mb={0} pb={0} mt={0} pt={0} sx={{ display: 'block', lineHeight: '24px', paddingBottom: 0, marginBottom: 0, paddingTop: 0, marginTop: '24px' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0} sx={{ height: '24px', lineHeight: '24px', width: '100%' }}>
            <Typography 
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                color: '#1e293b',
                fontFamily: 'monospace',
                lineHeight: '24px',
                m: 0,
                p: 0,
                mt: 0,
                mb: 0,
                pt: 0,
                pb: 0,
                height: '24px',
              }}
            >
              Deductions:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={() => setShowAddDeduction(true)}
                sx={{ 
                  p: 0.25,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                  '&:hover': {
                    background: 'transparent',
                    color: '#64748b',
                  }
                }}
              >
                <AddIcon sx={{ fontSize: '20px', width: '20px', height: '20px' }} />
              </IconButton>
            </Box>
          </Box>
          {monthDeductions.length === 0 ? (
            <Typography 
              sx={{ 
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                color: '#94a3b8',
                fontFamily: 'monospace',
                fontStyle: 'italic',
                lineHeight: '24px',
                m: 0,
                p: 0,
                mt: 0,
                mb: 0,
                pt: 0,
                pb: 0,
                height: '24px',
              }}
            >
              (none)
            </Typography>
          ) : (
            <Box component="ol" sx={{ pl: '8px', m: 0, listStyle: 'decimal', display: 'block' }}>
              {monthDeductions.map((deduction) => (
                <Box
                  key={deduction.id}
                  component="li"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={0}
                  sx={{ height: '24px', lineHeight: '24px' }}
                >
                  <Typography 
                    sx={{ 
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      color: '#1e293b',
                      fontFamily: 'monospace',
                      lineHeight: '24px',
                      m: 0,
                      p: 0,
                      mt: 0,
                      mb: 0,
                      pt: 0,
                      pb: 0,
                      height: '24px',
                    }}
                  >
                    {deduction.purpose} - ₱{deduction.amount.toFixed(2)} ({format(new Date(deduction.date), 'MMM dd')})
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: '16px' }}>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (window.confirm('Delete this deduction?')) {
                          const response = await fetch(`/api/deductions?id=${deduction.id}`, { method: 'DELETE' })
                          if (response.ok) {
                            setMonthDeductions(prevDeductions => 
                              prevDeductions.filter(d => d.id !== deduction.id)
                            )
                          }
                          onUpdate()
                        }
                      }}
                      sx={{ 
                        p: 0.25,
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                        '&:hover': {
                          background: 'transparent',
                          color: '#dc2626',
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '20px', fontFamily: 'monospace', lineHeight: '20px', height: '20px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>×</Typography>
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Additions Section */}
        <Box sx={{ m: 0, p: 0, mt: '24px', mb: 0, pt: 0, pb: 0, marginBottom: 0, paddingBottom: 0, marginTop: '24px', paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 0, lineHeight: '24px' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0} sx={{ height: '24px', lineHeight: '24px', m: 0, p: 0, width: '100%' }}>
            <Typography 
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                color: '#1e293b',
                fontFamily: 'monospace',
                lineHeight: '24px',
                m: 0,
                p: 0,
                mt: 0,
                mb: 0,
                pt: 0,
                pb: 0,
                height: '24px',
              }}
            >
              Additions:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={() => setShowAddBonus(true)}
                sx={{ 
                  p: 0.25,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                  '&:hover': {
                    background: 'transparent',
                    color: '#64748b',
                  }
                }}
              >
                <AddIcon sx={{ fontSize: '20px', width: '20px', height: '20px' }} />
              </IconButton>
            </Box>
          </Box>
          {monthBonuses.length === 0 ? (
            <Box sx={{ m: 0, p: 0, mb: 0, pb: 0, mt: 0, pt: 0, height: '24px', lineHeight: '24px', display: 'flex', alignItems: 'flex-start' }}>
              <Typography 
                component="div"
                sx={{ 
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  fontStyle: 'italic',
                  lineHeight: '24px',
                  m: 0,
                  p: 0,
                  mt: 0,
                  mb: 0,
                  pt: 0,
                  pb: 0,
                  display: 'block',
                  height: '24px',
                }}
              >
                (none)
              </Typography>
            </Box>
          ) : (
            <Box component="ol" sx={{ pl: '8px', m: 0, listStyle: 'decimal', display: 'block' }}>
              {monthBonuses.map((bonus) => (
                <Box
                  key={bonus.id}
                  component="li"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={0}
                  sx={{ height: '24px', lineHeight: '24px' }}
                >
                  <Box display="flex" alignItems="center" gap={0} sx={{ lineHeight: '24px' }}>
                    <Typography 
                      sx={{ 
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                        color: bonus.given ? '#94a3b8' : '#1e293b',
                        fontFamily: 'monospace',
                        textDecoration: bonus.given ? 'line-through' : 'none',
                        lineHeight: '24px',
                        m: 0,
                        p: 0,
                        mt: 0,
                        mb: 0,
                        pt: 0,
                        pb: 0,
                        height: '24px',
                      }}
                    >
                      {bonus.purpose} - ₱{bonus.amount.toFixed(2)} ({format(new Date(bonus.date), 'MMM dd')})
                    </Typography>
                    {bonus.given && (
                      <Typography 
                        sx={{ 
                          fontSize: '0.75rem',
                          color: '#10b981',
                          fontFamily: 'monospace',
                          m: 0,
                          p: 0,
                          mt: 0,
                          mb: 0,
                          pt: 0,
                          pb: 0,
                        }}
                      >
                        ✓
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={0} sx={{ justifyContent: 'flex-end', pr: '16px' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleBonusGiven(bonus.id, !bonus.given)}
                      sx={{ 
                        p: 0.25,
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                        '&:hover': {
                          background: 'transparent',
                          color: '#10b981',
                        }
                      }}
                      aria-label={bonus.given ? 'Mark as not given' : 'Mark as given'}
                    >
                      <Typography sx={{ fontSize: '20px', fontFamily: 'monospace', lineHeight: '20px', height: '20px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
                        {bonus.given ? '✓' : '○'}
                      </Typography>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (window.confirm('Delete this addition?')) {
                          const response = await fetch(`/api/bonuses?id=${bonus.id}`, { method: 'DELETE' })
                          if (response.ok) {
                            setMonthBonuses(prevBonuses => 
                              prevBonuses.filter(b => b.id !== bonus.id)
                            )
                          }
                          onUpdate()
                        }
                      }}
                      sx={{ 
                        p: 0.25,
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                        '&:hover': {
                          background: 'transparent',
                          color: '#dc2626',
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '20px', fontFamily: 'monospace', lineHeight: '20px', height: '20px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>×</Typography>
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
          </Box>{/* Close Scrollable Content Area */}
          {/* Bottom Section - Always Sticky */}
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              flexShrink: 0,
              m: 0,
              p: 0,
              mt: 0,
              mb: 0,
              pt: 0,
              pb: 0,
            }}
          >
        {/* Net Pay Section */}
        <Typography 
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            color: '#1e293b',
            fontFamily: 'monospace',
            lineHeight: '24px',
            m: 0,
            p: 0,
            mt: '24px',
            mb: 0,
            pt: 0,
            pb: 0,
            height: '24px',
          }}
        >
          Net Pay: ₱{netPay.toFixed(2)}
        </Typography>
        <Box 
          display="flex" 
          justifyContent="center" 
          gap={0} 
          flexWrap="wrap" 
          sx={{ 
            flexDirection: { xs: 'column', sm: 'row' },
            height: { xs: 'auto', sm: '24px' },
            lineHeight: '24px', 
            m: 0, 
            mt: '24px' 
          }}
        >
          <Button
            variant="text"
            size="small"
            onClick={isFullyPaid ? handleUnmarkPaid : handleMarkPaid}
            disabled={(!isFullyPaid && toPay <= 0) || isPaying}
            sx={{ 
              py: 0,
              px: 1,
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              fontFamily: 'monospace',
              textTransform: 'none',
              minWidth: 'auto',
              lineHeight: '24px',
              height: '24px',
              m: 0,
              color: isFullyPaid ? '#dc2626' : '#10b981',
              '&:hover': {
                background: 'transparent',
                textDecoration: 'underline',
              },
              '&:disabled': {
                color: '#94a3b8',
              }
            }}
          >
            {isFullyPaid ? (isPaying ? 'Unmarking...' : '[Unmark as Paid]') : (isPaying ? 'Marking...' : '[Mark as Paid]')}
          </Button>
          {invalidMonth ? (
            <Button
              variant="text"
              size="small"
              onClick={handleUnmarkInvalid}
              disabled={loadingInvalid}
              sx={{ 
                py: 0,
                px: 1,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontFamily: 'monospace',
                textTransform: 'none',
                minWidth: 'auto',
                lineHeight: '24px',
                height: '24px',
                m: 0,
                color: '#d97706',
                '&:hover': {
                  background: 'transparent',
                  textDecoration: 'underline',
                },
                '&:disabled': {
                  color: '#94a3b8',
                }
              }}
            >
              [Unmark as Invalid]
            </Button>
          ) : (
            <Button
              variant="text"
              size="small"
              onClick={() => setShowInvalidDialog(true)}
              disabled={loadingInvalid}
              sx={{ 
                py: 0,
                px: 1,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontFamily: 'monospace',
                textTransform: 'none',
                minWidth: 'auto',
                lineHeight: '24px',
                height: '24px',
                m: 0,
                color: '#d97706',
                '&:hover': {
                  background: 'transparent',
                  textDecoration: 'underline',
                },
                '&:disabled': {
                  color: '#94a3b8',
                }
              }}
            >
              [Mark as Invalid]
            </Button>
          )}
        </Box>
        {/* Reason Dialog */}
        <Dialog open={showInvalidDialog} onClose={() => setShowInvalidDialog(false)}>
          <DialogTitle sx={{ fontFamily: 'monospace' }}>Mark Month as Invalid</DialogTitle>
          <form onSubmit={e => { e.preventDefault(); handleMarkInvalid(); }}>
            <DialogContent sx={{ px: { xs: 3, sm: 4 }, pt: 3, pb: 2 }}>
              <Stack spacing={2}>
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontFamily: 'monospace' }}>
                  Optionally specify a reason for marking this month as invalid (e.g., not started, on leave):
                </Typography>
                <TextField
                  label="Reason"
                  value={invalidReason}
                  onChange={e => setInvalidReason(e.target.value)}
                  fullWidth
                  autoFocus
                  sx={{
                    fontFamily: 'monospace',
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 3, sm: 4 }, pb: 3, pt: 2 }}>
              <Button 
                onClick={() => setShowInvalidDialog(false)} 
                variant="text"
                size="small"
                sx={{ 
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 1, sm: 1 },
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontFamily: 'monospace',
                  '&:hover': {
                    background: 'transparent',
                    textDecoration: 'underline',
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="text"
                size="small"
                disabled={loadingInvalid}
                sx={{ 
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 1, sm: 1 },
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontFamily: 'monospace',
                  color: '#f59e0b',
                  '&:hover': {
                    background: 'transparent',
                    textDecoration: 'underline',
                  },
                  '&:disabled': {
                    color: 'rgba(0, 0, 0, 0.26)',
                  }
                }}
              >
                Mark as Invalid
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* To Pay Section */}
        <Typography 
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            color: '#1e293b',
            fontFamily: 'monospace',
            lineHeight: '24px',
            m: 0,
            p: 0,
            mt: 0,
            mb: 0,
            pt: 0,
            pb: 0,
            height: '24px',
          }}
        >
          To Pay: ₱{toPay.toFixed(2)}
        </Typography>
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