/**
 * Safely parses a "yyyy-MM" string into a Date object at the 1st of the month,
 * set to midnight in the local timezone to avoid timezone-shifting bugs.
 */
export function parseYearMonth(selectedMonth: string): Date {
  const [yearStr, monthStr] = selectedMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  
  // Month is 1-indexed in "yyyy-MM", but the JS Date constructor expects 0-indexed month
  return new Date(year, month - 1, 1)
}
