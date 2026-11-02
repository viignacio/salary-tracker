'use client'

import * as React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Mirrors the hex values in src/app/tokens.css. MUI's createTheme decomposes
// palette colours in JS (getContrastText, alpha, …), which only understands
// hex/rgb/hsl — an oklch() or var(--…) string here throws at theme creation.
const color = {
  paper: '#f8f4f1',
  paper2: '#f1ece8',
  ink: '#1d1614',
  ink2: '#312926',
  muted: '#615955',
  rule: '#d9d3cf',
  accent2: '#bb3d31',
  focus: '#bd3a2b',
  cotton: '#fdfbf8',
  board: '#1f1917',
  boardType: '#f6f3ef',
  error: '#be2323',
  success: '#21763c',
  warning: '#a15c00',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: color.accent2, contrastText: color.boardType },
    secondary: { main: color.ink, contrastText: color.boardType },
    success: { main: color.success, contrastText: color.boardType },
    error: { main: color.error, contrastText: color.boardType },
    warning: { main: color.warning, contrastText: color.boardType },
    background: { default: color.paper, paper: color.cotton },
    text: { primary: color.ink, secondary: color.muted },
  },
  typography: {
    fontFamily: 'var(--font-body), ui-sans-serif, system-ui, sans-serif',
    h1: { fontWeight: 600, fontSize: '1.44rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, fontSize: '1.2rem', lineHeight: 1.3, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.3 },
    h4: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.3 },
    h5: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.3 },
    h6: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.3 },
    body1: { fontSize: '1rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'input, textarea, select': { fontSize: '16px' }, // stops iOS Safari's focus-zoom
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `2px solid ${color.focus}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: color.cotton,
          backgroundImage: 'linear-gradient(100deg, var(--color-cotton), transparent 45%), var(--tex-cotton)',
          boxShadow: 'var(--edge-stock), var(--cast-stock)',
          border: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 36,
          padding: '0 16px',
          borderRadius: 'var(--radius-stock)',
          transition: 'transform 120ms var(--ease-out), box-shadow 220ms var(--ease-out)',
          '&:active': { transform: 'translateY(1px)' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
        sizeSmall: { minHeight: 32 },
        contained: {
          backgroundColor: color.board,
          color: color.boardType,
          boxShadow: 'var(--cast-stock)',
          '&:hover': { backgroundColor: color.board, boxShadow: 'var(--cast-stock-lift)', transform: 'translateY(-1px)' },
        },
        outlined: {
          backgroundColor: color.cotton,
          backgroundImage: 'var(--tex-cotton)',
          color: color.ink,
          borderColor: color.rule,
          boxShadow: 'var(--edge-stock), var(--cast-stock)',
          '&:hover': { borderColor: color.rule, boxShadow: 'var(--edge-stock), var(--cast-stock-lift)', transform: 'translateY(-1px)' },
        },
        text: {
          color: color.muted,
          '&:hover': { backgroundColor: color.paper2, color: color.ink },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          position: 'relative',
          color: color.muted,
          transition: 'transform 120ms var(--ease-out), background-color 220ms var(--ease-out), color 220ms var(--ease-out)',
          '&::before': { content: '""', position: 'absolute', inset: -10 }, // 44px hit target without growing the glyph
          '&:hover': { backgroundColor: color.paper2, color: color.ink },
          '&:active': { transform: 'scale(0.92)' },
          '&.Mui-disabled': { opacity: 0.55 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-input)',
          minHeight: 44,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: color.rule, transition: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: color.muted },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color.ink2 },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: color.error },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 'var(--radius-stock)', fontWeight: 500 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          backgroundColor: color.cotton,
          boxShadow: '0 25px 50px -12px rgba(29, 22, 20, 0.25)',
          margin: 16,
          width: 'calc(100% - 32px)',
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}