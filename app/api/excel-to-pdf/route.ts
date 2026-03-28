import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { error: 'Excel to PDF conversion requires client-side processing. Please use the frontend implementation with jsPDF.' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
