'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Stack } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AddDeductionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (purpose: string, amount: number, date: string) => void
}

export default function AddDeductionModal({ isOpen, onClose, onAdd }: AddDeductionModalProps) {
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!purpose.trim() || !amount || !date) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    onAdd(purpose.trim(), numAmount, date)
    setPurpose('')
    setAmount('')
    setDate('')
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          mx: { xs: 2, sm: 'auto' },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
          background: '#ffffff',
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          pr: { xs: 1, sm: 1 },
          px: { xs: 2, sm: 2.5 },
          py: { xs: 2, sm: 2 },
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#dc2626',
        }}
      >
        Add Deduction
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            background: 'rgba(239, 68, 68, 0.1)',
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.2)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            px: { xs: 2, sm: 2.5 }, 
            pt: { xs: 2, sm: 2.5 }, 
            pb: { xs: 1.5, sm: 2 } 
          }}
        >
          <Stack spacing={{ xs: 2, sm: 2.5 }}>
            <TextField
              label="Purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Cash advance, Loan payment"
              fullWidth
              required
              margin="dense"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Amount"
              type="number"
              value={amount === '0' ? '' : amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => { if (amount === '0') setAmount(''); }}
              placeholder="0.00"
              fullWidth
              required
              margin="dense"
              inputProps={{ min: 0.01, step: 0.01 }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              required
              margin="dense"
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: { xs: 2, sm: 2.5 }, 
            pb: { xs: 2, sm: 2.5 }, 
            pt: { xs: 1.5, sm: 2 },
            gap: { xs: 1, sm: 1 },
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button 
            onClick={onClose} 
            color="inherit" 
            variant="outlined"
            size="small"
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
              py: { xs: 1, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              borderColor: 'rgba(0, 0, 0, 0.2)',
              fontSize: '0.8125rem',
              '&:hover': {
                borderColor: '#64748b',
                background: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="error"
            size="small"
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
              py: { xs: 1, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              background: '#dc2626',
              fontSize: '0.8125rem',
              '&:hover': {
                background: '#b91c1c',
              }
            }}
          >
            Add Deduction
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 