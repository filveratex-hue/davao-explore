'use client';

import { useTrip } from '../context/TripContext';
import Link from 'next/link';

export default function TripBottomBar({ placeId }: { placeId: number }) {
  const { tripIds, addToTrip, removeFromTrip } = useTrip();
  const isAdded = tripIds.includes(placeId);

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-3xl border-t border-white/50 pb-8 pt-4 px-4 md:px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="max-w-2xl mx-auto flex gap-3 md:gap-4">
        <button 
          onClick={() => isAdded ? removeFromTrip(placeId) : addToTrip(placeId)}
          className={`flex-1 py-4 md:py-5 rounded-[2rem] font-[1000] text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 border-b-4 flex items-center justify-center gap-2 md:gap-3 ${
            isAdded 
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
              : 'bg-black text-white border-gray-800 hover:bg-blue-600 hover:border-blue-800'
          }`}
        >
          {isAdded ? (
            <><span>✕</span> Remove from Route</>
          ) : (
            <><span>+</span> Add to Route</>
          )}
        </button>
        
        {/* Quick Nav Button to jump to the map */}
        <Link href="/itinerary" className="w-16 h-[56px] md:h-[60px] bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
        </Link>
      </div>
    </div>
  );
}