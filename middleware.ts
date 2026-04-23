import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Penting: getUser() melakukan verifikasi ke server Supabase
  const { data: { user } } = await supabase.auth.getUser()

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim()
  const userEmail = user?.email?.toLowerCase().trim()

  console.log('Middleware Log:', { userEmail, adminEmailConfig: ADMIN_EMAIL });

  // Jika user mencoba mengakses halaman yang diawali dengan /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user || userEmail !== ADMIN_EMAIL) {
      console.log('Middleware: Access denied for /admin. Redirecting to /');
      return NextResponse.redirect(new URL('/', req.url))
    }
    console.log('Middleware: Access granted for /admin to:', user.email);
  }

  return res
}

// Konfigurasi agar middleware hanya berjalan pada rute admin
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}