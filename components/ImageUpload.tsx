'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function ImageUpload({ placeId }: { placeId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const handleUpload = async () => {
    if (!file || !userId) return;
    setLoading(true);

    try {
      // --- GUARDRAIL 1: Spot Limit Check (Max 10 photos per spot) ---
      const { count: spotCount, error: spotError } = await supabase
        .from('place_images')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', placeId); // We count both pending and approved

      if (spotError) throw spotError;

      if (spotCount !== null && spotCount >= 10) {
        alert("📸 This spot already has a full gallery of 10 photos! Try finding a new spot to document.");
        setLoading(false);
        return; 
      }

      // --- GUARDRAIL 2: User Daily Limit Check (Max 3 per 24 hours) ---
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count: userCount, error: userError } = await supabase
        .from('place_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) 
        .gte('created_at', twentyFourHoursAgo);

      if (userError) throw userError;

      if (userCount !== null && userCount >= 3) {
        alert("🛑 You've reached your daily limit of 3 photo uploads! Thanks for contributing, come back tomorrow to upload more.");
        setLoading(false);
        return; 
      }

      // --- IF BOTH CHECKS PASS, PROCEED WITH UPLOAD ---
      const { compressAndUploadImage } = await import('../utils/uploadService');
      const { publicUrl, error: uploadErr } = await compressAndUploadImage(file, 'spot-images', `${placeId}/`);

      if (uploadErr || !publicUrl) throw new Error(uploadErr || "Upload failed");

      const { error: dbError } = await supabase
        .from('place_images')
        .insert([{
          place_id: placeId,
          image_url: publicUrl,
          user_id: userId,
          status: 'pending' 
        }]);

      if (dbError) throw dbError;

      // --- AWARD POINTS ---
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
      const currentPoints = profile?.points || 0;
      await supabase.from('profiles').update({ points: currentPoints + 5 }).eq('id', userId);

      alert('📸 Photo uploaded! +5 Points. It will appear in the gallery once approved.');
      setFile(null); 
      
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Upload failed:', err.message);
      alert('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center">
        <p className="text-sm text-gray-500">Log in to upload photos of this spot!</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex flex-col gap-3">
      <h3 className="text-sm font-bold text-blue-900">Upload a Photo</h3>
      <p className="text-xs text-blue-700 -mt-2">Limit 3 per day. Max 10 photos per spot.</p>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying & Uploading...' : 'Submit Photo'}
      </button>
    </div>
  );
}