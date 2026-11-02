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
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Add helper
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Helper name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter helper's name"
            fullWidth
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="text">Cancel</Button>
          <Button type="submit" variant="contained">Add helper</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
