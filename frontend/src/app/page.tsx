'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [loading, router, user]);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
    </div>
  );
}
