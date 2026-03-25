'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mySpots, setMySpots] = useState<any[]>([]);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      // 1. Get the currently logged-in user
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Fetch their Profile (for Points and Username)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 3. Fetch Spots they submitted
      const { data: spotsData } = await supabase
        .from('places')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });
      
      if (spotsData) setMySpots(spotsData);

      // 4. Fetch Photos they submitted
      const { data: photosData } = await supabase
        .from('place_images')
        .select('*, places(name)')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });
      
      if (photosData) setMyPhotos(photosData);

      setLoading(false);
    };

    fetchUserData();
  }, []);

  // A quick helper function to color-code the status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-md">Approved</span>;
      case 'pending': return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-md">Reviewing</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-md">{status}</span>;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500">Please log in to view your profile.</p>
        <Link href="/" className="text-blue-600 font-bold hover:underline">← Back Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 pb-20">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* --- HEADER & POINTS --- */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">{profile.username}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center min-w-[150px]">
            <span className="block text-4xl font-black text-blue-600">{profile.points}</span>
            <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">Total Points</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* --- MY SPOTS --- */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Spots I Discovered ({mySpots.length})</h2>
            {mySpots.length === 0 ? (
              <p className="text-gray-500 text-sm bg-white p-6 rounded-xl border border-gray-100 border-dashed text-center">You haven't submitted any spots yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {mySpots.map((spot) => (
                  <div key={spot.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                    <div>
                      <h3 className="font-bold text-gray-900">{spot.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(spot.created_at).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(spot.status)}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* --- MY PHOTOS --- */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">My Photos ({myPhotos.length})</h2>
            {myPhotos.length === 0 ? (
              <p className="text-gray-500 text-sm bg-white p-6 rounded-xl border border-gray-100 border-dashed text-center">You haven't uploaded any photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myPhotos.map((img) => (
                  <div key={img.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                    <div 
                      className="h-24 w-full bg-cover bg-center bg-gray-200"
                      style={{ backgroundImage: `url(${img.image_url})` }}
                    />
                    <div className="p-3 flex flex-col justify-between flex-grow gap-2">
                      <p className="text-xs font-medium text-gray-600 line-clamp-1 truncate">
                        {img.places?.name || 'Unknown Spot'}
                      </p>
                      <div className="self-start">
                        {getStatusBadge(img.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}