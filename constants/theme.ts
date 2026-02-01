export enum ThemeColor {
  PRIMARY = '#3B82F6',
  SECONDARY = '#64748B',
  SUCCESS = '#10B981',
  DANGER = '#EF4444',
  WARNING = '#F59E0B',
  BACKGROUND = '#FFFFFF',
  SURFACE = '#F8FAFC',
  TEXT_PRIMARY = '#1E293B',
  TEXT_SECONDARY = '#64748B',
  BORDER = '#E2E8F0',
}

export const THEME = {
  colors: {
    primary: ThemeColor.PRIMARY,
    secondary: ThemeColor.SECONDARY,
    success: ThemeColor.SUCCESS,
    danger: ThemeColor.DANGER,
    warning: ThemeColor.WARNING,
    background: ThemeColor.BACKGROUND,
    surface: ThemeColor.SURFACE,
    textPrimary: ThemeColor.TEXT_PRIMARY,
    textSecondary: ThemeColor.TEXT_SECONDARY,
    border: ThemeColor.BORDER,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
} as const;
