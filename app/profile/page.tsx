'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../context/ToastContext'; // 👈 1. Import Toast Hook

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mySpots, setMySpots] = useState<any[]>([]);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const router = useRouter();
  const { showToast } = useToast(); // 👈 2. Initialize Toast

  useEffect(() => {
    // --- THE BOUNCER: Fixes the "Ghosting" issue ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // 1. Wipe all private data from the screen immediately
        setProfile(null);
        setMySpots([]);
        setMyPhotos([]);
        setLoading(true); 
        
        // 2. Show goodbye message
        showToast("Session terminated. See you soon!", "info"); // 👈 3. Trigger Toast
        
        // 3. Force redirect to login
        router.push('/login');
        router.refresh();
      }
    });

    fetchUserData();

    return () => subscription.unsubscribe();
  }, [router, showToast]);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      router.push('/login');
      return;
    }

    setLoading(true);
    
    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileData) setProfile(profileData);

    // Fetch Spots (using the user_id column)
    const { data: spotsData } = await supabase
      .from('places')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (spotsData) setMySpots(spotsData);

    // Fetch Photos (using the user_id column)
    const { data: photosData } = await supabase
      .from('place_images')
      .select('*, places(name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (photosData) setMyPhotos(photosData);

    setLoading(false);
  };

  // --- RANK SYSTEM LOGIC ---
  const getRank = (pts: number) => {
    if (pts >= 501) return { name: 'Legend', color: 'text-purple-600', bg: 'bg-purple-50', icon: '💎' };
    if (pts >= 151) return { name: 'Pathfinder', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🚀' };
    if (pts >= 51) return { name: 'Explorer', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🌿' };
    return { name: 'Scout', color: 'text-orange-600', bg: 'bg-orange-50', icon: '⛺' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Live</span>;
      case 'pending': return <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Pending</span>;
      default: return <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse font-black text-gray-400 uppercase tracking-widest text-xs italic">Authenticating...</div>
      </div>
    );
  }

  if (!profile) return null;

  const rank = getRank(profile?.points || 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* --- HERO SECTION --- */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl ${rank.bg}`} />
          
          <div className="relative">
            <div className="w-24 h-24 bg-gray-900 rounded-[2rem] flex items-center justify-center text-3xl text-white font-black shadow-xl">
              {profile?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg border border-gray-50">
               <span className="text-xl">{rank.icon}</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
              {profile?.full_name || profile?.username}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${rank.bg} ${rank.color}`}>
                {rank.name} Rank
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-bold text-sm lowercase">{profile?.email}</span>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-[2rem] p-8 text-center min-w-[180px] shadow-2xl">
            <span className="block text-5xl font-black mb-1">{profile?.points || 0}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Points Earned</span>
          </div>
        </div>

        {/* --- CONTRIBUTIONS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-7">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Spots Discovery ({mySpots.length})</h2>
              <Link href="/add-spot" className="text-xs font-black text-blue-600 hover:underline">+ Add New</Link>
            </div>

            {mySpots.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold text-sm uppercase">Discovery Log Empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mySpots.map((spot) => (
                  <Link href={`/place/${spot.id}`} key={spot.id} className="block group">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm group-hover:border-gray-900 transition-all">
                      <div>
                        <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{spot.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Found {new Date(spot.created_at).toLocaleDateString()}</p>
                      </div>
                      {getStatusBadge(spot.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight mb-6">Gallery ({myPhotos.length})</h2>
            {myPhotos.length === 0 ? (
              <div className="bg-gray-100 h-32 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No Visuals Yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {myPhotos.map((img) => (
                  <div key={img.id} className="group relative aspect-square bg-gray-200 rounded-3xl overflow-hidden shadow-sm">
                    <img src={img.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Contribution" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white font-black uppercase truncate mb-2">{img.places?.name}</p>
                      {getStatusBadge(img.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- FOOTER / LOGOUT --- */}
        <div className="mt-20 pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Catigan Explorer Community © 2026</p>
           <button 
             onClick={() => supabase.auth.signOut()}
             className="px-8 py-3 rounded-xl border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
           >
             End Session
           </button>
        </div>

      </div>
    </main>
  );
}