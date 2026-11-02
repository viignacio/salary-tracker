'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

interface UnlockDialogProps {
  onUnlock: (password: string) => Promise<boolean>
}

export default function UnlockDialog({ onUnlock }: UnlockDialogProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || loading) return
    setError('')
    setLoading(true)
    const ok = await onUnlock(password)
    setLoading(false)
    if (!ok) {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  return (
    <Dialog
      open
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === 'backdropClick') return
      }}
      maxWidth="xs"
      fullWidth
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(29, 22, 20, 0.35)' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <LockOutlinedIcon fontSize="small" sx={{ color: 'var(--color-muted)' }} />
        Salary Tracker is locked
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 'var(--radius-input)' }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((show) => !show)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button type="submit" variant="contained" fullWidth disabled={!password || loading}>
            {loading ? 'Unlocking…' : 'Unlock'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
