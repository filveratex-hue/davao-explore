'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import dynamic from 'next/dynamic';
import { useToast } from '../../context/ToastContext';
import imageCompression from 'browser-image-compression';

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-[3rem] flex items-center justify-center border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="w-10 h-10 bg-blue-500 rounded-full animate-ping mx-auto mb-4 opacity-20"></div>
        <p className="text-[10px] font-[1000] text-gray-400 uppercase tracking-widest italic">Loading Map Engine...</p>
      </div>
    </div>
  )
});

export default function AddSpotPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cafe');
  const [roadCondition, setRoadCondition] = useState('Concrete Road');
  const [signalStrength, setSignalStrength] = useState('Good Signal');
  const [entranceFee, setEntranceFee] = useState('');
  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = ['Cafe', 'Viewpoint', 'Camping', 'Resort', 'Restaurant', 'Trail'];
  const roadTypes = ['Concrete Road', 'Rough Road', '4x4 Only'];
  const signalTypes = ['Good Signal', 'Spotty', 'No Signal'];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login'); 
      else setUserId(session.user.id);
    });
  }, [router]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lat || !lng) {
      showToast("Please drop a pin on the map first!", "error");
      return;
    }

    if (!imageFile) {
      showToast("Please provide a photo of the spot!", "error");
      return;
    }

    setLoading(true);

    try {
      // COMPRESS THE IMAGE
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(imageFile, options);
      
      // UPLOAD IMAGE
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('spot_images') 
        .upload(`public/${fileName}`, compressedFile);

      if (uploadError) throw new Error("Image upload failed.");

      const { data: publicUrlData } = supabase.storage
        .from('spot_images')
        .getPublicUrl(`public/${fileName}`);

      // INSERT SPOT
      const { data: newPlace, error: placeError } = await supabase.from('places').insert([
        {
          name,
          description,
          category,
          road_condition: roadCondition,
          signal_strength: signalStrength,
          entrance_fee: entranceFee,
          is_24_hours: is24Hours,
          open_time: is24Hours ? null : openTime,
          close_time: is24Hours ? null : closeTime,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          user_id: userId, 
          status: 'pending',
          cover_image_url: publicUrlData.publicUrl
        }
      ]).select().single();

      if (placeError) throw placeError;

      // LINK IMAGE
      await supabase.from('place_images').insert([{
        place_id: newPlace.id,
        image_url: publicUrlData.publicUrl,
        status: 'pending' 
      }]);

      showToast("Spot submitted for review! +10 Points.", "success");
      // Redirect to the newly created spot's detail page
      router.push(`/place/${newPlace.id}`);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to add spot.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-40 pt-24 md:pt-32">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        
        {/* HEADER */}
        <header className="mb-8 md:mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-[1000] italic uppercase tracking-tighter text-gray-900 leading-[0.85]">
              Add a <span className="text-blue-600">Spot</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] mt-3">Expand the Upland Map</p>
          </div>
          <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm hover:text-red-500 active:scale-90 transition-all font-black">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* CARD 1: THE PHOTO */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><span>📸</span> Primary Photo *</label>
            
            {imagePreview ? (
              <div className="relative w-full h-[40vh] md:h-80 rounded-[1.5rem] overflow-hidden bg-gray-100 shadow-inner group">
                <img src={imagePreview} alt="Captured" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute bottom-4 right-4 bg-black/60 text-white backdrop-blur-md px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg active:scale-95 border border-white/20"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <label className="cursor-pointer bg-gray-50 hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 transition-colors group shadow-sm h-32 md:h-40 p-4 text-center active:scale-95">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-md flex items-center justify-center text-lg md:text-xl group-hover:scale-110 transition-transform text-blue-500">📁</div>
                  <span className="text-[9px] md:text-[10px] font-black text-gray-900 uppercase tracking-widest leading-tight">Upload<br/>Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>

                <label className="cursor-pointer bg-gray-50 hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 transition-colors group shadow-sm h-32 md:h-40 p-4 text-center active:scale-95">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-md flex items-center justify-center text-lg md:text-xl group-hover:scale-110 transition-transform text-blue-500">📸</div>
                  <span className="text-[9px] md:text-[10px] font-black text-gray-900 uppercase tracking-widest leading-tight">Open<br/>Camera</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
                </label>
              </div>
            )}
          </div>

          {/* CARD 2: BASIC INFO (Pill Selectors) */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Spot Name *</label>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Secret Viewdeck"
                className="w-full bg-gray-50 border-none rounded-2xl p-4 md:p-5 font-[1000] text-lg text-gray-900 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-300 placeholder:font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button 
                    key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`px-4 py-3 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
                      category === cat ? 'bg-black text-white shadow-md scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Description *</label>
              <textarea 
                required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this spot worth the drive?"
                className="w-full bg-gray-50 border-none rounded-2xl p-4 md:p-5 font-medium text-sm text-gray-900 focus:ring-4 focus:ring-blue-100 transition-all resize-none placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* CARD 3: MAP PIN */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2"><span>📍</span> Drop the Pin *</label>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight italic mb-4">Zoom in and tap exactly where the spot is located.</p>
            </div>
            <div className="h-[40vh] md:h-[400px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-4 border-gray-50 shadow-inner z-0">
              <LocationPicker 
                onLocationSelect={(latitude, longitude) => {
                  setLat(latitude);
                  setLng(longitude);
                }} 
              />
            </div>
          </div>

          {/* CARD 4: UPLAND DATA */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8 mb-32">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Road Condition */}
              <div>
                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><span>🚙</span> Road Condition</label>
                <div className="flex flex-col gap-2">
                  {roadTypes.map(type => (
                    <button 
                      key={type} type="button" onClick={() => setRoadCondition(type)}
                      className={`p-4 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all text-left ${
                        roadCondition === type ? 'bg-orange-50 text-orange-700 border-2 border-orange-200 shadow-sm' : 'bg-transparent text-gray-500 border-2 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signal Strength */}
              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><span>📶</span> Signal Strength</label>
                <div className="flex flex-col gap-2">
                  {signalTypes.map(type => (
                    <button 
                      key={type} type="button" onClick={() => setSignalStrength(type)}
                      className={`p-4 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all text-left ${
                        signalStrength === type ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm' : 'bg-transparent text-gray-500 border-2 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Operating Hours & Fee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Operating Hours</label>
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox" id="is24Hours" checked={is24Hours} onChange={(e) => setIs24Hours(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black accent-black"
                      />
                      <label htmlFor="is24Hours" className="text-sm font-black text-gray-700 uppercase tracking-tight">Open 24/7</label>
                    </div>

                    {!is24Hours && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-black bg-white outline-none focus:border-black"
                        />
                        <span className="text-gray-300 font-black">—</span>
                        <input
                          type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-black bg-white outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Entrance Fee</label>
                 <input
                   type="text" value={entranceFee} onChange={(e) => setEntranceFee(e.target.value)}
                   className="w-full bg-gray-50 p-5 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold placeholder:text-gray-300 placeholder:font-medium"
                   placeholder="e.g. Free or 50 PHP"
                 />
               </div>
            </div>
          </div>

          {/* STICKY SUBMIT BAR */}
          <div className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-3xl border-t border-white/50 pb-8 pt-4 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="max-w-2xl mx-auto">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-[1000] text-[11px] md:text-sm py-5 md:py-6 rounded-[2rem] uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-95 flex items-center justify-center gap-3 border-b-4 md:border-b-8 border-blue-800 backdrop-blur-md disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? 'Compressing & Uploading...' : '🚀 Submit for Review'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}