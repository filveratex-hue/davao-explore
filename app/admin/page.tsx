'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import AdminGuard from '../../components/AdminGuard';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // <--- Right here
import { useToast } from '../../context/ToastContext';
import imageCompression from 'browser-image-compression'; 
import dynamicImport from 'next/dynamic';

const LocationPicker = dynamicImport(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-gray-50 animate-pulse rounded-[2rem] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 uppercase text-[10px] font-black tracking-widest">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20" />
        Loading Map Editor...
      </div>
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
  
  const [activeTab, setActiveTab] = useState<'pending' | 'live' | 'reviews'>('pending');

  const router = useRouter();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    road_condition: 'Concrete Road',
    is_24_hours: false,
    open_time: '08:00',
    close_time: '17:00',
    category: 'Cafe',
    signal_strength: 'Good Signal',
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
    const { data: aPlaces } = await supabase.from('places').select('*, place_images(*)').eq('status', 'approved').order('created_at', { ascending: false });
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
    if (!window.confirm(`🚨 EXTREME ACTION: Are you sure you want to ban @${username}? They will be locked out.`)) return;
    const { data, error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId).select();
    
    if (error) showToast(error.message, "error");
    else if (!data || data.length === 0) showToast("Database Blocked: You don't have RLS permission.", "error");
    else { showToast(`User @${username} has been permanently banned.`, "success"); fetchData(); }
  };

  const handleApproveUser = async (userId: string, username: string) => {
    const { data, error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId).select();
    if (error) showToast(error.message, "error");
    else if (!data || data.length === 0) showToast("Database Blocked: You don't have RLS permission.", "error");
    else { showToast(`User @${username} approved!`, "success"); fetchData(); }
  };

  const handleRejectUser = async (userId: string, username: string) => {
    if (!window.confirm(`Reject @${username}'s application?`)) return;
    const { data, error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId).select();
    if (error) showToast(error.message, "error");
    else if (!data || data.length === 0) showToast("Database Blocked: You don't have RLS permission.", "error");
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
      name: place.name, description: place.description, road_condition: place.road_condition || 'Concrete Road',
      is_24_hours: place.is_24_hours || false, open_time: place.open_time || '08:00', close_time: place.close_time || '17:00',
      category: place.category || 'Cafe', signal_strength: place.signal_strength || 'Good Signal', entrance_fee: place.entrance_fee || '',
      latitude: place.latitude || 0, longitude: place.longitude || 0
    });
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', road_condition: 'Concrete Road', is_24_hours: false, open_time: '08:00', close_time: '17:00',
      category: 'Cafe', signal_strength: 'Good Signal', entrance_fee: '', latitude: 0, longitude: 0
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
      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 mt-8 pb-32 text-gray-900">
        
        {/* --- 1. HEADER --- */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
              Live Feed
            </span>
            <h1 className="text-4xl md:text-5xl font-[1000] tracking-tighter uppercase italic text-gray-900 leading-[0.85]">
              Command <span className="text-purple-600">Center</span>
            </h1>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => { setIsAdding(!isAdding); resetForm(); }}
              className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isAdding ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-black text-white hover:bg-purple-600'}`}
            >
              {isAdding ? 'Cancel Editing' : '+ Add New Spot'}
            </button>
            <Link href="/" className="px-5 py-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-colors font-black flex items-center justify-center">
              ✕
            </Link>
          </div>
        </header>

        {/* --- 2. ADD SPOT MODAL/PANEL --- */}
        {isAdding && (
          <section className="mb-12 bg-white p-6 md:p-12 rounded-[3rem] border border-purple-100 shadow-2xl shadow-purple-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2" />
            <h2 className="text-2xl font-[1000] mb-8 uppercase italic tracking-tight text-purple-900">Create / Edit Spot</h2>
            <AdminSpotForm form={form} setForm={setForm} onSubmit={handleAddPlace} LocationPicker={LocationPicker} />
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="animate-pulse text-gray-300 font-black uppercase tracking-widest text-[10px] flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
              Syncing Database...
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            
            {/* --- 3. STATISTICS ROW --- */}
            {!isAdding && (
              <section className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-[1000] text-gray-900">{activePlaces.length}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Live Spots</span>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-[1000] text-gray-900">{activeReviews.length}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Reviews</span>
                </div>
                <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-[1000] text-amber-600">{pendingPlaces.length}</span>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">Pending Spots</span>
                </div>
                <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-[1000] text-blue-600">{pendingImages.length}</span>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Pending Photos</span>
                </div>
                <div className="bg-purple-50 p-5 rounded-[2rem] border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl md:text-4xl font-[1000] text-purple-600">{pendingUsers.length}</span>
                  <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest mt-1">Pending Users</span>
                </div>
              </section>
            )}

            {/* --- 4. TABS NAVIGATION --- */}
            <div className="flex flex-wrap gap-2 md:gap-3 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm w-fit">
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3.5 rounded-2xl font-[1000] text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-black text-white shadow-lg' : 'bg-transparent text-gray-400 hover:text-gray-900'}`}
              >
                Approvals Queue
                {totalPending > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">{totalPending}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`px-6 py-3.5 rounded-2xl font-[1000] text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-black text-white shadow-lg' : 'bg-transparent text-gray-400 hover:text-gray-900'}`}
              >
                Manage Map
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3.5 rounded-2xl font-[1000] text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-black text-white shadow-lg' : 'bg-transparent text-gray-400 hover:text-gray-900'}`}
              >
                Community
              </button>
            </div>

            {/* --- 5. TAB CONTENT AREAS --- */}
            
            {/* 🟢 TAB: PENDING APPROVALS */}
            {activeTab === 'pending' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Pending Users */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />New Users ({pendingUsers.length})</h3>
                  {pendingUsers.length === 0 && <div className="p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center"><p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Queue is clear</p></div>}
                  {pendingUsers.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                      <div>
                        <p className="font-[1000] text-lg text-gray-900 tracking-tight italic uppercase">@{u.username}</p>
                        <p className="text-[9px] font-black text-purple-400 mt-1 uppercase tracking-widest">Awaiting Access</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button onClick={() => handleApproveUser(u.id, u.username)} className="flex-1 bg-purple-50 text-purple-700 text-[9px] font-black px-4 py-3 rounded-xl hover:bg-purple-600 hover:text-white transition-colors uppercase tracking-widest border border-purple-100">Approve</button>
                        <button onClick={() => handleRejectUser(u.id, u.username)} className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors border border-red-100">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Places */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />Spot Submissions ({pendingPlaces.length})</h3>
                  {pendingPlaces.length === 0 && <div className="p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center"><p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Queue is clear</p></div>}
                  {pendingPlaces.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-amber-400" />
                      <div>
                        <p className="font-[1000] text-xl text-gray-900 tracking-tight leading-none italic uppercase mb-2">{p.name}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">{p.description}</p>
                      </div>
                      <div className="flex gap-2 w-full mt-2">
                        <button onClick={() => handleApprovePlace(p)} className="flex-1 bg-black text-white text-[9px] font-black px-4 py-3 rounded-xl hover:bg-amber-500 transition-colors uppercase tracking-widest shadow-md">✓ Publish</button>
                        <button onClick={() => handleDelete('places', p.id)} className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors border border-red-100">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Photos */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />Community Photos ({pendingImages.length})</h3>
                  {pendingImages.length === 0 && <div className="p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center"><p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Queue is clear</p></div>}
                  <div className="grid grid-cols-2 gap-3">
                    {pendingImages.map(img => (
                      <div key={img.id} className="relative group rounded-[1.5rem] overflow-hidden aspect-square border border-gray-100 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} className="w-full h-full object-cover" alt="Pending" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pb-3 backdrop-blur-sm">
                           <p className="text-[8px] text-white font-black truncate w-full uppercase tracking-widest mb-2 text-center">{img.places?.name}</p>
                           <div className="flex gap-2 w-full">
                             <button onClick={() => handleApproveImage(img)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black hover:bg-blue-500 transition-colors shadow-sm">✓</button>
                             <button onClick={() => handleDelete('place_images', img.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors shadow-sm">✕</button>
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
                      <div className="p-6 md:p-10 bg-purple-50/50">
                        <AdminSpotForm form={form} setForm={setForm} onSubmit={() => handleUpdatePlace(place.id)} onCancel={() => setEditingId(null)} LocationPicker={LocationPicker} />
                      </div>
                    ) : (
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-6">
                          <div>
                            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg uppercase tracking-widest mb-3 inline-block border border-blue-100">{place.category}</span>
                            <h3 className="font-[1000] text-2xl md:text-3xl uppercase italic tracking-tighter text-gray-900 leading-none">{place.name}</h3>
                          </div>
                          <div className="flex gap-2 w-full lg:w-auto">
                            <button onClick={() => startEdit(place)} className="flex-1 lg:flex-none bg-gray-50 hover:bg-gray-100 text-gray-900 font-black text-[9px] uppercase tracking-widest px-5 py-3 rounded-xl transition-colors border border-gray-200">Edit Details</button>
                            <button onClick={() => handleDelete('places', place.id)} className="flex-1 lg:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-black text-[9px] uppercase tracking-widest px-5 py-3 rounded-xl transition-colors border border-red-100">Delete Permanently</button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-8 max-w-4xl leading-relaxed font-medium">{place.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><span className="text-[9px] text-gray-400 block font-black uppercase tracking-widest mb-1">Road Condition</span> <span className="text-xs font-[1000] text-gray-900">{place.road_condition}</span></div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><span className="text-[9px] text-gray-400 block font-black uppercase tracking-widest mb-1">Operating Hours</span> <span className="text-xs font-[1000] text-gray-900">{place.is_24_hours ? '24/7' : `${place.open_time} - ${place.close_time}`}</span></div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><span className="text-[9px] text-gray-400 block font-black uppercase tracking-widest mb-1">Signal</span> <span className="text-xs font-[1000] text-gray-900">{place.signal_strength}</span></div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><span className="text-[9px] text-gray-400 block font-black uppercase tracking-widest mb-1">Entrance Fee</span> <span className="text-xs font-[1000] text-gray-900">{place.entrance_fee || 'Free'}</span></div>
                        </div>

                        <div className="flex justify-between items-center mb-6 pt-6 border-t border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image Gallery</p>
                          <label className={`cursor-pointer px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${uploadingId === place.id ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:scale-105 shadow-md active:scale-95'}`}>
                            {uploadingId === place.id ? '⏳ Processing...' : '📸 Upload Photos'}
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAdminUpload(e, place.id)} disabled={uploadingId === place.id} />
                          </label>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide">
                          {place.place_images?.length === 0 && <p className="text-[10px] text-gray-400 font-bold italic uppercase tracking-widest px-2">No photos available.</p>}
                          {place.place_images?.map((img: any) => {
                            const isCover = place.cover_image_url === img.image_url;
                            return (
                              <div key={img.id} className="relative group shrink-0 w-32 h-32 md:w-40 md:h-40">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.image_url} className={`w-full h-full object-cover rounded-[1.5rem] transition-all ${isCover ? 'border-4 border-blue-500 shadow-xl scale-100' : 'border border-gray-200 opacity-90 group-hover:opacity-100'}`} alt="Spot preview" />
                                
                                {isCover && (
                                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-[9px] font-[1000] px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest border border-blue-400/50 backdrop-blur-md">
                                    Primary Cover
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] flex flex-col items-center justify-center gap-2 p-3 backdrop-blur-sm">
                                  {!isCover && <button onClick={() => handleSetCover(place.id, img.image_url)} className="w-full bg-white text-gray-900 text-[9px] font-black py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors uppercase tracking-widest">Set Cover</button>}
                                  <button onClick={() => handleDelete('place_images', img.id)} className="w-full bg-red-500 text-white text-[9px] font-black py-2.5 rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest">Delete Photo</button>
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
              <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {activeReviews.length === 0 ? (
                  <div className="p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No reviews found in database.</p>
                  </div>
                ) : (
                  activeReviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-red-100 transition-all">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="text-amber-400 text-sm tracking-widest">{'★'.repeat(rev.rating)}</span>
                          <span className="text-xs font-[1000] text-gray-900 uppercase tracking-tight italic">@{rev.profiles?.username}</span>
                          <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Reviewed</span>
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{rev.places?.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{rev.review_text}</p>
                      </div>
                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                        <button onClick={() => handleDelete('reviews', rev.id)} className="flex-1 md:flex-none px-5 py-3 bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-gray-200 hover:border-red-200">
                          Delete Post
                        </button>
                        <button onClick={() => handleBanUser(rev.profiles.id, rev.profiles.username)} className="flex-1 md:flex-none bg-red-50 text-red-600 text-[9px] font-black px-5 py-3 rounded-xl hover:bg-red-600 hover:text-white uppercase tracking-widest transition-colors border border-red-100">
                          Ban User
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

// --- SUBCOMPONENT: PILL-BASED ADMIN FORM ---
function AdminSpotForm({ form, setForm, onSubmit, onCancel, LocationPicker }: any) {
  const categories = ['Cafe', 'Viewpoint', 'Camping', 'Resort', 'Restaurant', 'Trail'];
  const roadTypes = ['Concrete Road', 'Rough Road', '4x4 Only'];
  const signalTypes = ['Good Signal', 'Spotty', 'No Signal'];

  return (
    <div className="space-y-10">
      
      {/* Basic Info & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Spot Name</label>
            <input className="w-full p-5 border-none rounded-2xl font-[1000] text-lg bg-gray-50 outline-none focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-gray-300" placeholder="e.g. Secret Viewdeck" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</label>
            <textarea className="w-full p-5 border-none rounded-2xl text-sm font-medium bg-gray-50 outline-none focus:ring-4 focus:ring-purple-100 transition-all leading-relaxed placeholder:text-gray-300 resize-none" rows={5} placeholder="What makes this spot special?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button 
                  key={cat} type="button" onClick={() => setForm({...form, category: cat})}
                  className={`px-4 py-3 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
                    form.category === cat ? 'bg-black text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Entrance Fee</label>
            <input className="w-full p-5 border-none rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-gray-300" placeholder="e.g. Free or 50 PHP" value={form.entrance_fee} onChange={e => setForm({...form, entrance_fee: e.target.value})} />
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Upland Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><span>🚙</span> Road Condition</label>
          <div className="flex flex-col gap-2">
            {roadTypes.map(type => (
              <button 
                key={type} type="button" onClick={() => setForm({...form, road_condition: type})}
                className={`p-4 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all text-left ${
                  form.road_condition === type ? 'bg-orange-50 text-orange-700 border-2 border-orange-200 shadow-sm' : 'bg-transparent text-gray-500 border-2 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><span>📶</span> Signal Strength</label>
          <div className="flex flex-col gap-2">
            {signalTypes.map(type => (
              <button 
                key={type} type="button" onClick={() => setForm({...form, signal_strength: type})}
                className={`p-4 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all text-left ${
                  form.signal_strength === type ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm' : 'bg-transparent text-gray-500 border-2 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Operating Hours & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 h-fit">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Operating Hours</label>
          <div className="flex items-center gap-3 mb-4">
            <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black accent-black" checked={form.is_24_hours} onChange={e => setForm({...form, is_24_hours: e.target.checked})} />
            <label className="text-sm font-black uppercase tracking-tight text-gray-900">Open 24/7</label>
          </div>
          {!form.is_24_hours && (
            <div className="flex gap-4 items-center">
              <input type="time" className="flex-1 p-4 border border-gray-200 rounded-xl bg-white text-xs font-black outline-none focus:border-black shadow-sm" value={form.open_time} onChange={e => setForm({...form, open_time: e.target.value})} />
              <span className="text-gray-300 font-black tracking-tighter">—</span>
              <input type="time" className="flex-1 p-4 border border-gray-200 rounded-xl bg-white text-xs font-black outline-none focus:border-black shadow-sm" value={form.close_time} onChange={e => setForm({...form, close_time: e.target.value})} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pinpoint Location</label>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight italic ml-1 mb-3">Ensure the pin is exactly on the spot.</p>
          </div>
          <div className="rounded-[2rem] overflow-hidden border-4 border-gray-50 shadow-inner h-[250px] z-0">
            <LocationPicker 
              onLocationSelect={(lat: string, lng: string) => {
                setForm({ ...form, latitude: parseFloat(lat), longitude: parseFloat(lng) });
              }} 
            />
          </div>
          {form.latitude !== 0 && (
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest text-right pr-2">
              GPS Locked: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-100">
        <button onClick={onSubmit} className="flex-1 bg-purple-600 text-white font-[1000] py-5 md:py-6 rounded-[2rem] shadow-xl hover:bg-purple-500 transition-colors uppercase tracking-widest text-[11px] md:text-sm active:scale-95 border-b-4 border-purple-800">
          Save Spot Details
        </button>
        {onCancel && (
          <button onClick={onCancel} className="md:px-12 bg-white border border-gray-200 text-gray-500 font-black py-5 rounded-[2rem] text-[10px] hover:bg-gray-50 hover:text-gray-900 transition-colors uppercase tracking-widest">
            Cancel Edit
          </button>
        )}
      </div>
    </div>
  );
}