import { supabase } from '../../utils/supabase';
import MapWrapper from '../../components/MapWrapper';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Explore Map | Davao Explore',
  description: 'Discover all the hidden gems of Davao on an interactive map.',
};

export default async function MapPage() {
  const { data: places, error } = await supabase
    .from('places')
    .select(`
      *,
      place_images (image_url, status),
      reviews (rating)
    `)
    .eq('status', 'approved');

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-red-500 font-black uppercase tracking-widest text-[10px]">
        Failed to load map data.
      </div>
    );
  }

  return (
    <main className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Floating header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
        <div className="flex items-center justify-between px-4 pt-4 md:px-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="pointer-events-auto bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">
              {places?.length || 0} Spots Live
            </p>
          </div>
          <Link
            href="/"
            className="pointer-events-auto bg-white/90 backdrop-blur-xl w-12 h-12 rounded-2xl shadow-lg border border-white/50 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Full-screen map */}
      <div className="flex-1 w-full relative z-0">
        <div className="absolute inset-0">
          <MapWrapper places={places || []} />
        </div>
      </div>
    </main>
  );
}
