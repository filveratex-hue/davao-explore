import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. SECURITY HEADERS
  const headers = response.headers;
  
  // HSTS (Strict-Transport-Security) - 1 year
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Content-Type-Options: Prevents MIME-type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options: Prevents clickjacking (DENY or SAMEORIGIN)
  headers.set('X-Frame-Options', 'DENY');
  
  // Referrer-Policy: Control how much referrer info is sent
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-XSS-Protection: Legacy but still useful for some browsers
  headers.set('X-XSS-Protection', '1; mode=block');

  // 2. ROUTE PROTECTION (Basic)
  // Protected paths
  const protectedPaths = ['/admin', '/add-spot', '/profile'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath) {
    // Check for Supabase session cookie
    // Note: The actual cookie name depends on project ID, but we check for general existence first
    const hasSession = request.cookies.getAll().some(cookie => cookie.name.includes('auth-token'));
    
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
