'use client';

import { useTrip } from '../context/TripContext';
import { useToast } from '../context/ToastContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Place } from '../types';

export default function ItineraryTray() {
  const { trip, tripIds } = useTrip(); 
  const { showToast } = useToast();
  const pathname = usePathname();

  // Hide tray on itinerary page (already viewing route)
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
    const body = trip.map((place: Place, index: number) => (
      `${index + 1}. ${place.name} ${getEmoji(place.category || '')}`
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
    /* Raised above the tab bar on mobile: bottom = tab-bar-h + safe-area + gap */
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[4500] w-[92%] max-w-md animate-fade-up"
      style={{ bottom: 'max(7.5rem, calc(var(--tab-bar-h) + env(safe-area-inset-bottom) + 1rem))' }}
    >
      <div className="bg-black/90 text-white p-2.5 md:p-3 pr-3 md:pr-4 rounded-2xl md:rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex justify-between items-center border border-white/10 backdrop-blur-2xl">
        
        <div className="pl-4 md:pl-6 min-w-0">
          <p className="text-[7px] md:text-[8px] font-[1000] uppercase tracking-[0.3em] md:tracking-[0.4em] text-gray-500 mb-0.5 truncate">Current Trip</p>
          <p className="text-xs md:text-sm font-[1000] italic uppercase tracking-tighter flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
            <span className="truncate">{tripIds.length} {tripIds.length === 1 ? 'Spot' : 'Spots'}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button 
            onClick={handleShare}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white/5 hover:bg-white hover:text-black transition-all border border-white/5 active:scale-90 group"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          <Link 
            href="/itinerary"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-6 h-10 md:h-12 flex items-center rounded-xl md:rounded-2xl font-[1000] text-[9px] md:text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap border-b-4 border-blue-800 hover:border-blue-700"
          >
            View Route →
          </Link>
        </div>
      </div>
    </div>
  );
}