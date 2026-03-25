'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Get the session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthorized(false);
        router.push('/login');
        return;
      }

      // 2. Fetch the role from the profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        console.error("Guard Error:", error);
        setAuthorized(false);
        router.push('/');
        return;
      }

      // 3. Final verification
      if (profile.role === 'admin' || profile.role === 'IT') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.push('/'); // Redirect if not admin
      }
    };

    checkAccess();
  }, [router]);

  // Show a clean loading state while checking the database
  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse font-bold text-gray-400 uppercase tracking-widest">
          Securing Connection...
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}