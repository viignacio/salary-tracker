'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Stack, FormControlLabel, Checkbox } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AddBonusModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (purpose: string, amount: number, date: string, given: boolean, remarks?: string) => void
}

export default function AddBonusModal({ isOpen, onClose, onAdd }: AddBonusModalProps) {
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [given, setGiven] = useState(false)
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
    onAdd(purpose.trim(), numAmount, date, given, remarks?.trim() || undefined)
    setPurpose('')
    setAmount('')
    setDate('')
    setGiven(false)
    setRemarks('')
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
          color: '#059669',
          fontFamily: 'monospace',
        }}
      >
        Add Addition
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            '&:hover': {
              background: 'transparent',
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
              placeholder="e.g., Performance bonus, Holiday pay, Overtime pay"
              fullWidth
              required
              margin="dense"
              size="small"
              sx={{
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontFamily: 'monospace',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'monospace',
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
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontFamily: 'monospace',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'monospace',
                }
              }}
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
              margin="dense"
              size="small"
              sx={{
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontFamily: 'monospace',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'monospace',
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
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontFamily: 'monospace',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'monospace',
                }
              }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={given} 
                  onChange={e => setGiven(e.target.checked)} 
                  color="success"
                  sx={{
                    '&.Mui-checked': {
                      color: '#10b981',
                    }
                  }}
                />
              }
              label="Already Given"
              sx={{ 
                mt: 1,
                fontFamily: 'monospace',
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500,
                  fontFamily: 'monospace',
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
            variant="text"
            size="small"
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
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
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1, sm: 1 },
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              fontFamily: 'monospace',
              color: '#10b981',
              '&:hover': {
                background: 'transparent',
                textDecoration: 'underline',
              }
            }}
          >
            Add Addition
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 