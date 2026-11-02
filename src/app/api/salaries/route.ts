import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const helperId = searchParams.get('helperId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    
    if (helperId) where.helperId = helperId
    if (month) where.month = month
    if (year) where.year = parseInt(year)

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        helper: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })
    
    return NextResponse.json(salaries)
  } catch (error) {
    console.error('Error fetching salaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salaries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { helperId, amount, month, year } = await request.json()

    if (!helperId || amount == null || !month || !year) {
      return NextResponse.json(
        { error: 'Helper ID, amount, month, and year are required' },
        { status: 400 }
      )
    }

    // Check if salary already exists for this helper and month
    const existingSalary = await prisma.salary.findUnique({
      where: {
        helperId_month_year: {
          helperId,
          month,
          year: parseInt(year),
        },
      },
    })

    if (existingSalary) {
      // Update existing salary
      const updatedSalary = await prisma.salary.update({
        where: { id: existingSalary.id },
        data: { amount: parseFloat(amount) },
        include: { helper: true },
      })
      return NextResponse.json(updatedSalary)
    } else {
      // Create new salary
      const salary = await prisma.salary.create({
        data: {
          helperId,
          amount: parseFloat(amount),
          month,
          year: parseInt(year),
        },
        include: { helper: true },
      })
      return NextResponse.json(salary, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating/updating salary:', error)
    return NextResponse.json(
      { error: 'Failed to create/update salary' },
      { status: 500 }
    )
  }
} 