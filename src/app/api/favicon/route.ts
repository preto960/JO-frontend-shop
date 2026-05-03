import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jo-backend-shop.vercel.app';

let cachedUrl: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();

    // Use cached URL if fresh
    if (cachedUrl && now - cacheTime < CACHE_TTL) {
      if (!cachedUrl) {
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.redirect(cachedUrl);
    }

    // Fetch config from backend
    const res = await fetch(`${API_URL}/config`, {
      next: { revalidate: 300 },
    });
    const config = await res.json();
    const logoUrl = config?.shop_logo_url || '';

    cachedUrl = logoUrl || null;
    cacheTime = now;

    if (!logoUrl) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.redirect(logoUrl);
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
