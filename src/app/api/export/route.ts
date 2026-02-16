import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const helperId = searchParams.get('helperId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!helperId || !month || !year) {
      return NextResponse.json(
        { error: 'Helper ID, month, and year are required' },
        { status: 400 }
      )
    }

    // Get helper details
    const helper = await prisma.helper.findUnique({
      where: { id: helperId },
    })

    if (!helper) {
      return NextResponse.json(
        { error: 'Helper not found' },
        { status: 404 }
      )
    }

    // Get salary for the month
    const salary = await prisma.salary.findUnique({
      where: {
        helperId_month_year: {
          helperId,
          month,
          year: parseInt(year),
        },
      },
    })

    // Get deductions for the month
    const deductions = await prisma.deduction.findMany({
      where: {
        helperId,
        month,
        year: parseInt(year),
      },
      orderBy: { date: 'asc' },
    })

    // Get bonuses for the month
    const bonuses = await prisma.bonus.findMany({
      where: {
        helperId,
        month,
        year: parseInt(year),
      },
      orderBy: { date: 'asc' },
    })

    // Calculate net pay (only bonuses not yet given count; given bonuses were already handed in advance)
    const salaryAmount = salary?.amount || 0
    const totalDeductions = deductions.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0)
    const totalBonuses = bonuses.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0)
    const totalBonusesNotGiven = bonuses
      .filter((b: { given?: boolean }) => !b.given)
      .reduce((sum: number, b: { amount: number }) => sum + b.amount, 0)
    const netPay = salaryAmount + totalBonusesNotGiven - totalDeductions

    // Generate CSV content
    const csvContent = [
      ['Helper Name', helper.name],
      ['Month/Year', `${month}/${year}`],
      [''],
      ['Salary', `₱${salaryAmount.toFixed(2)}`],
      [''],
      ['Bonuses'],
      ['Date', 'Purpose', 'Amount'],
      ...bonuses.map((b: { date: Date; purpose: string; amount: number }) => [
        format(new Date(b.date), 'MM/dd/yyyy'),
        b.purpose,
        `₱${b.amount.toFixed(2)}`
      ]),
      [''],
      ['Total Bonuses', `₱${totalBonuses.toFixed(2)}`],
      [''],
      ['Deductions'],
      ['Date', 'Purpose', 'Amount'],
      ...deductions.map((d: { date: Date; purpose: string; amount: number }) => [
        format(new Date(d.date), 'MM/dd/yyyy'),
        d.purpose,
        `₱${d.amount.toFixed(2)}`
      ]),
      [''],
      ['Total Deductions', `₱${totalDeductions.toFixed(2)}`],
      ['Net Pay', `₱${netPay.toFixed(2)}`],
    ].map(row => row.join(',')).join('\n')

    const filename = `${helper.name}_${month}_${year}_salary_report.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating CSV export:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV export' },
      { status: 500 }
    )
  }
} 