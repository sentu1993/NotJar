'use client';

import Link from 'next/link';
import { Gauge, Layers } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white">
            <Layers className="h-5 w-5" />
          </span>
          NotJar
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <Gauge className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="hidden text-sm text-slate-500 sm:block">Open-source workspace</span>
        </nav>
      </div>
    </header>
  );
}
