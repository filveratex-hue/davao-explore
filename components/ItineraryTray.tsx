'use client';

import { useTrip } from '../context/TripContext';
import { useToast } from '../context/ToastContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 👈 1. Import usePathname

export default function ItineraryTray() {
  const { trip, tripIds } = useTrip(); 
  const { showToast } = useToast();
  const pathname = usePathname(); // 👈 2. Get the current URL path

  // 🚀 3. HIDE TRAY IF ON ITINERARY PAGE
  // This prevents the tray from showing up when you're already viewing the route
  if (pathname === '/itinerary') return null;

  if (!tripIds || tripIds.length === 0) return null;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!trip || trip.length === 0) {
      showToast("Loading trip data...", "info");
      return;
    }

    const header = `🚀 *MY CATIGAN EXPLORE ITINERARY* \n\n`;
    const body = trip.map((place: any, index: number) => (
      `${index + 1}. ${place.name} ${getEmoji(place.category)}`
    )).join('\n');
    const footer = `\n\nPlan your own trip at: ${window.location.origin}`;

    const fullText = header + body + footer;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      showToast("Itinerary copied to clipboard!", "success");
    }
  };

  const getEmoji = (cat: string) => {
    const emojis: Record<string, string> = {
      'Cafe': '☕',
      'Camping': '⛺',
      'Viewpoint': '⛰️',
      'Restaurant': '🍽️',
      'Resort': '🏖️'
    };
    return emojis[cat] || '📍';
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[5000] w-[95%] max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-black/90 text-white p-3 pr-4 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex justify-between items-center border border-white/10 backdrop-blur-2xl">
        
        <div className="pl-6">
          <p className="text-[8px] font-[1000] uppercase tracking-[0.4em] text-gray-500 mb-0.5">Current Trip</p>
          <p className="text-sm font-[1000] italic uppercase tracking-tighter flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {tripIds.length} {tripIds.length === 1 ? 'Spot' : 'Spots'} Collected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white hover:text-black transition-all border border-white/5 active:scale-90 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          <Link 
            href="/itinerary"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-12 flex items-center rounded-2xl font-[1000] text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap border-b-4 border-blue-800 hover:border-blue-700"
          >
            View Route →
          </Link>
        </div>
      </div>
    </div>
  );
}