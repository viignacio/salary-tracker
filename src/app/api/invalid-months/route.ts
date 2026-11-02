import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

function isPrismaError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

// GET: List invalid months for a helper
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const helperId = searchParams.get('helperId')
    if (!helperId) {
      return NextResponse.json({ error: 'Helper ID is required' }, { status: 400 })
    }
    const invalidMonths = await prisma.invalidMonth.findMany({
      where: { helperId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })
    return NextResponse.json(invalidMonths)
  } catch (error) {
    console.error('Error fetching invalid months:', error)
    return NextResponse.json({ error: 'Failed to fetch invalid months' }, { status: 500 })
  }
}

// POST: Mark a month as invalid
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { helperId, month, year, reason } = await request.json()
    if (!helperId || !month || !year) {
      return NextResponse.json({ error: 'Helper ID, month, and year are required' }, { status: 400 })
    }
    const invalidMonth = await prisma.invalidMonth.create({
      data: {
        helperId,
        month,
        year: parseInt(year),
        reason: reason?.trim() || null,
      },
    })
    return NextResponse.json(invalidMonth, { status: 201 })
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      // Unique constraint failed
      return NextResponse.json({ error: 'Month already marked as invalid' }, { status: 409 });
    }
    console.error('Error marking month as invalid:', error)
    return NextResponse.json({ error: 'Failed to mark as invalid' }, { status: 500 });
  }
}

// DELETE: Unmark a month as invalid
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const helperId = searchParams.get('helperId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    if (!helperId || !month || !year) {
      return NextResponse.json({ error: 'Helper ID, month, and year are required' }, { status: 400 })
    }
    await prisma.invalidMonth.deleteMany({
      where: {
        helperId,
        month,
        year: parseInt(year),
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unmarking invalid month:', error)
    return NextResponse.json({ error: 'Failed to unmark invalid month' }, { status: 500 })
  }
} 