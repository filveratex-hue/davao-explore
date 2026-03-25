'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import AdminGuard from '../../components/AdminGuard';

export default function AdminDashboard() {
  const [pendingPlaces, setPendingPlaces] = useState<any[]>([]);
  const [pendingImages, setPendingImages] = useState<any[]>([]);
  const [activePlaces, setActivePlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Pending Content (Getting user_id for points)
    const { data: pPlaces } = await supabase.from('places').select('*').eq('status', 'pending');
    const { data: pImages } = await supabase.from('place_images').select('*, places(name)').eq('status', 'pending');

    // 2. Fetch Active Content
    const { data: aPlaces } = await supabase.from('places').select('*, place_images(*)').eq('status', 'approved');

    setPendingPlaces(pPlaces || []);
    setPendingImages(pImages || []);
    setActivePlaces(aPlaces || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- GAMIFICATION: AWARD POINTS FUNCTION ---
  const awardPoints = async (userId: string, amount: number) => {
    if (!userId) return;

    // Get current points
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    const newPoints = (profile?.points || 0) + amount;

    // Update points
    await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId);
  };

  // --- APPROVE FUNCTIONS (Now with Points!) ---
  const handleApprovePlace = async (place: any) => {
    const { error } = await supabase.from('places').update({ status: 'approved' }).eq('id', place.id);
    
    if (!error) {
      await awardPoints(place.user_id, 10); // +10 for a new spot
      fetchData();
    } else {
      alert("Error approving spot: " + error.message);
    }
  };

  const handleApproveImage = async (img: any) => {
    const { error } = await supabase.from('place_images').update({ status: 'approved' }).eq('id', img.id);
    
    if (!error) {
      await awardPoints(img.user_id, 5); // +5 for a new photo
      fetchData();
    } else {
      alert("Error approving photo: " + error.message);
    }
  };

  // --- UPDATE & SET COVER ---
  const handleUpdatePlace = async (id: string) => {
    const { error } = await supabase.from('places').update(editForm).eq('id', id);
    if (!error) {
      setEditingId(null);
      fetchData();
    }
  };

  const handleSetCover = async (placeId: string, imageUrl: string) => {
    const { error } = await supabase
      .from('places')
      .update({ cover_image_url: imageUrl })
      .eq('id', placeId);
    
    if (error) {
      // This alert will tell us if RLS is blocking the change!
      alert("Database Error: " + error.message);
    } else {
      fetchData();
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm("Are you sure? This action is permanent.")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const startEdit = (place: any) => {
    setEditingId(place.id);
    setEditForm({ name: place.name, description: place.description });
  };

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto w-full p-6 mt-8 pb-24 text-gray-900">
        <header className="mb-12">
          <h1 className="text-3xl font-black tracking-tight">Admin Command Center</h1>
          <p className="text-gray-500 mt-1 font-medium">Moderate submissions and award community points.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20 animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">
            Syncing Secure Database...
          </div>
        ) : (
          <div className="flex flex-col gap-20">
            
            {/* --- SECTION 1: THE APPROVAL QUEUE --- */}
            <section>
              <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                Pending Review
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Spots */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">Spots ({pendingPlaces.length})</h3>
                  {pendingPlaces.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center transition-all hover:border-blue-100">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleDelete('places', p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                        <button onClick={() => handleApprovePlace(p)} className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-600 shadow-sm">Approve (+10 pts)</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Photos */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">Photos ({pendingImages.length})</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {pendingImages.map(img => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square shadow-sm">
                        <img src={img.image_url} className="w-full h-full object-cover" alt="Pending" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-2 text-center">
                           <p className="text-[10px] text-white font-bold truncate w-full px-2">{img.places?.name}</p>
                           <div className="flex gap-2">
                             <button onClick={() => handleDelete('place_images', img.id)} className="bg-white/20 hover:bg-red-500 p-2 rounded-lg transition-colors">🗑️</button>
                             <button onClick={() => handleApproveImage(img)} className="bg-emerald-500 hover:bg-emerald-600 p-2 rounded-lg transition-colors">✅ (+5 pts)</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* --- SECTION 2: ACTIVE CONTENT MANAGEMENT --- */}
            <section>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Manage Live Spots ({activePlaces.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activePlaces.map(place => (
                  <div key={place.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    {editingId === place.id ? (
                      <div className="p-6 space-y-4">
                        <input className="w-full p-3 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                        <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={4} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleUpdatePlace(place.id)} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl text-xs">Save Changes</button>
                          <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-500 font-bold py-2 rounded-xl text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-extrabold text-lg">{place.name}</h3>
                          <div className="flex gap-3">
                            <button onClick={() => startEdit(place)} className="text-blue-600 font-bold text-xs hover:underline">Edit</button>
                            <button onClick={() => handleDelete('places', place.id)} className="text-red-500 font-bold text-xs hover:underline">Delete</button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6">{place.description}</p>
                        
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {place.place_images?.map((img: any) => {
                            const isCover = place.cover_image_url === img.image_url;
                            return (
                              <div key={img.id} className="relative group shrink-0 w-24 h-24">
                                <img 
                                  src={img.image_url} 
                                  className={`w-full h-full object-cover rounded-xl border-2 transition-all ${isCover ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-gray-100'}`} 
                                />
                                {isCover && (
                                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                    ⭐ COVER
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-1 p-1">
                                  {!isCover && (
                                    <button 
                                      onClick={() => handleSetCover(place.id, img.image_url)}
                                      className="w-full bg-white text-gray-900 text-[9px] font-bold py-1 rounded-lg hover:bg-blue-500 hover:text-white"
                                    >
                                      Set Cover
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDelete('place_images', img.id)}
                                    className="w-full bg-red-600 text-white text-[9px] font-bold py-1 rounded-lg"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}