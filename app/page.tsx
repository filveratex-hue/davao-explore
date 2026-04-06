import { supabase } from '../utils/supabase';
import PlaceFeed from '../components/PlaceFeed';
import MapWrapper from '../components/MapWrapper';

export const revalidate = 60;

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
    <main className="min-h-screen bg-white pb-8 md:pb-32">
      
      {/* --- 1. HERO HEADER --- */}
      {/* Compact on mobile, expansive on desktop */}
      <header className="pt-24 pb-8 md:pt-28 md:pb-20 px-5 md:px-6 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/40 via-white to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-8xl font-[1000] tracking-tighter uppercase italic text-gray-900 leading-[0.85] mb-3 md:mb-6 drop-shadow-sm">
            Explore <span className="text-blue-600">Davao</span>
          </h1>
          <p className="max-w-md mx-auto text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] leading-relaxed">
            Uncover the finest hidden gems in the mountains of Catigan and beyond.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* --- 2. 📍 THE MASTER MAP --- */}
        {/* Responsive: shorter on mobile, grandiose on desktop */}
        <section className="mb-12 md:mb-24 -mt-2 md:-mt-4">
          <div className="w-full h-[40vh] md:h-[500px] rounded-2xl md:rounded-[3rem] overflow-hidden shadow-xl md:shadow-2xl shadow-blue-900/10 border-4 md:border-8 border-white relative z-0">
            <MapWrapper places={places || []} />
          </div>
          {/* Mobile scroll hint */}
          <div className="flex justify-center mt-4 md:hidden">
            <div className="flex flex-col items-center gap-1 animate-bounce">
              <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Scroll to explore</span>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7"/>
              </svg>
            </div>
          </div>
        </section>
        
        {/* --- 3. 📰 THE PLACES FEED --- */}
        <section>
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-3 md:gap-4">
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-[1000] uppercase italic tracking-tighter text-gray-900 leading-none">
                Latest Discoveries
              </h2>
              <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] md:tracking-[0.2em] mt-2 md:mt-3">
                Hand-picked by the upland community
              </p>
            </div>
            
            <div className="hidden md:block h-px flex-grow mx-10 bg-gray-100 mb-2" />
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-gray-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest">
                {places?.length || 0} Spots Verified
              </span>
            </div>
          </header>

          <PlaceFeed initialPlaces={places || []} />
        </section>

      </div>
    </main>
  );
}