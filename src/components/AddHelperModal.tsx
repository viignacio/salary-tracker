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
          fontFamily: 'monospace',
        }}
      >
        Add Helper
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
              color: '#6366f1',
              '&:hover': {
                background: 'transparent',
                textDecoration: 'underline',
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