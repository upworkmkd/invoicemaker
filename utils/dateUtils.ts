/**
 * Get the previous month in short format (e.g., "Dec", "Jan")
 */
export const getPreviousMonth = (): string => {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return previousMonth.toLocaleString('default', { month: 'short' });
};

/**
 * Get the previous month and year
 */
export const getPreviousMonthAndYear = (): { month: string; year: string } => {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    month: previousMonth.toLocaleString('default', { month: 'short' }),
    year: previousMonth.getFullYear().toString(),
  };
};
