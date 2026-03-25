'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0); // New state for the badge

  useEffect(() => {
    const fetchProfileAndCounts = async (currentUser: User) => {
      // 1. Fetch Profile Data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', currentUser.id)
        .single();
        
      if (!error && profile) {
        setUsername(profile.username);
        setRole(profile.role);

        // 2. If User is Admin/IT, fetch the count of pending items
        if (profile.role === 'admin' || profile.role === 'IT') {
          // Count pending spots
          const { count: spotsCount } = await supabase
            .from('places')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          // Count pending photos
          const { count: imagesCount } = await supabase
            .from('place_images')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          setPendingCount((spotsCount || 0) + (imagesCount || 0));
        }
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfileAndCounts(currentUser);
    });

    // Listen for auth changes
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
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="font-extrabold text-xl text-gray-900 tracking-tight hover:opacity-80 transition-opacity">
        Catigan<span className="text-blue-600">Explore</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* --- ADMIN ONLY LINK WITH PENDING BADGE --- */}
            {(role === 'admin' || role === 'IT') && (
              <Link 
                href="/admin" 
                className="relative bg-purple-50 text-purple-700 text-xs font-black px-3 py-2 rounded-lg hover:bg-purple-100 transition-all border border-purple-100 flex items-center gap-1"
              >
                🛡️ Admin Panel
                
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}

            <Link 
              href="/profile" 
              className="text-sm text-gray-900 hidden sm:inline-block hover:text-blue-600 font-bold transition-colors"
            >
              {username || user.email}
            </Link>
            
            <Link 
              href="/add-spot"
              className="bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors inline-block"
            >
              + Add Spot
            </Link>
            
            <button 
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link 
            href="/login" 
            className="bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}