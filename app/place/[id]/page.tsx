import { supabase } from '../../../utils/supabase';
import Link from 'next/link';
import DistanceBadge from '../../../components/DistanceBadge';
import ImageUpload from '../../../components/ImageUpload';
import ReviewsSection from '../../../components/ReviewsSection';

// 👇 FIX CACHING: Ensure the spot page always fetches the latest cover
export const dynamic = 'force-dynamic';

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Fetch the place details (This includes the cover_image_url)
  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  // Fetch all APPROVED images for this specific place
  const { data: images } = await supabase
    .from('place_images')
    .select('image_url')
    .eq('place_id', resolvedParams.id)
    .eq('status', 'approved');

  if (error || !place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900">Spot not found</h1>
        <Link href="/" className="text-blue-600 mt-4 hover:underline">← Back to Map</Link>
      </div>
    );
  }

  // 1. HERO IMAGE FIX: Prioritize Admin cover, fallback to the first image in the array
  const heroImage = place.cover_image_url || (images && images.length > 0 ? images[0].image_url : null);
  
  // 2. GALLERY FIX: Show all other images, but filter out the one currently used as the hero
  const galleryImages = images ? images.filter(img => img.image_url !== heroImage) : [];

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Dynamic Hero Image Area */}
      <div 
        className="h-64 md:h-96 w-full relative bg-gray-300 bg-cover bg-center"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : {}}
      >
         <div className="absolute top-4 left-4 z-10">
            <Link href="/" className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-white transition">
              ← Back
            </Link>
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{place.name}</h1>
              <div className="mt-2">
                <DistanceBadge placeLat={place.latitude} placeLng={place.longitude} />
              </div>
            </div>
            
            {place.latitude && place.longitude && (
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-sm w-full sm:w-auto"
              >
                🗺️ Get Directions
              </a>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">About this spot</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{place.description}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <span className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Road Condition</span>
                <span className="text-orange-900 font-medium flex items-center gap-2">
                  🚗 {place.road_condition || 'Unknown'}
                </span>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Operating Hours</span>
                <span className="text-blue-900 font-medium flex items-center gap-2">
                  ⏰ {place.is_24_hours ? 'Open 24 Hours' : `${place.open_time?.slice(0,5) || '?'} - ${place.close_time?.slice(0,5) || '?'}`}
                </span>
              </div>
            </div>

            <div>
              <ImageUpload placeId={place.id} />
            </div>
          </div>

          {/* --- NEW COMMUNITY PHOTO GALLERY --- */}
          {galleryImages.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Community Photos</h2>
              {/* This creates a beautiful, responsive grid that adjusts to screen size */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((img, index) => (
                  <div 
                    key={index} 
                    className="aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.image_url} 
                      alt={`Community photo of ${place.name}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- NEW REVIEWS SECTION --- */}
          <ReviewsSection placeId={place.id} />

        </div>
      </div>
    </main>
  );
}