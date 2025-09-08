import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('salary_auth');
  if (!cookie || cookie.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const helpers = await prisma.helper.findMany({
      include: {
        salaries: true,
        deductions: true,
        bonuses: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(helpers)
  } catch (error) {
    console.error('Error fetching helpers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch helpers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('salary_auth');
  if (!cookie || cookie.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { name } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Helper name is required' },
        { status: 400 }
      )
    }

    const helper = await prisma.helper.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(helper, { status: 201 })
  } catch (error) {
    console.error('Error creating helper:', error)
    return NextResponse.json(
      { error: 'Failed to create helper' },
      { status: 500 }
    )
  }
} 