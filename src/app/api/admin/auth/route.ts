import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('adminAuth')?.value === 'true';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Not admin' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminPass) {
      return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 });
    }

    if (password === adminPass) {
      const response = NextResponse.json({ ok: true });
      // Set an httpOnly cookie valid for 1 hour
      response.cookies.set('adminAuth', 'true', {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60, // 1 hour
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (e) {
    console.error('Admin auth error:', e);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
