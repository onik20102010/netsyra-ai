import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Try to get country from Vercel header
  const country = request.headers.get('x-vercel-ip-country') || 
                 request.headers.get('x-country-code') ||
                 request.headers.get('cf-ipcountry');
  
  // Return country code if found, otherwise return null to let Paddle auto-detect
  return NextResponse.json({ country: country || null });
}
