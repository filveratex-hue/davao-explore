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
  const [isOpen, setIsOpen] = useState(false); // 👈 NEW: For mobile menu
  
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
    setIsOpen(false);
    router.push('/login');
    router.refresh(); 
  };

  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl">
      {/* --- THE FLOATING BAR --- */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] px-6 py-3 flex justify-between items-center transition-all duration-500">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
          <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white font-[1000] italic text-lg transition-transform group-hover:rotate-12 shadow-lg">
            D
          </div>
          <span className="text-sm font-[1000] uppercase italic tracking-tighter text-gray-900 leading-none hidden sm:inline-block">
            DAVAO<span className="text-blue-600">Explore</span>
          </span>
        </Link>

        {/* DESKTOP ACTIONS */}
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

        {/* MOBILE BURGER TOGGLE */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`md:hidden w-12 h-12 flex flex-col items-center justify-center rounded-2xl transition-all relative ${isOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}
        >
          {pendingCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-600 w-3 h-3 rounded-full border-2 border-white animate-ping" />
          )}
          <div className="flex flex-col gap-1">
            <span className={`h-0.5 w-5 bg-current transition-all rounded-full ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`h-0.5 w-5 bg-current transition-all rounded-full ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-5 bg-current transition-all rounded-full ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* --- MOBILE DRAWER MENU --- */}
      <div className={`md:hidden absolute top-full left-0 w-full mt-3 overflow-hidden transition-all duration-500 ease-out ${isOpen ? 'max-h-[500px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
        <div className="bg-white/90 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.2)] flex flex-col gap-4 items-center">
          {user ? (
            <>
              <div className="text-center mb-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Welcome Back</p>
                <p className="text-xl font-[1000] italic uppercase text-gray-900 tracking-tighter">@{username}</p>
              </div>
              
              {(role === 'admin' || role === 'IT') && (
                <Link onClick={() => setIsOpen(false)} href="/admin" className="w-full text-center py-5 bg-purple-50 text-purple-700 rounded-2xl font-[1000] text-[11px] uppercase tracking-widest border border-purple-100 relative">
                  Command Center
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}
              
              <Link onClick={() => setIsOpen(false)} href="/add-spot" className="w-full text-center py-5 bg-black text-white rounded-2xl font-[1000] text-[11px] uppercase tracking-widest shadow-xl">
                Contribute Spot
              </Link>

              <Link onClick={() => setIsOpen(false)} href="/profile" className="w-full text-center py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">
                My Profile
              </Link>
              
              <button onClick={handleSignOut} className="w-full text-center py-4 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">
                Sign Out
              </button>
            </>
          ) : (
            <Link onClick={() => setIsOpen(false)} href="/login" className="w-full text-center py-5 bg-black text-white rounded-2xl font-[1000] text-[11px] uppercase tracking-widest shadow-2xl">
              Explorer Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}