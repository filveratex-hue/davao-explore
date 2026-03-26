import { supabase } from '../utils/supabase';
import PlaceFeed from '../components/PlaceFeed';
import MapWrapper from '../components/MapWrapper';

export const dynamic = 'force-dynamic';

export default async function Home() {
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
        Failed to load places.
      </div>
    );
  }

  return (
    /* 🏔️ Clean, expansive background with a subtle top-center spotlight */
    <main className="min-h-screen bg-white pb-32">
      
      {/* --- 1. HERO HEADER --- */}
      <header className="pt-24 pb-20 px-6 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/40 via-white to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-[1000] tracking-tighter uppercase italic text-gray-900 leading-[0.85] mb-6 drop-shadow-sm">
            Explore <span className="text-blue-600">Davao</span>
          </h1>
          <p className="max-w-md mx-auto text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] leading-relaxed">
            Uncover the finest hidden gems in the mountains of Catigan and beyond.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- 2. 📍 THE MASTER MAP --- */}
        {/* We add a heavy shadow and massive rounding to make the map feel like an "object" floating in the UI */}
        <section className="mb-24 -mt-4">
          <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white relative z-0">
            <MapWrapper places={places || []} />
          </div>
        </section>
        
        {/* --- 3. 📰 THE PLACES FEED --- */}
        <section>
          <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="text-left">
              <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter text-gray-900 leading-none">
                Latest Discoveries
              </h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-3">
                Hand-picked by the upland community
              </p>
            </div>
            
            {/* Elegant thin divider line that spans the remaining width on desktop */}
            <div className="hidden md:block h-px flex-grow mx-10 bg-gray-100 mb-2" />
            
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                {places?.length || 0} Spots Verified
              </span>
            </div>
          </header>

          {/* InitialPlaces passes the data to the client-side Feed which handles searching/filtering */}
          <PlaceFeed initialPlaces={places || []} />
        </section>

      </div>
    </main>
  );
}