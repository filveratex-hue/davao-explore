'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import AdminGuard from '../../components/AdminGuard';
import { useRouter } from 'next/navigation';
import { useToast } from '../../context/ToastContext';
import imageCompression from 'browser-image-compression'; 
import dynamicImport from 'next/dynamic'; 

const LocationPicker = dynamicImport(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-gray-50 animate-pulse rounded-[2rem] flex items-center justify-center text-gray-400 border border-gray-100 uppercase text-[10px] font-black tracking-widest">
      Loading Map Editor...
    </div>
  )
});

export default function AdminDashboard() {
  const [pendingPlaces, setPendingPlaces] = useState<any[]>([]);
  const [pendingImages, setPendingImages] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  
  const [activePlaces, setActivePlaces] = useState<any[]>([]);
  const [activeReviews, setActiveReviews] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // 🌟 NEW: State for Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'live' | 'reviews'>('pending');

  const router = useRouter();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    road_condition: 'Concrete Road (Sedan-friendly)',
    is_24_hours: false,
    open_time: '08:00',
    close_time: '17:00',
    category: 'Cafe',
    signal_strength: 'Good',
    entrance_fee: '',
    latitude: 0,
    longitude: 0
  });

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);
    
    // Fetch Pending Content
    const { data: pPlaces } = await supabase.from('places').select('*').eq('status', 'pending');
    const { data: pImages } = await supabase.from('place_images').select('*, places(name)').eq('status', 'pending');
    const { data: pUsers } = await supabase.from('profiles').select('*').eq('status', 'pending');

    // Fetch Approved Content
    const { data: aPlaces } = await supabase.from('places').select('*, place_images(*)').eq('status', 'approved');
    const { data: aReviews } = await supabase
      .from('reviews')
      .select('*, places(name), profiles(username, id)') 
      .order('created_at', { ascending: false });

    setPendingPlaces(pPlaces || []);
    setPendingImages(pImages || []);
    setPendingUsers(pUsers || []);
    setActivePlaces(aPlaces || []);
    setActiveReviews(aReviews || []); 
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
        router.refresh();
      }
    });
    fetchData();
    return () => subscription.unsubscribe();
  }, [router]);

  // --- ACTIONS ---
  const awardPoints = async (userId: string, amount: number) => {
    if (!userId) return;
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
    const newPoints = (profile?.points || 0) + amount;
    await supabase.from('profiles').update({ points: newPoints }).eq('id', userId);
  };

  const handleBanUser = async (userId: string, username: string) => {
    if (!window.confirm(`🚨 EXTREME ACTION: Are you sure you want to ban @${username}? They will be locked out of contributing.`)) return;
    const { data, error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId).select();
    
    if (error) showToast(error.message, "error");
    else if (!data || data.length === 0) showToast("Database Blocked: You don't have RLS permission to edit this user.", "error");
    else { showToast(`User @${username} has been permanently banned.`, "success"); fetchData(); }
  };

  const handleApproveUser = async (userId: string, username: string) => {
    const { data, error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId).select();
    
    if (error) showToast(error.message, "error");
    else if (!data || data.length === 0) showToast("Database Blocked: You don't have RLS permission to edit this user.", "error");
    else { showToast(`User @${username} has been approved to log in!`, "success"); fetchData(); }
  };

  const handleRejectUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to reject @${username}'s application?`)) return;
    const { data, error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId).select();
    
    if (error) showToast(error.message, "error");
    else if (!data || data.length === 0) showToast("Database Blocked: You don't have RLS permission to edit this user.", "error");
    else { showToast(`User @${username} rejected.`, "info"); fetchData(); }
  };

  const handleApprovePlace = async (place: any) => {
    const { error } = await supabase.from('places').update({ status: 'approved' }).eq('id', place.id);
    if (!error) { await awardPoints(place.user_id, 10); showToast("Spot approved!", "success"); fetchData(); } 
    else showToast(error.message, "error");
  };

  const handleApproveImage = async (img: any) => {
    const { error } = await supabase.from('place_images').update({ status: 'approved' }).eq('id', img.id);
    if (!error) { await awardPoints(img.user_id, 5); showToast("Photo approved!", "success"); fetchData(); } 
    else showToast(error.message, "error");
  };

  const handleUpdatePlace = async (id: string) => {
    const { error } = await supabase.from('places').update(form).eq('id', id);
    if (!error) { setEditingId(null); showToast("Spot details updated.", "success"); fetchData(); } 
    else showToast(error.message, "error");
  };

  const handleAddPlace = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('places').insert([{ ...form, status: 'approved', user_id: session?.user?.id }]);
    if (!error) { setIsAdding(false); resetForm(); showToast("New spot published live!", "success"); fetchData(); } 
    else showToast("Error adding spot: " + error.message, "error");
  };

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm("Are you sure? This action is permanent.")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) { showToast("Deleted permanently.", "info"); fetchData(); } 
    else showToast(error.message, "error");
  };

  const handleSetCover = async (placeId: string, imageUrl: string) => {
    const { error } = await supabase.from('places').update({ cover_image_url: imageUrl }).eq('id', placeId);
    if (!error) { showToast("New cover image set!", "success"); fetchData(); } 
    else showToast("Database Error: " + error.message, "error");
  };

  const startEdit = (place: any) => {
    setEditingId(place.id);
    setForm({
      name: place.name, description: place.description, road_condition: place.road_condition || 'Concrete Road (Sedan-friendly)',
      is_24_hours: place.is_24_hours || false, open_time: place.open_time || '08:00', close_time: place.close_time || '17:00',
      category: place.category || 'Cafe', signal_strength: place.signal_strength || 'Good', entrance_fee: place.entrance_fee || '',
      latitude: place.latitude || 0, longitude: place.longitude || 0
    });
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', road_condition: 'Concrete Road (Sedan-friendly)', is_24_hours: false, open_time: '08:00', close_time: '17:00',
      category: 'Cafe', signal_strength: 'Good', entrance_fee: '', latitude: 0, longitude: 0
    });
  };

  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, placeId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingId(placeId);
    try {
      const files = Array.from(e.target.files);
      const { data: { session } } = await supabase.auth.getSession();
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };

      for (const file of files) {
        const compressedFile = await imageCompression(file, options);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('spot_images').upload(`public/${fileName}`, compressedFile);
        if (uploadError) { showToast(`Upload failed for ${file.name}`, "error"); continue; }
        const { data: { publicUrl } } = supabase.storage.from('spot_images').getPublicUrl(`public/${fileName}`);
        await supabase.from('place_images').insert({ place_id: placeId, image_url: publicUrl, status: 'approved', user_id: session?.user?.id });
      }
      showToast("Photos compressed, uploaded, and published!", "success");
    } finally {
      setUploadingId(null);
      fetchData();
      e.target.value = '';
    }
  };

  const totalPending = pendingUsers.length + pendingPlaces.length + pendingImages.length;

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto w-full p-6 mt-8 pb-24 text-gray-900">
        
        {/* --- 1. HEADER --- */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase italic text-gray-900 leading-none">Command Center</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-3">Catigan Explore Moderation</p>
          </div>
          <button 
            onClick={() => { setIsAdding(!isAdding); resetForm(); }}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isAdding ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            {isAdding ? 'Cancel Action' : '+ Add New Spot'}
          </button>
        </header>

        {/* --- 2. ADD SPOT MODAL/PANEL --- */}
        {isAdding && (
          <section className="mb-12 bg-white p-8 md:p-12 rounded-[3rem] border border-gray-200 shadow-xl">
            <h2 className="text-2xl font-black mb-8 uppercase italic tracking-tight">Create New Community Spot</h2>
            <AdminSpotForm form={form} setForm={setForm} onSubmit={handleAddPlace} LocationPicker={LocationPicker} />
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="animate-pulse text-gray-300 font-black uppercase tracking-widest text-sm flex flex-col items-center gap-4">
              <span className="text-4xl">⏳</span> Syncing Database...
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            
            {/* --- 3. STATISTICS ROW --- */}
            {!isAdding && (
              <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-gray-900">{activePlaces.length}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Live Spots</span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-gray-900">{activeReviews.length}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Total Reviews</span>
                </div>
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-amber-600">{pendingPlaces.length}</span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-2">Pending Spots</span>
                </div>
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-amber-600">{pendingImages.length}</span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-2">Pending Photos</span>
                </div>
                <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-purple-600">{pendingUsers.length}</span>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-2">Pending Users</span>
                </div>
              </section>
            )}

            {/* --- 4. TABS NAVIGATION --- */}
            <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-black text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Approvals Queue
                {totalPending > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{totalPending}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-black text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Manage Live Spots
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-black text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Community Reviews
              </button>
            </div>

            {/* --- 5. TAB CONTENT AREAS --- */}
            
            {/* 🟢 TAB: PENDING APPROVALS */}
            {activeTab === 'pending' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Users */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />New Users ({pendingUsers.length})</h3>
                  {pendingUsers.length === 0 && <div className="p-8 bg-gray-50 rounded-[2rem] text-center border-2 border-dashed border-gray-200"><p className="text-[10px] font-bold uppercase text-gray-400">Queue is empty</p></div>}
                  {pendingUsers.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 hover:border-purple-200 transition-colors">
                      <div>
                        <p className="font-black text-lg text-gray-900 tracking-tight">@{u.username}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Awaiting Access</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button onClick={() => handleApproveUser(u.id, u.username)} className="flex-1 bg-purple-50 text-purple-700 text-[10px] font-black px-4 py-3 rounded-xl hover:bg-purple-600 hover:text-white transition-colors uppercase tracking-widest">Approve</button>
                        <button onClick={() => handleRejectUser(u.id, u.username)} className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Places */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />Spot Submissions ({pendingPlaces.length})</h3>
                  {pendingPlaces.length === 0 && <div className="p-8 bg-gray-50 rounded-[2rem] text-center border-2 border-dashed border-gray-200"><p className="text-[10px] font-bold uppercase text-gray-400">Queue is empty</p></div>}
                  {pendingPlaces.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 hover:border-amber-200 transition-colors">
                      <div>
                        <p className="font-black text-lg text-gray-900 tracking-tight leading-tight">{p.name}</p>
                        <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium">{p.description}</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button onClick={() => handleApprovePlace(p)} className="flex-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-4 py-3 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors uppercase tracking-widest">Approve Spot</button>
                        <button onClick={() => handleDelete('places', p.id)} className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Photos */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />Community Photos ({pendingImages.length})</h3>
                  {pendingImages.length === 0 && <div className="p-8 bg-gray-50 rounded-[2rem] text-center border-2 border-dashed border-gray-200"><p className="text-[10px] font-bold uppercase text-gray-400">Queue is empty</p></div>}
                  <div className="grid grid-cols-2 gap-4">
                    {pendingImages.map(img => (
                      <div key={img.id} className="relative group rounded-[2rem] overflow-hidden aspect-square border border-gray-100 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} className="w-full h-full object-cover" alt="Pending" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                           <p className="text-[8px] text-white font-black truncate w-full uppercase tracking-widest mb-2 text-center">{img.places?.name}</p>
                           <div className="flex gap-2 w-full">
                             <button onClick={() => handleApproveImage(img)} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-colors">✅</button>
                             <button onClick={() => handleDelete('place_images', img.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-[10px] font-black hover:bg-red-600 transition-colors">🗑️</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🟢 TAB: MANAGE LIVE SPOTS */}
            {activeTab === 'live' && (
              <div className="grid grid-cols-1 gap-6">
                {activePlaces.map(place => (
                  <div key={place.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {editingId === place.id ? (
                      <div className="p-8 md:p-12 bg-gray-50">
                        <AdminSpotForm form={form} setForm={setForm} onSubmit={() => handleUpdatePlace(place.id)} onCancel={() => setEditingId(null)} LocationPicker={LocationPicker} />
                      </div>
                    ) : (
                      <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                          <div>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest mr-3 border border-blue-100">{place.category}</span>
                            <h3 className="font-black text-2xl uppercase italic tracking-tight inline-block text-gray-900">{place.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(place)} className="bg-gray-50 hover:bg-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-colors border border-gray-200">Edit Details</button>
                            <button onClick={() => handleDelete('places', place.id)} className="bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-colors">Delete</button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-8 max-w-3xl leading-relaxed font-medium">{place.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                           <div><span className="text-[10px] text-gray-400 block font-black uppercase tracking-widest mb-1">Road Condition</span> <span className="text-xs font-bold text-gray-900">{place.road_condition}</span></div>
                           <div><span className="text-[10px] text-gray-400 block font-black uppercase tracking-widest mb-1">Operating Hours</span> <span className="text-xs font-bold text-gray-900">{place.is_24_hours ? '24/7' : `${place.open_time} - ${place.close_time}`}</span></div>
                           <div><span className="text-[10px] text-gray-400 block font-black uppercase tracking-widest mb-1">Signal</span> <span className="text-xs font-bold text-gray-900">{place.signal_strength}</span></div>
                           <div><span className="text-[10px] text-gray-400 block font-black uppercase tracking-widest mb-1">Entrance Fee</span> <span className="text-xs font-bold text-gray-900">{place.entrance_fee || 'Free'}</span></div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image Gallery</p>
                          <label className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadingId === place.id ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:scale-105 shadow-md'}`}>
                            {uploadingId === place.id ? '⏳ Processing...' : '📸 Upload Photos'}
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAdminUpload(e, place.id)} disabled={uploadingId === place.id} />
                          </label>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide">
                          {place.place_images?.length === 0 && <p className="text-xs text-gray-400 font-bold italic">No photos available for this spot.</p>}
                          {place.place_images?.map((img: any) => {
                            const isCover = place.cover_image_url === img.image_url;
                            return (
                              <div key={img.id} className="relative group shrink-0 w-32 h-32">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.image_url} className={`w-full h-full object-cover rounded-[1.5rem] border-4 transition-all ${isCover ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-100'}`} alt="Spot preview" />
                                {isCover && <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-md uppercase tracking-widest">COVER</div>}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] flex flex-col items-center justify-center gap-2 p-2">
                                  {!isCover && <button onClick={() => handleSetCover(place.id, img.image_url)} className="w-full bg-white text-gray-900 text-[10px] font-black py-2 rounded-xl hover:bg-blue-500 hover:text-white transition-colors uppercase tracking-tight">Set Cover</button>}
                                  <button onClick={() => handleDelete('place_images', img.id)} className="w-full bg-red-500 text-white text-[10px] font-black py-2 rounded-xl hover:bg-red-600 transition-colors uppercase tracking-tight">Delete</button>
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
            )}

            {/* 🟢 TAB: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 gap-4">
                {activeReviews.length === 0 ? (
                  <div className="p-12 bg-white rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No reviews found in database.</p>
                  </div>
                ) : (
                  activeReviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-red-200 hover:shadow-md transition-all">
                      <div className="flex-1 pr-6">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-amber-400 text-sm tracking-widest">{'★'.repeat(rev.rating)}</span>
                          <span className="text-xs font-black text-gray-900 uppercase tracking-tight">@{rev.profiles?.username}</span>
                          <span className="text-[10px] text-gray-300 font-bold uppercase">Reviewed</span>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">{rev.places?.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{rev.review_text}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleBanUser(rev.profiles.id, rev.profiles.username)} className="bg-red-50 text-red-600 text-[8px] font-black px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white uppercase tracking-widest transition-colors whitespace-nowrap border border-red-100">
                          Ban User
                        </button>
                        <button onClick={() => handleDelete('reviews', rev.id)} className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100">
                          Delete Post
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}

function AdminSpotForm({ form, setForm, onSubmit, onCancel, LocationPicker }: any) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Basic Information</label>
          <input className="w-full p-5 border border-gray-200 rounded-2xl font-bold bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" placeholder="Spot Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <textarea className="w-full p-5 border border-gray-200 rounded-2xl text-sm font-medium bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all leading-relaxed" rows={5} placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <input className="w-full p-5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" placeholder="Entrance Fee (e.g. Free, 50 PHP)" value={form.entrance_fee} onChange={e => setForm({...form, entrance_fee: e.target.value})} />
        </div>
        
        <div className="space-y-5">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Attributes & Access</label>
          <div className="grid grid-cols-2 gap-5">
            <select className="w-full p-5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:border-black" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option>Cafe</option><option>Camping</option><option>Viewpoint</option><option>Restaurant</option><option>Resort</option>
            </select>
            <select className="w-full p-5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:border-black" value={form.signal_strength} onChange={e => setForm({...form, signal_strength: e.target.value})}>
              <option>Good</option><option>Weak</option><option>No Signal</option>
            </select>
          </div>
          
          <select className="w-full p-5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:border-black" value={form.road_condition} onChange={e => setForm({...form, road_condition: e.target.value})}>
            <option>Concrete Road (Sedan-friendly)</option>
            <option>Rough Road (High Clearance recommended)</option>
            <option>4x4 Only</option>
          </select>

          <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" checked={form.is_24_hours} onChange={e => setForm({...form, is_24_hours: e.target.checked})} />
              <label className="text-sm font-black uppercase tracking-tight text-gray-900">Open 24/7</label>
            </div>
            {!form.is_24_hours && (
              <div className="flex gap-4">
                <input type="time" className="flex-1 p-3 border border-gray-200 rounded-xl bg-white text-xs font-black outline-none focus:border-black" value={form.open_time} onChange={e => setForm({...form, open_time: e.target.value})} />
                <input type="time" className="flex-1 p-3 border border-gray-200 rounded-xl bg-white text-xs font-black outline-none focus:border-black" value={form.close_time} onChange={e => setForm({...form, close_time: e.target.value})} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-8 mt-8 space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Location Coordinates</label>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic ml-1">Drag the map to fix an inaccurate pin location.</p>
        </div>
        <div className="rounded-[2rem] overflow-hidden border border-gray-200 shadow-inner">
          <LocationPicker 
            onLocationSelect={(lat: string, lng: string) => {
              setForm({ ...form, latitude: parseFloat(lat), longitude: parseFloat(lng) });
            }} 
          />
        </div>
        {form.latitude !== 0 && (
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest text-right pr-2">
            Selected: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
          </p>
        )}
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <button onClick={onSubmit} className="flex-1 bg-black text-white font-black py-5 rounded-2xl shadow-xl hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm">Save Spot Details</button>
        {onCancel && <button onClick={onCancel} className="px-10 bg-white border-2 border-gray-200 text-gray-600 font-black py-5 rounded-2xl text-[10px] hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>}
      </div>
    </div>
  );
}