import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { error: 'PDF to JPG conversion requires client-side processing. Please use the frontend implementation with pdf.js.' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
