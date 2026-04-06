'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import dynamic from 'next/dynamic';
import { useToast } from '../../context/ToastContext';
import SpotForm, { SpotFormData } from '../../components/SpotForm';
import Image from 'next/image';

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-[3rem] flex items-center justify-center border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="w-10 h-10 bg-blue-500 rounded-full animate-ping mx-auto mb-4 opacity-20"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Loading Map Engine...</p>
      </div>
    </div>
  )
});

export default function AddSpotPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState<SpotFormData>({
    name: '',
    description: '',
    category: 'Cafe',
    road_condition: 'Concrete Road',
    signal_strength: 'Good Signal',
    entrance_fee: '',
    is_24_hours: false,
    open_time: '08:00',
    close_time: '17:00',
    latitude: 0,
    longitude: 0
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!form.latitude || !form.longitude) {
      showToast("Please drop a pin on the map first!", "error");
      return;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      showToast("Your authentication token expired. PLEASE SIGN OUT AND SIGN BACK IN.", "error");
      return;
    }
    const realUserId = session.user.id;

    if (!imageFile) {
      showToast("Please provide a photo of the spot!", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Target Image using centralized Shared Utility
      const { compressAndUploadImage } = await import('../../utils/uploadService');
      const { publicUrl, error: uploadErr } = await compressAndUploadImage(imageFile, 'spot-images');

      if (uploadErr || !publicUrl) {
        throw new Error(uploadErr || "Image upload failed");
      }

      // 2. Insert Main Spot
      const { data: newPlace, error: placeError } = await supabase.from('places').insert([{
        ...form,
        user_id: realUserId, 
        status: 'pending',
        cover_image_url: publicUrl
      }]).select().single();

      if (placeError) {
        throw new Error(`Database Error: ${placeError.message}`);
      }

      // 3. Link initial image as a gallery asset
      const { error: imageError } = await supabase.from('place_images').insert([{
        place_id: newPlace.id,
        image_url: publicUrl,
        status: 'pending',
        user_id: realUserId
      }]);

      if (imageError) {
        throw new Error(`Linking Error: ${imageError.message}`);
      }

      showToast("Spot submitted for review! +10 Points.", "success");
      
      // 4. Award Gamification Points
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', realUserId).single();
      const currentPoints = profile?.points || 0;
      await supabase.from('profiles').update({ points: currentPoints + 10 }).eq('id', realUserId);

      router.push(`/place/${newPlace.id}`);

    } catch (err: unknown) {
      const error = err as Error;
      console.error("Submission Caught Error:", error);
      showToast(error.message || "Failed to add spot.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-32 pt-24 md:pt-32">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2 block">Map Contributions</span>
            <h1 className="text-4xl md:text-5xl font-[1000] italic uppercase tracking-tighter text-gray-900 leading-[0.85]">
              Add a Spot
            </h1>
          </div>
          <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm hover:bg-gray-100 transition-all font-black">
            ✕
          </button>
        </header>

        <div className="space-y-8">
          
          {/* THE PHOTO SECTION */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><span>📸</span> Primary Photo *</label>
            
            {imagePreview ? (
              <div className="relative w-full h-[30vh] md:h-80 rounded-[1.5rem] overflow-hidden bg-gray-100 shadow-inner group">
                <Image src={imagePreview} alt="Captured" className="object-cover" fill />
                <button 
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute bottom-4 right-4 bg-black/80 text-white backdrop-blur-md px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg active:scale-95 border border-white/20 z-10"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <label className="cursor-pointer bg-gray-50 hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 transition-colors group shadow-sm h-32 md:h-40 p-4 text-center active:scale-95">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform text-blue-500">📁</div>
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-tight">Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>

                <label className="cursor-pointer bg-gray-50 hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 transition-colors group shadow-sm h-32 md:h-40 p-4 text-center active:scale-95">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform text-blue-500">📸</div>
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-tight">Open Camera</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
                </label>
              </div>
            )}
          </div>

          <SpotForm 
            form={form} 
            setForm={setForm} 
            onSubmit={handleSubmit} 
            isSubmitting={loading}
            LocationPicker={LocationPicker}
            submitLabel="🚀 Submit Spot for Review"
          />
          
        </div>
      </div>
    </main>
  );
}