
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/store/supabaseClient';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const supabaseAccessToken = req.cookies.get('sb-access-token')?.value;
  // Public routes
  const publicRoutes = ['/', '/auth/login', '/auth/register'];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If no access token, redirect to login
  if (!supabaseAccessToken) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If access token is available, verify the user session
  const { data: { user } } = await supabase.auth.getUser(supabaseAccessToken);

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Allow the request to continue if the user is authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
