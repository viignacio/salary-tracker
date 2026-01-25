'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AddHelperModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string) => void
}

export default function AddHelperModal({ isOpen, onClose, onAdd }: AddHelperModalProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
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
          color: '#1e293b',
        }}
      >
        Add Helper
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
          <TextField
            label="Helper Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter helper's name"
            fullWidth
            required
            autoFocus
            margin="dense"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
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
            size="small"
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
              py: { xs: 1, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              background: '#6366f1',
              fontSize: '0.8125rem',
              '&:hover': {
                background: '#4f46e5',
              }
            }}
          >
            Add Helper
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 