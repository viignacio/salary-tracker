'use client'

import { useState, useEffect, useMemo, useRef, Dispatch, SetStateAction } from 'react'
import { format } from 'date-fns'
import { parseYearMonth } from '@/lib/date'
import AddDeductionModal from './AddDeductionModal'
import AddBonusModal from './AddBonusModal'
import { Card, CardContent, Typography, Button, IconButton, TextField, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Tooltip, Collapse } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import html2canvas from 'html2canvas'

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
  remarks?: string | null
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
  remarks?: string | null
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
    remarks?: string | null
  }>
  bonuses: Array<{
    id: string
    purpose: string
    amount: number
    date: string
    month: string
    year: number
    given?: boolean
    remarks?: string | null
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
  // Rows start expanded; a row's id goes in here only once the user collapses it.
  const [collapsedDeductionIds, setCollapsedDeductionIds] = useState<Set<string>>(new Set())
  const [collapsedBonusIds, setCollapsedBonusIds] = useState<Set<string>>(new Set())
  const toggleCollapsed = (set: Dispatch<SetStateAction<Set<string>>>, id: string) => {
    set(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const [actionError, setActionError] = useState<string | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Note: these records store the year in the field called "month" and the
  // month number in the field called "year" — matching the split below.
  const [yearStr, monthStr] = selectedMonth.split('-')

  // Create stable references for the filtered data using useMemo
  const monthSalary = useMemo(() => {
    const exact = helper.salaries.find(
      s => s.month === yearStr && s.year === parseInt(monthStr)
    )
    if (exact) return exact

    // No record for this month: fall back to the most recent prior salary
    // so an edited amount carries forward to succeeding months.
    const key = (s: { month: string; year: number }) => parseInt(s.month) * 100 + s.year
    const currentKey = parseInt(yearStr) * 100 + parseInt(monthStr)
    return helper.salaries
      .filter(s => key(s) < currentKey)
      .sort((a, b) => key(b) - key(a))[0]
  }, [helper.salaries, yearStr, monthStr])

  const monthDeductionsData = useMemo(() => {
    return helper.deductions.filter(
      d => d.month === yearStr && d.year === parseInt(monthStr)
    )
  }, [helper.deductions, yearStr, monthStr])

  const monthBonusesData = useMemo(() => {
    return helper.bonuses.filter(
      b => b.month === yearStr && b.year === parseInt(monthStr)
    )
  }, [helper.bonuses, yearStr, monthStr])

  // Update state when computed values change
  useEffect(() => {
    setSalary(monthSalary?.amount ?? 6000)
    setMonthDeductions(monthDeductionsData)
    setMonthBonuses(monthBonusesData)
  }, [monthSalary, monthDeductionsData, monthBonusesData])

  // Clear any stale action error from a previous month
  useEffect(() => {
    setActionError(null)
  }, [yearStr, monthStr])

  // Fetch invalid month when helper or month changes
  useEffect(() => {
    const fetchInvalidMonth = async () => {
      setLoadingInvalid(true)
      try {
        const res = await fetch(`/api/invalid-months?helperId=${helper.id}`)
        if (res.ok) {
          const data = await res.json()
          const found = data.find((m: InvalidMonth) => m.month === yearStr && m.year === parseInt(monthStr))
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
  }, [helper.id, yearStr, monthStr])

  const totalDeductions = monthDeductions.reduce((sum, d) => sum + d.amount, 0)
  // Only bonuses not yet given count toward net pay (given bonuses were already handed in advance)
  const totalBonusesToPay = monthBonuses.filter(b => !b.given).reduce((sum, b) => sum + b.amount, 0)

  // Calculate net pay excluding "Fully paid" deduction (only includes bonuses not yet given)
  const deductionsExcludingFullyPaid = monthDeductions
    .filter(d => d.purpose !== 'Fully paid')
    .reduce((sum, d) => sum + d.amount, 0)
  const netPay = salary + totalBonusesToPay - deductionsExcludingFullyPaid

  // Check if "Fully paid" deduction exists for this month
  const isFullyPaid = monthDeductions.some(d => d.purpose === 'Fully paid')

  // Calculate To Pay: salary + sum of bonuses not given - deductions
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
          month: yearStr,
          year: parseInt(monthStr),
        }),
      })

      if (response.ok) {
        setSalary(newSalary)
        setIsEditingSalary(false)
        setActionError(null)
        onUpdate()
      } else {
        setActionError('Could not save the salary. Please try again.')
      }
    } catch (error) {
      console.error('Error updating salary:', error)
      setActionError('Could not save the salary. Please try again.')
    }
  }

  const handleAddDeduction = async (purpose: string, amount: number, date: string, remarks?: string) => {
    try {
      const response = await fetch('/api/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          purpose,
          amount,
          date,
          month: yearStr,
          year: parseInt(monthStr),
          remarks: remarks != null && remarks.trim() !== '' ? remarks.trim() : undefined,
        }),
      })

      if (response.ok) {
        setShowAddDeduction(false)
        setActionError(null)
        // Fetch updated deductions data immediately
        try {
          const deductionsRes = await fetch('/api/deductions')
          if (deductionsRes.ok) {
            const allDeductions = await deductionsRes.json()
            const monthDeductions = allDeductions.filter(
              (d: Deduction) => d.helperId === helper.id && d.month === yearStr && d.year === parseInt(monthStr)
            )
            setMonthDeductions(monthDeductions)
          }
        } catch (error) {
          console.error('Error fetching updated deductions:', error)
        }
        onUpdate()
      } else {
        setActionError('Could not add the deduction. Please try again.')
      }
    } catch (error) {
      console.error('Error adding deduction:', error)
      setActionError('Could not add the deduction. Please try again.')
    }
  }

  const handleAddBonus = async (purpose: string, amount: number, date: string, given: boolean, remarks?: string) => {
    try {
      const response = await fetch('/api/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helper.id,
          purpose,
          amount,
          date,
          month: yearStr,
          year: parseInt(monthStr),
          given,
          remarks: remarks != null && remarks.trim() !== '' ? remarks.trim() : undefined,
        }),
      })

      if (response.ok) {
        setShowAddBonus(false)
        setActionError(null)
        // Fetch updated bonuses data immediately
        try {
          const bonusesRes = await fetch('/api/bonuses')
          if (bonusesRes.ok) {
            const allBonuses = await bonusesRes.json()
            const monthBonuses = allBonuses.filter(
              (b: Bonus) => b.helperId === helper.id && b.month === yearStr && b.year === parseInt(monthStr)
            )
            setMonthBonuses(monthBonuses)
          }
        } catch (error) {
          console.error('Error fetching updated bonuses:', error)
        }
        onUpdate()
      } else {
        setActionError('Could not add the bonus. Please try again.')
      }
    } catch (error) {
      console.error('Error adding bonus:', error)
      setActionError('Could not add the bonus. Please try again.')
    }
  }

  const handleExportCSV = () => {
    const url = `/api/export?helperId=${helper.id}&month=${yearStr}&year=${monthStr}`
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
          month: yearStr,
          year: parseInt(monthStr),
        }),
      })
      if (response.ok) {
        setActionError(null)
        // Fetch updated deductions data immediately
        try {
          const deductionsRes = await fetch('/api/deductions')
          if (deductionsRes.ok) {
            const allDeductions = await deductionsRes.json()
            const monthDeductions = allDeductions.filter(
              (d: Deduction) => d.helperId === helper.id && d.month === yearStr && d.year === parseInt(monthStr)
            )
            setMonthDeductions(monthDeductions)
          }
        } catch (error) {
          console.error('Error fetching updated deductions:', error)
        }
        onUpdate()
      } else {
        setActionError('Could not mark as paid. Please try again.')
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      setActionError('Could not mark as paid. Please try again.')
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
        setActionError(null)
        // Fetch updated deductions data immediately
        try {
          const deductionsRes = await fetch('/api/deductions')
          if (deductionsRes.ok) {
            const allDeductions = await deductionsRes.json()
            const monthDeductions = allDeductions.filter(
              (d: Deduction) => d.helperId === helper.id && d.month === yearStr && d.year === parseInt(monthStr)
            )
            setMonthDeductions(monthDeductions)
          }
        } catch (error) {
          console.error('Error fetching updated deductions:', error)
        }
        onUpdate()
      } else {
        setActionError('Could not unmark as paid. Please try again.')
      }
    } catch (error) {
      console.error('Error unmarking as paid:', error)
      setActionError('Could not unmark as paid. Please try again.')
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
          month: yearStr,
          year: parseInt(monthStr),
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
          const found = data.find((m: InvalidMonth) => m.month === yearStr && m.year === parseInt(monthStr))
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
          const found = data.find((m: InvalidMonth) => m.month === yearStr && m.year === parseInt(monthStr))
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
      const res = await fetch(`/api/invalid-months?helperId=${helper.id}&month=${yearStr}&year=${monthStr}`, {
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

  const handleSaveReceipt = async () => {
    const el = receiptRef.current
    if (!el) return
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#fdfbf8',
        useCORS: true,
      })
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const receiptDate = parseYearMonth(selectedMonth)
      const monthName = format(receiptDate, 'MMMM')
      const sanitizedName = helper.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '_') || 'Helper'
      const filename = `${monthName}_${sanitizedName}.jpg`
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      a.click()
    } catch (error) {
      console.error('Error saving receipt:', error)
    }
  }

  const rowSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderRadius: 'var(--radius-input)',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--color-paper-2)' },
  }

  const figureSx = { fontFamily: 'var(--font-outlier)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-ink)', fontSize: 'var(--text-sm)' }

  return (
    <Card elevation={0} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 'var(--space-md)', '&:last-child': { pb: 'var(--space-md)' }, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', flex: 1 }}>
        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)} sx={{ borderRadius: 'var(--radius-input)' }}>
            {actionError}
          </Alert>
        )}
        {invalidMonth && (
          <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ borderRadius: 'var(--radius-input)' }}>
            <strong>Invalid month.</strong>
            {invalidMonth.reason && <span> {invalidMonth.reason}</span>}
          </Alert>
        )}

        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="h3" sx={{ color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {helper.name}
          </Typography>
          <Tooltip title="Export CSV">
            <IconButton size="small" onClick={handleExportCSV} aria-label={`Export ${helper.name}'s records as CSV`}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Salary */}
        <Box>
          {isEditingSalary ? (
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <TextField
                type="number"
                value={salary === 0 ? '' : salary}
                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                onFocus={() => { if (salary === 0) setSalary(NaN) }}
                size="small"
                variant="outlined"
                placeholder="0"
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ flex: '1 1 140px' }}
              />
              <Button variant="contained" size="small" onClick={() => handleSalaryUpdate(isNaN(salary) ? 0 : salary)}>
                Save
              </Button>
              <Button variant="text" size="small" onClick={() => setIsEditingSalary(false)}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>
                Monthly salary: <Box component="span" sx={figureSx}>₱{salary.toFixed(2)}</Box>
              </Typography>
              <IconButton size="small" onClick={() => setIsEditingSalary(true)} aria-label="Edit monthly salary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Deductions */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', fontWeight: 600 }}>Deductions</Typography>
            <IconButton size="small" onClick={() => setShowAddDeduction(true)} aria-label="Add deduction">
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          {monthDeductions.length === 0 ? (
            <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontStyle: 'italic' }}>None</Typography>
          ) : (
            <Box component="ul" sx={{ pl: 0, m: 0, listStyle: 'none' }}>
              {monthDeductions.map((deduction) => {
                const isExpanded = !collapsedDeductionIds.has(deduction.id)
                return (
                  <Box key={deduction.id} component="li">
                    <Box
                      sx={{ ...rowSx, pl: 1, pr: 0.5 }}
                      onClick={() => toggleCollapsed(setCollapsedDeductionIds, deduction.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`deduction-remarks-${deduction.id}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleCollapsed(setCollapsedDeductionIds, deduction.id)
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        {isExpanded ? <ExpandLessIcon fontSize="small" sx={{ color: 'var(--color-muted)', flexShrink: 0 }} /> : <ExpandMoreIcon fontSize="small" sx={{ color: 'var(--color-muted)', flexShrink: 0 }} />}
                        <Tooltip title={deduction.purpose} arrow>
                          <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                            {deduction.purpose}
                          </Typography>
                        </Tooltip>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                        <Typography sx={figureSx}>
                          −₱{deduction.amount.toFixed(2)} ({format(new Date(deduction.date), 'MMM dd')})
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (window.confirm('Delete this deduction?')) {
                              const response = await fetch(`/api/deductions?id=${deduction.id}`, { method: 'DELETE' })
                              if (response.ok) {
                                setMonthDeductions(prevDeductions => prevDeductions.filter(d => d.id !== deduction.id))
                              }
                              onUpdate()
                            }
                          }}
                          aria-label={`Delete deduction: ${deduction.purpose}`}
                          sx={{ '&:hover': { color: 'var(--color-error)' } }}
                        >
                          <Typography sx={{ fontSize: '18px', lineHeight: 1, fontFamily: 'var(--font-body)' }}>×</Typography>
                        </IconButton>
                      </Box>
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box id={`deduction-remarks-${deduction.id}`} sx={{ pl: 'var(--space-xl)', pr: 'var(--space-md)', pt: 0, pb: 'var(--space-sm)' }}>
                        <Typography component="div" sx={{ fontSize: 'var(--text-sm)', color: deduction.remarks?.trim() ? 'var(--color-muted)' : 'var(--color-muted)', fontStyle: deduction.remarks?.trim() ? 'normal' : 'italic', whiteSpace: 'pre-wrap' }}>
                          {deduction.remarks?.trim() || 'No remarks'}
                        </Typography>
                      </Box>
                    </Collapse>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        {/* Bonuses */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', fontWeight: 600 }}>Bonus</Typography>
            <IconButton size="small" onClick={() => setShowAddBonus(true)} aria-label="Add bonus">
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          {monthBonuses.length === 0 ? (
            <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontStyle: 'italic' }}>None</Typography>
          ) : (
            <Box component="ul" sx={{ pl: 0, m: 0, listStyle: 'none' }}>
              {monthBonuses.map((bonus) => {
                const isExpanded = !collapsedBonusIds.has(bonus.id)
                return (
                  <Box key={bonus.id} component="li">
                    <Box
                      sx={{ ...rowSx, pl: 1, pr: 0.5 }}
                      onClick={() => toggleCollapsed(setCollapsedBonusIds, bonus.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`bonus-remarks-${bonus.id}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleCollapsed(setCollapsedBonusIds, bonus.id)
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        {isExpanded ? <ExpandLessIcon fontSize="small" sx={{ color: 'var(--color-muted)', flexShrink: 0 }} /> : <ExpandMoreIcon fontSize="small" sx={{ color: 'var(--color-muted)', flexShrink: 0 }} />}
                        <Tooltip title={bonus.purpose} arrow>
                          <Typography
                            sx={{
                              fontSize: 'var(--text-sm)',
                              color: bonus.given ? 'var(--color-muted)' : 'var(--color-ink)',
                              textDecoration: bonus.given ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                            }}
                          >
                            {bonus.purpose}
                          </Typography>
                        </Tooltip>
                        {bonus.given && (
                          <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', flexShrink: 0 }}>Given</Typography>
                        )}
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                        <Typography sx={{ ...figureSx, color: bonus.given ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: bonus.given ? 'line-through' : 'none' }}>
                          +₱{bonus.amount.toFixed(2)} ({format(new Date(bonus.date), 'MMM dd')})
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleToggleBonusGiven(bonus.id, !bonus.given) }}
                          aria-label={bonus.given ? 'Mark as not given' : 'Mark as given'}
                          sx={{ '&:hover': { color: 'var(--color-success)' } }}
                        >
                          <Typography sx={{ fontSize: '16px', lineHeight: 1, fontFamily: 'var(--font-body)' }}>{bonus.given ? '✓' : '○'}</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (window.confirm('Delete this addition?')) {
                              const response = await fetch(`/api/bonuses?id=${bonus.id}`, { method: 'DELETE' })
                              if (response.ok) {
                                setMonthBonuses(prevBonuses => prevBonuses.filter(b => b.id !== bonus.id))
                              }
                              onUpdate()
                            }
                          }}
                          aria-label={`Delete bonus: ${bonus.purpose}`}
                          sx={{ '&:hover': { color: 'var(--color-error)' } }}
                        >
                          <Typography sx={{ fontSize: '18px', lineHeight: 1, fontFamily: 'var(--font-body)' }}>×</Typography>
                        </IconButton>
                      </Box>
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box id={`bonus-remarks-${bonus.id}`} sx={{ pl: 'var(--space-xl)', pr: 'var(--space-md)', pt: 0, pb: 'var(--space-sm)' }}>
                        <Typography component="div" sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontStyle: bonus.remarks?.trim() ? 'normal' : 'italic', whiteSpace: 'pre-wrap' }}>
                          {bonus.remarks?.trim() || 'No remarks'}
                        </Typography>
                      </Box>
                    </Collapse>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        {/* Net pay and actions, pinned to the bottom of the card */}
        <Box sx={{ mt: 'auto', pt: 'var(--space-sm)', borderTop: '1px solid var(--color-rule)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', fontWeight: 600 }}>Net pay</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ ...figureSx, fontWeight: 600, fontSize: 'var(--text-md)' }}>₱{netPay.toFixed(2)}</Typography>
              {isFullyPaid && <Typography className="ink-stamp" sx={{ fontSize: 'var(--text-xs)' }}>Paid</Typography>}
            </Box>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              onClick={isFullyPaid ? handleUnmarkPaid : handleMarkPaid}
              disabled={(!isFullyPaid && toPay <= 0) || isPaying}
              sx={{ flex: '1 1 auto', color: isFullyPaid ? 'var(--color-error)' : 'var(--color-success)' }}
            >
              {isFullyPaid ? (isPaying ? 'Unmarking…' : 'Unmark as paid') : (isPaying ? 'Marking…' : 'Mark as paid')}
            </Button>
            {invalidMonth ? (
              <Button variant="outlined" size="small" onClick={handleUnmarkInvalid} disabled={loadingInvalid} sx={{ flex: '1 1 auto', color: 'var(--color-warning)' }}>
                Unmark as invalid
              </Button>
            ) : (
              <Button variant="outlined" size="small" onClick={() => setShowInvalidDialog(true)} disabled={loadingInvalid} sx={{ flex: '1 1 auto', color: 'var(--color-warning)' }}>
                Mark as invalid
              </Button>
            )}
          </Box>
          <Button variant="contained" size="small" fullWidth onClick={handleSaveReceipt}>
            Save payslip
          </Button>
        </Box>

        {/* Reason Dialog */}
        <Dialog open={showInvalidDialog} onClose={() => setShowInvalidDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Mark month as invalid</DialogTitle>
          <form onSubmit={e => { e.preventDefault(); handleMarkInvalid() }}>
            <DialogContent>
              <Stack spacing={2}>
                <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                  Optionally say why (e.g. not started, on leave).
                </Typography>
                <TextField label="Reason" value={invalidReason} onChange={e => setInvalidReason(e.target.value)} fullWidth autoFocus />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowInvalidDialog(false)} variant="text">Cancel</Button>
              <Button type="submit" variant="contained" disabled={loadingInvalid}>Mark as invalid</Button>
            </DialogActions>
          </form>
        </Dialog>
      </CardContent>

      <AddDeductionModal isOpen={showAddDeduction} onClose={() => setShowAddDeduction(false)} onAdd={handleAddDeduction} />
      <AddBonusModal isOpen={showAddBonus} onClose={() => setShowAddBonus(false)} onAdd={handleAddBonus} />

      {/* Hidden payslip for html2canvas capture: plain markup only, no textures,
          filters or oklch shadows — html2canvas cannot render any of those. */}
      <div
        ref={receiptRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '380px',
          padding: '24px',
          backgroundColor: 'var(--color-cotton)',
          border: '1px solid var(--color-rule)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-print)',
          lineHeight: 1.5,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', borderBottom: '1px solid var(--color-rule)', paddingBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>Payslip</span>
          <span style={{ fontWeight: 400, fontSize: '13px' }}>{format(parseYearMonth(selectedMonth), 'MMMM yyyy')}</span>
        </div>
        <div style={{ marginBottom: '12px', fontWeight: 600 }}>{helper.name}</div>
        <div style={{ marginBottom: '8px', fontFamily: 'var(--font-outlier)' }}>
          Monthly salary: ₱{salary.toFixed(2)}
        </div>
        <div style={{ marginBottom: '4px', fontWeight: 600 }}>Deductions</div>
        {monthDeductions.length === 0 ? (
          <div style={{ marginBottom: '12px', color: 'var(--color-muted)' }}>None</div>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            {monthDeductions.map((d) => (
              <div key={d.id} style={{ marginBottom: '8px', paddingLeft: '8px' }}>
                <div style={{ fontFamily: 'var(--font-outlier)' }}>{d.purpose} — ₱{d.amount.toFixed(2)} ({format(new Date(d.date), 'MMM dd')})</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', whiteSpace: 'pre-wrap', marginTop: '2px', paddingLeft: '8px' }}>
                  {d.remarks?.trim() || 'No remarks'}
                </div>
              </div>
            ))}
          </div>
        )}
        {monthBonuses.length > 0 && monthBonuses.reduce((sum, b) => sum + b.amount, 0) > 0 && (
          <>
            <div style={{ marginBottom: '4px', fontWeight: 600 }}>Bonus</div>
            <div style={{ marginBottom: '12px' }}>
              {monthBonuses.map((b) => (
                <div key={b.id} style={{ marginBottom: '8px', paddingLeft: '8px' }}>
                  <div style={{ fontFamily: 'var(--font-outlier)' }}>{b.purpose} — ₱{b.amount.toFixed(2)} ({format(new Date(b.date), 'MMM dd')})</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', whiteSpace: 'pre-wrap', marginTop: '2px', paddingLeft: '8px' }}>
                    {b.remarks?.trim() || 'No remarks'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-rule)', fontWeight: 600, fontSize: '15px', fontFamily: 'var(--font-outlier)' }}>
          Net pay: ₱{netPay.toFixed(2)}
        </div>
      </div>
    </Card>
  )
}
