import { NextResponse, type NextRequest } from 'next/server'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

function getRoleFromCookies(request: NextRequest): string | null {
  const all = request.cookies.getAll()

  // Supabase guarda la sesión en cualquiera de estos nombres
  const candidates = all.filter(c =>
    c.name.includes('auth-token') ||
    c.name.startsWith('supabase.auth') ||
    c.name.startsWith('sb-')
  )
  if (!candidates.length) return null

  // Reconstruir valor: cookie base o chunks .0 .1 .2 …
  const base = candidates.find(c => !c.name.match(/\.\d+$/))
  let raw = base?.value ?? ''
  if (!raw) {
    raw = [...candidates]
      .sort((a, b) => {
        const n = (s: string) => parseInt(s.split('.').pop() ?? '0')
        return n(a.name) - n(b.name)
      })
      .map(c => c.value).join('')
  }
  if (!raw) return null

  // @supabase/ssr puede prefijar con "base64-"
  const str = raw.startsWith('base64-') ? atob(raw.slice(7)) : raw

  // Extraer access_token del JSON o usar el string directamente como JWT
  let jwt = str
  try {
    const obj = JSON.parse(str)
    jwt = obj?.access_token ?? obj?.[0]?.access_token ?? str
  } catch { /* str ya es un JWT */ }

  const payload = decodeJwtPayload(jwt)
  if (!payload) return null

  return (payload as any)?.user_metadata?.role ?? 'REQUESTER'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = getRoleFromCookies(request)

  const HOME: Record<string, string> = {
    ORG_ADMIN:        '/dashboard',
    BUILDING_MANAGER: '/dashboard/incidents',
    ANALYST:          '/dashboard/analyst',
    TECHNICIAN:       '/dashboard/technician',
    REQUESTER:        '/dashboard/requester',
  }

  // Rutas públicas — sin login requerido
  const publicPaths = ['/report', '/api/report', '/api/whatsapp/webhook']
  if (publicPaths.some(p => pathname.startsWith(p)))
    return NextResponse.next()

  if (!role && pathname.startsWith('/dashboard'))
    return NextResponse.redirect(new URL('/auth', request.url))

  if (role && pathname === '/auth')
    return NextResponse.redirect(new URL(HOME[role] ?? '/dashboard/requester', request.url))

  if (role === 'BUILDING_MANAGER' && pathname === '/dashboard')
    return NextResponse.redirect(new URL('/dashboard/incidents', request.url))

  if (role === 'ANALYST' && (pathname === '/dashboard' || pathname.startsWith('/dashboard/roles')))
    return NextResponse.redirect(new URL('/dashboard/analyst', request.url))

  if (role === 'TECHNICIAN' &&
    !pathname.startsWith('/dashboard/technician') &&
    !pathname.startsWith('/dashboard/incidents') &&
    !pathname.startsWith('/dashboard/chat') &&
    !pathname.startsWith('/dashboard/ai-predictive'))
    return NextResponse.redirect(new URL('/dashboard/technician', request.url))

  if (role === 'REQUESTER' && !pathname.startsWith('/dashboard/requester'))
    return NextResponse.redirect(new URL('/dashboard/requester', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
