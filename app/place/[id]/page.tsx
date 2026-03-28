import { supabase } from '../../../utils/supabase';
import Link from 'next/link';
import DistanceBadge from '../../../components/DistanceBadge';
import ImageUpload from '../../../components/ImageUpload';
import ReviewsSection from '../../../components/ReviewsSection';
import TripBottomBar from '../../../components/TripBottomBar'; // 👈 Your new component

export const dynamic = 'force-dynamic';

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  const { data: images } = await supabase
    .from('place_images')
    .select('image_url')
    .eq('place_id', resolvedParams.id)
    .eq('status', 'approved');

  if (error || !place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-6">
        <h1 className="text-2xl font-[1000] uppercase italic text-gray-300 tracking-tighter">Spot not found</h1>
        <Link href="/" className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">← Go Back</Link>
      </div>
    );
  }

  const heroImage = place.cover_image_url || (images && images.length > 0 ? images[0].image_url : null);
  const galleryImages = images ? images.filter(img => img.image_url !== heroImage) : [];

  return (
    <main className="min-h-screen bg-gray-900 text-gray-900 relative">
      
      {/* 📸 HERO IMAGE (Fixed Background) */}
      <div className="fixed top-0 left-0 w-full h-[55vh] z-0">
        {heroImage ? (
          <img src={heroImage} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />
      </div>

      {/* 🛡️ FLOATING TOP NAV */}
      <div className="fixed top-6 left-0 w-full px-6 z-50 flex justify-between items-center max-w-2xl mx-auto right-0">
        <Link href="/" className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 shadow-lg active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>

      {/* 📄 CONTENT SHEET (Slides over the image) */}
      <div className="relative z-10 mt-[45vh] bg-white rounded-t-[3rem] min-h-[60vh] pb-40 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
        <div className="max-w-2xl mx-auto p-6 md:p-8 pt-8">
          
          {/* Pull Tab Indicator */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />

          {/* Title Header */}
          <div className="mb-8">
            {place.category && (
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] block mb-3">{place.category}</span>
            )}
            <h1 className="text-4xl md:text-5xl font-[1000] uppercase italic tracking-tighter leading-[0.9] mb-4">{place.name}</h1>
            <DistanceBadge placeLat={place.latitude} placeLng={place.longitude} />
          </div>

          {/* Upland Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="bg-orange-50 rounded-2xl p-4 md:p-5 border border-orange-100">
              <span className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1">Road Condition</span>
              <span className="text-xs md:text-sm font-[1000] text-orange-900 tracking-tight flex items-center gap-2">🚙 {place.road_condition || "Any Vehicle"}</span>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 md:p-5 border border-blue-100">
              <span className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Operating Hours</span>
              <span className="text-xs md:text-sm font-[1000] text-blue-900 tracking-tight flex items-center gap-2">⏰ {place.is_24_hours ? '24 Hours' : `${place.open_time?.slice(0,5) || '?'} - ${place.close_time?.slice(0,5) || '?'}`}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">About this spot</h3>
            <p className="text-gray-600 leading-relaxed font-medium">{place.description}</p>
          </div>

          {/* Get Directions (Google Maps fallback) */}
          {place.latitude && place.longitude && (
            <div className="mb-10">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Location Data</h3>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center gap-3 bg-gray-50 text-gray-900 font-[1000] text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors w-full sm:w-auto shadow-sm"
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          )}

          <hr className="border-gray-100 mb-10" />

          {/* Image Upload Component */}
          <div className="mb-12">
            <ImageUpload placeId={place.id} />
          </div>

          {/* Community Photo Gallery */}
          {galleryImages.length > 0 && (
            <div className="mb-12">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Community Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((img, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt={`Photo ${index}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Component */}
          <div>
            <ReviewsSection placeId={place.id} />
          </div>

        </div>
      </div>

      {/* 🚗 CLIENT COMPONENT: STICKY BOTTOM ACTION BAR */}
      <TripBottomBar placeId={place.id} />

    </main>
  );
}