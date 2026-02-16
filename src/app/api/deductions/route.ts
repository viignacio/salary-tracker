import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const helperId = searchParams.get('helperId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    
    if (helperId) where.helperId = helperId
    if (month) where.month = month
    if (year) where.year = parseInt(year)

    const deductions = await prisma.deduction.findMany({
      where,
      include: {
        helper: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { date: 'desc' },
      ],
    })
    
    return NextResponse.json(deductions)
  } catch (error) {
    console.error('Error fetching deductions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deductions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { helperId, purpose, amount, date, month, year, remarks } = await request.json()
    
    if (!helperId || !purpose || !amount || !date || !month || !year) {
      return NextResponse.json(
        { error: 'Helper ID, purpose, amount, date, month, and year are required' },
        { status: 400 }
      )
    }

    const deduction = await prisma.deduction.create({
      data: {
        helperId,
        purpose: purpose.trim(),
        amount: parseFloat(amount),
        date: new Date(date),
        month,
        year: parseInt(year),
        remarks: remarks != null && String(remarks).trim() !== '' ? String(remarks).trim() : null,
      },
      include: { helper: true },
    })

    return NextResponse.json(deduction, { status: 201 })
  } catch (error) {
    console.error('Error creating deduction:', error)
    return NextResponse.json(
      { error: 'Failed to create deduction' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Deduction ID is required' }, { status: 400 })
    }
    await prisma.deduction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deduction:', error)
    return NextResponse.json({ error: 'Failed to delete deduction' }, { status: 500 })
  }
} 