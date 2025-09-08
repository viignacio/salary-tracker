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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          pr: { xs: 1, sm: 1 },
          px: { xs: 3, sm: 4 },
          py: { xs: 3, sm: 3 },
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '1.25rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
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
            px: { xs: 3, sm: 4 }, 
            pt: { xs: 3, sm: 4 }, 
            pb: { xs: 2, sm: 3 } 
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
            px: { xs: 3, sm: 4 }, 
            pb: { xs: 3, sm: 4 }, 
            pt: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 1 },
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button 
            onClick={onClose} 
            color="inherit" 
            variant="outlined"
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
              py: { xs: 1.5, sm: 1 },
              borderRadius: 2,
              borderColor: 'rgba(0, 0, 0, 0.2)',
              '&:hover': {
                borderColor: '#64748b',
                background: 'rgba(100, 116, 139, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            sx={{ 
              flex: { xs: 1, sm: 'auto' },
              py: { xs: 1.5, sm: 1 },
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
        </DialogActions>
      </form>
    </Dialog>
  )
} 