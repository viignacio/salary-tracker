'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Stack } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AddDeductionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (purpose: string, amount: number, date: string, remarks?: string) => void
}

export default function AddDeductionModal({ isOpen, onClose, onAdd }: AddDeductionModalProps) {
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDate(format(new Date(), 'yyyy-MM-dd'))
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!purpose.trim() || !amount || !date) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    onAdd(purpose.trim(), numAmount, date, remarks?.trim() || undefined)
    setPurpose('')
    setAmount('')
    setDate('')
    setRemarks('')
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-error)' }}>
        Add deduction
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2.5}>
            <TextField
              label="Purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Cash advance, Loan payment"
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Amount"
              type="number"
              value={amount === '0' ? '' : amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => { if (amount === '0') setAmount('') }}
              placeholder="0.00"
              fullWidth
              required
              inputProps={{ min: 0.01, step: 0.01 }}
            />
            <TextField
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes or details"
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
            />
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="text">Cancel</Button>
          <Button type="submit" variant="contained" sx={{ backgroundColor: 'var(--color-error)', '&:hover': { backgroundColor: 'var(--color-error)' } }}>
            Add deduction
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
