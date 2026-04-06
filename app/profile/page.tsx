'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../context/ToastContext';
import { Place, Profile, PlaceImage, PlaceImageWithJoin } from '../../types';
import Image from 'next/image';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mySpots, setMySpots] = useState<Place[]>([]);
  const [myPhotos, setMyPhotos] = useState<PlaceImageWithJoin[]>([]);
  const router = useRouter();
  const { showToast } = useToast();

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

    // Fetch Spots
    const { data: spotsData } = await supabase
      .from('places')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (spotsData) setMySpots(spotsData);

    // Fetch Photos
    const { data: photosData } = await supabase
      .from('place_images')
      .select('*, places(name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (photosData) setMyPhotos(photosData as PlaceImageWithJoin[]); 

    setLoading(false);
  };

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
        showToast("Session terminated. See you soon!", "info");
        
        // 3. Force redirect to login
        router.push('/login');
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserData();
  }, []);

  // --- GAMIFICATION LOGIC ---
  const getRank = (pts: number) => {
    if (pts >= 500) return { name: 'Upland Legend', icon: '👑', next: 500, max: true };
    if (pts >= 150) return { name: 'Summit Scout', icon: '⛰️', next: 500, max: false };
    if (pts >= 50) return { name: 'Trailblazer', icon: '🚙', next: 150, max: false };
    return { name: 'Novice Explorer', icon: '🏕️', next: 50, max: false };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">Live</span>;
      case 'pending': return <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest animate-pulse">Pending</span>;
      case 'rejected': return <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">Declined</span>;
      default: return <span className="bg-gray-100 text-gray-500 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full animate-ping opacity-50" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stamping Passport...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const rank = getRank(profile?.points || 0);
  const progressPercent = rank.max ? 100 : Math.min(100, ((profile?.points || 0) / rank.next) * 100);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-32 pt-24 md:pt-32">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        
        {/* --- HEADER --- */}
        <header className="mb-8 flex justify-between items-center bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div>
            <h1 className="text-4xl md:text-5xl font-[1000] italic uppercase tracking-tighter text-gray-900 leading-none">
              My <span className="text-blue-600">Passport</span>
            </h1>
          </div>
          <Link href="/" className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100 hover:bg-gray-200 transition-colors font-black">
            ✕
          </Link>
        </header>

        {/* --- 💳 THE PASSPORT CARD (Dark Glassmorphism) --- */}
        <div className="bg-gray-900 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden mb-8 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] -z-10 opacity-30 group-hover:opacity-50 transition-opacity" />
          
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Verified Explorer</p>
              <h2 className="text-3xl font-[1000] uppercase tracking-tighter italic">@{profile?.username}</h2>
              <p className="text-xs font-bold text-gray-400 mt-1">{profile?.email}</p>
            </div>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-inner">
              {rank.icon}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Current Rank</span>
                <span className="text-xl font-black text-white uppercase italic tracking-tight">{rank.name}</span>
              </div>
              <div className="text-right">
                <span className="text-4xl font-[1000] text-white tracking-tighter leading-none">{profile?.points || 0}</span>
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1 block">Total PTS</span>
              </div>
            </div>

            {/* Progress Bar */}
            {!rank.max && (
              <div className="mt-6">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Progress to next rank</span>
                  <span>{rank.next} PTS</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- 🗺️ QUICK ACTIONS --- */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link href="/itinerary" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-3 hover:border-blue-200 hover:shadow-md transition-all active:scale-95 text-center items-center justify-center">
            <span className="text-3xl">🗺️</span>
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">My Route</span>
          </Link>
          <Link href="/add-spot" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-3 hover:border-blue-200 hover:shadow-md transition-all active:scale-95 text-center items-center justify-center">
            <span className="text-3xl">📍</span>
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Add Spot</span>
          </Link>
        </div>

        {/* --- CONTRIBUTIONS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Spots */}
          <div className="lg:col-span-7">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Spots Discovery ({mySpots.length})</h2>
              <Link href="/add-spot" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">+ Map New</Link>
            </div>

            {mySpots.length === 0 ? (
              <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                <span className="text-3xl mb-3 block">🧭</span>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Discovery Log Empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mySpots.map((spot) => (
                  <Link href={`/place/${spot.id}`} key={spot.id} className="block group">
                    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all active:scale-[0.98]">
                      <div>
                        <h3 className="font-[1000] text-gray-900 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">{spot.name}</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Found {spot.created_at ? new Date(spot.created_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                      {getStatusBadge(spot.status || 'pending')}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Photos */}
          <div className="lg:col-span-5">
            <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight mb-6">Gallery ({myPhotos.length})</h2>
            {myPhotos.length === 0 ? (
              <div className="bg-white h-40 rounded-[3rem] flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                <span className="text-3xl mb-3 block">📸</span>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">No Visuals Yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {myPhotos.map((img) => (
                  <div key={img.id} className="group relative aspect-square bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
                    <Image src={img.image_url} fill className="object-cover group-hover:scale-110 transition-transform duration-700" alt="Contribution" sizes="50vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                      <p className="text-[9px] text-white font-black uppercase tracking-widest truncate mb-2">{img.places?.name}</p>
                      <div className="w-fit">{getStatusBadge(img.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- FOOTER / LOGOUT --- */}
        <div className="mt-20 pt-10 border-t border-gray-200 flex flex-col gap-6 items-center">
          
          {(profile?.role === 'admin' || profile?.role === 'IT') && (
            <Link href="/admin" className="w-full max-w-sm bg-purple-50 text-purple-700 border border-purple-100 py-5 rounded-[2rem] font-[1000] text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-95">
              <span>🛡️</span> Enter Command Center
            </Link>
          )}
          
          <button 
            onClick={() => supabase.auth.signOut()}
            className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-700 transition-colors p-4 active:scale-95"
          >
            End Session
          </button>
          
          <p className="text-gray-300 text-[9px] font-black uppercase tracking-widest">Catigan Explore © 2026</p>
        </div>

      </div>
    </main>
  );
}