'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfileAndCounts = async (currentUser: User) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', currentUser.id)
        .single();
        
      if (!error && profile) {
        setUsername(profile.username);
        setRole(profile.role);

        if (profile.role === 'admin' || profile.role === 'IT') {
          const { count: spotsCount } = await supabase
            .from('places')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          const { count: imagesCount } = await supabase
            .from('place_images')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          setPendingCount((spotsCount || 0) + (imagesCount || 0));
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfileAndCounts(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfileAndCounts(currentUser);
      } else {
        setUsername(null);
        setRole(null);
        setPendingCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    setRole(null);
    setPendingCount(0);
    router.push('/login');
    router.refresh(); 
  };

  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <nav className={`fixed left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl ${pathname === '/map' ? 'hidden md:block' : ''}`} style={{ top: 'max(1rem, env(safe-area-inset-top))' }}>
      {/* --- THE FLOATING BAR --- */}
      <div className="bg-white/80 backdrop-blur-3xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl md:rounded-[2rem] px-4 md:px-5 py-2.5 md:py-3 flex justify-between items-center transition-all duration-500">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5 md:gap-3 group">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-black rounded-xl md:rounded-[0.9rem] flex items-center justify-center text-white font-extrabold text-base md:text-lg transition-transform group-hover:rotate-6 shadow-md border border-gray-800">
            D
          </div>
          <span className="text-sm font-[900] uppercase tracking-widest text-gray-900 leading-none hidden sm:inline-block">
            DAVAO<span className="text-blue-600">Explore</span>
          </span>
        </Link>

        {/* DESKTOP ACTIONS — Only visible on md+ */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {(role === 'admin' || role === 'IT') && (
                <Link 
                  href="/admin" 
                  className={`relative text-[10px] font-[1000] uppercase tracking-widest px-5 py-3 rounded-xl transition-all border ${
                    isAdminPage 
                    ? 'bg-purple-600 text-white border-purple-400 shadow-xl' 
                    : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  🛡️ Admin Panel
                  {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce shadow-lg">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Profile</span>
                <Link href="/profile" className="text-[10px] font-[1000] text-gray-900 uppercase tracking-tight hover:text-blue-600 transition-colors">
                  @{username || 'explorer'}
                </Link>
              </div>

              <Link 
                href="/add-spot"
                className="bg-black text-white px-6 py-3 rounded-xl font-[1000] text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
              >
                + Add Spot
              </Link>
              
              <button 
                onClick={handleSignOut}
                className="text-[9px] font-[1000] text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="bg-black text-white px-8 py-3 rounded-xl font-[1000] text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Start Exploring
            </Link>
          )}
        </div>

        {/* MOBILE: Slim right-side content — username or login */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              {(role === 'admin' || role === 'IT') && pendingCount > 0 && (
                <Link href="/admin" className="relative w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100 active:scale-90 transition-transform">
                  <span className="text-sm">🛡️</span>
                  <span className="absolute -top-1 -right-1 bg-red-600 w-4 h-4 text-[7px] font-black text-white rounded-full flex items-center justify-center border-2 border-white">
                    {pendingCount}
                  </span>
                </Link>
              )}
              <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-[10px] font-black text-white uppercase">
                {(username || 'E').charAt(0)}
              </div>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-black text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}