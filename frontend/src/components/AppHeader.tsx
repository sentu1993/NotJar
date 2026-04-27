'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LogOut, Gauge } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AppHeader() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? '/dashboard' : '/login'} className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white">
            <Layers className="h-5 w-5" />
          </span>
          NotJar
        </Link>

        <nav className="flex items-center gap-3">
          {user && (
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:flex"
            >
              <Gauge className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          {!loading && user ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-48 truncate text-sm text-slate-500 sm:block">
                {user.name || user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : !loading && !isAuthPage ? (
            <Link
              href="/login"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
