'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import dynamic from 'next/dynamic';
import { useToast } from '../../context/ToastContext';
import imageCompression from 'browser-image-compression'; // 👈 1. Import the compressor

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-50 animate-pulse rounded-[2rem] flex items-center justify-center text-gray-400 border border-gray-100 uppercase text-[10px] font-black tracking-widest">
      Initializing Map...
    </div>
  )
});

export default function AddSpotPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cafe');
  const [roadCondition, setRoadCondition] = useState('Concrete Road (Sedan-friendly)');
  const [signalStrength, setSignalStrength] = useState('Good');
  const [entranceFee, setEntranceFee] = useState('');
  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login'); 
      } else {
        setUserId(session.user.id);
      }
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
      // 🚀 2. COMPRESS THE IMAGE BEFORE UPLOAD
      const options = {
        maxSizeMB: 0.5, // Shrink to max 500KB
        maxWidthOrHeight: 1920, // Downscale 4K photos to standard HD
        useWebWorker: true, // Use background processing so the app doesn't freeze
      };
      
      const compressedFile = await imageCompression(imageFile, options);
      
      // 1️⃣ UPLOAD COMPRESSED IMAGE TO SUPABASE
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('spot_images') 
        .upload(`public/${fileName}`, compressedFile); // 👈 Upload the compressed file

      if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from('spot_images')
        .getPublicUrl(`public/${fileName}`);

      // 2️⃣ INSERT THE SPOT INTO THE DATABASE
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

      // 3️⃣ Link to place_images table
      await supabase.from('place_images').insert([{
        place_id: newPlace.id,
        image_url: publicUrlData.publicUrl,
        status: 'pending' 
      }]);

      showToast("Spot submitted! Earned +10 Points.", "success");
      router.push('/');
      router.refresh();

    } catch (err: any) {
      console.error('Error adding place:', err);
      showToast(err.message || "Failed to add spot.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-6 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 mt-8 mb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Add a New Spot</h1>
        <p className="text-gray-500 mt-1 font-medium">Contribute a hidden gem and earn +10 points!</p>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* --- 📸 DUAL IMAGE INPUT SECTION --- */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Spot Photo</label>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic mb-3">Snap a picture or select an existing photo of the vibe.</p>
          
          {imagePreview ? (
            <div className="relative w-full h-72 rounded-[2rem] overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Captured" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="absolute top-4 right-4 bg-black/60 text-white backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
              >
                Change Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors group shadow-sm h-40 p-4 text-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-xl group-hover:scale-110 transition-transform text-blue-500">📁</div>
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-tight">Upload<br/>Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>

              <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors group shadow-sm h-40 p-4 text-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-xl group-hover:scale-110 transition-transform text-blue-500">📸</div>
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-tight">Open<br/>Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Spot Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all font-bold"
                placeholder="e.g. Secret View Deck"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none font-bold"
              >
                <option>Cafe</option>
                <option>Camping</option>
                <option>Viewpoint</option>
                <option>Restaurant</option>
                <option>Resort</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-black outline-none h-[126px] text-sm leading-relaxed"
              placeholder="What makes this place special?"
            />
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Road Condition</label>
            <select
              value={roadCondition}
              onChange={(e) => setRoadCondition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none text-xs font-bold"
            >
              <option>Concrete Road (Sedan-friendly)</option>
              <option>Rough Road (High Clearance recommended)</option>
              <option>4x4 Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Signal Strength</label>
            <select
              value={signalStrength}
              onChange={(e) => setSignalStrength(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none text-xs font-bold"
            >
              <option>Good</option>
              <option>Weak</option>
              <option>No Signal</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Entrance Fee</label>
            <input
              type="text"
              value={entranceFee}
              onChange={(e) => setEntranceFee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-xs font-bold"
              placeholder="e.g. Free or 50 PHP"
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Operating Hours</label>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is24Hours"
                checked={is24Hours}
                onChange={(e) => setIs24Hours(e.target.checked)}
                className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="is24Hours" className="text-sm font-black text-gray-700 uppercase tracking-tight">Open 24/7</label>
            </div>

            {!is24Hours && (
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-black bg-white outline-none focus:border-black"
                />
                <span className="text-gray-300 font-black tracking-tighter">—</span>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-black bg-white outline-none focus:border-black"
                />
              </div>
            )}
          </div>
        </div>

        {/* Location Picker */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pinpoint the Location</label>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">Drop a pin exactly where this spot is found.</p>
          </div>
          <div className="rounded-[2rem] overflow-hidden border-2 border-gray-50 shadow-inner group">
            <LocationPicker 
              onLocationSelect={(latitude, longitude) => {
                setLat(latitude);
                setLng(longitude);
              }} 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 disabled:bg-gray-400 disabled:scale-100 uppercase tracking-widest text-sm"
        >
          {loading ? 'Compressing & Uploading...' : 'Publish Spot to Community'}
        </button>
      </form>
    </div>
  );
}