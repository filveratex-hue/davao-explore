import { supabase } from '../../../utils/supabase';
import { Place } from '../../../types';
import DistanceBadge from '../../../components/DistanceBadge';
import ImageUpload from '../../../components/ImageUpload';
import ReviewsSection from '../../../components/ReviewsSection';
import TripBottomBar from '../../../components/TripBottomBar';
import PlaceHero from '../../../components/PlaceHero';
import PlaceDetailsGrid from '../../../components/PlaceDetailsGrid';
import PlaceGallery from '../../../components/PlaceGallery';
import QuickShareButton from '../../../components/QuickShareButton';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const { data: place } = await supabase.from('places').select('*').eq('id', resolvedParams.id).single();
  
  if (!place) return { title: 'Not Found' };
  
  return {
    title: `${place.name} | Davao Explore`,
    description: place.description?.slice(0, 150) + '...',
    openGraph: {
      images: place.cover_image_url ? [place.cover_image_url] : [],
    }
  };
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const { data: placeData, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  const { data: images } = await supabase
    .from('place_images')
    .select('image_url')
    .eq('place_id', resolvedParams.id)
    .eq('status', 'approved');

  if (error || !placeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-6">
        <h1 className="text-2xl font-[1000] uppercase italic text-gray-300 tracking-tighter">Spot not found</h1>
        <Link href="/" className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">← Go Back</Link>
      </div>
    );
  }

  const place: Place = placeData;
  const heroImage = place.cover_image_url || (images && images.length > 0 ? images[0].image_url : null);
  const galleryImages = images ? images.filter(img => img.image_url !== heroImage) : [];

  return (
    <main className="min-h-screen bg-gray-900 text-gray-900 relative">
      
      <PlaceHero heroImage={heroImage} placeName={place.name} />

      {/* Content card — closer to top on mobile */}
      <div className="relative z-10 mt-[35vh] md:mt-[45vh] bg-white rounded-t-[2rem] md:rounded-t-[3rem] min-h-[60vh] pb-32 md:pb-40 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
        <div className="max-w-2xl mx-auto p-5 md:p-8 pt-6 md:pt-8">
          
          {/* Drag handle indicator */}
          <div className="w-10 md:w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 md:mb-8" />

          {/* Title section */}
          <div className="mb-6 md:mb-8">
            {place.category && (
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] block mb-2 md:mb-3">{place.category}</span>
            )}
            <h1 className="text-3xl md:text-5xl font-[1000] uppercase italic tracking-tighter leading-[0.9] mb-3 md:mb-4">{place.name}</h1>
            <DistanceBadge placeLat={place.latitude ?? null} placeLng={place.longitude ?? null} />
          </div>

          {/* Quick Action Row — Mobile only */}
          {place.latitude && place.longitude && (
            <div className="flex gap-2 mb-6 md:hidden">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-transform shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Navigate
              </a>
              <QuickShareButton />
            </div>
          )}

          <PlaceDetailsGrid 
            roadCondition={place.road_condition} 
            is24Hours={place.is_24_hours} 
            openTime={place.open_time} 
            closeTime={place.close_time} 
          />

          <div className="mb-8 md:mb-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 md:mb-4">About this spot</h3>
            <p className="text-gray-600 leading-relaxed font-medium text-sm md:text-base">{place.description}</p>
          </div>

          {/* Desktop: Google Maps link */}
          {place.latitude && place.longitude && (
            <div className="mb-8 md:mb-10 hidden md:block">
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

          <hr className="border-gray-100 mb-8 md:mb-10" />

          <div className="mb-8 md:mb-12">
            <ImageUpload placeId={place.id} />
          </div>

          {galleryImages.length > 0 && (
            <PlaceGallery galleryImages={galleryImages} />
          )}

          <div>
            <ReviewsSection placeId={place.id} />
          </div>

        </div>
      </div>

      <TripBottomBar place={place} />

    </main>
  );
}