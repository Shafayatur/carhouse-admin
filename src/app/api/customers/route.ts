import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Vehicles API endpoint' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ message: 'Vehicle created', data: body });
}
