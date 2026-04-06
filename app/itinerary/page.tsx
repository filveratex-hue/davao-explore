'use client';

import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../utils/supabase';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Place } from '../../types';

const ItineraryMap = dynamic(() => import('../../components/ItineraryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] w-full bg-white rounded-2xl md:rounded-[3rem] mb-8 md:mb-10 animate-pulse flex items-center justify-center border border-gray-100 shadow-inner">
       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Plotting your path...</p>
    </div>
  )
});

export default function ItineraryPage() {
  const { tripIds, clearTrip, removeFromTrip } = useTrip();
  const { showToast } = useToast();
  const [spots, setSpots] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTripSpots = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('places').select('*').in('id', tripIds);
    
    const sorted = data?.sort((a, b) => {
       const distA = Math.sqrt(Math.pow((a.latitude || 0) - 7.07, 2) + Math.pow((a.longitude || 0) - 125.61, 2));
       const distB = Math.sqrt(Math.pow((b.latitude || 0) - 7.07, 2) + Math.pow((b.longitude || 0) - 125.61, 2));
       return distA - distB;
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpots(sorted || []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, [tripIds]);

  useEffect(() => {
    if (tripIds.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTripSpots();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpots([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [tripIds, fetchTripSpots]);

  const handleShare = () => {
    if (spots.length === 0) return;
    const header = `🚀 *MY DAVAO UPLAND ROUTE* \n\n`;
    const body = spots.map((s, i) => `${i + 1}. ${s.name} (${s.category})`).join('\n');
    const footer = `\n\nPlan yours at: ${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({ title: 'My Davao Route', text: header + body + footer });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(header + body + footer);
      showToast("Route copied! Ready to paste.", "success");
    }
  };

  const openInGoogleMaps = () => {
    if (spots.length === 0) return;
    const origin = "My+Location";
    const lastSpot = spots[spots.length - 1];
    const destination = `${lastSpot.latitude},${lastSpot.longitude}`;
    const waypointsArray = spots.slice(0, -1);
    const waypointsParam = waypointsArray.length > 0 
      ? `&waypoints=${waypointsArray.map(s => `${s.latitude},${s.longitude}`).join('|')}` 
      : '';
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center font-[1000] uppercase italic animate-pulse text-gray-200 text-xl md:text-2xl tracking-tighter">
        Mapping your adventure...
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-8 md:pb-32">
      <div className="max-w-2xl mx-auto p-4 md:p-6 pt-24 md:pt-28">
        
        {/* --- HEADER --- */}
        <header className="mb-8 md:mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-5xl font-[1000] italic uppercase tracking-tighter text-gray-900 leading-[0.85]">
              Your <span className="text-blue-600">Route</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] mt-3 md:mt-4">Optimized for Discovery</p>
          </div>
          
          {spots.length > 0 && (
            <button 
              onClick={handleShare}
              className="p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl hover:bg-black hover:text-white transition-all active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
        </header>

        {spots.length > 0 ? (
          <>
            {/* Map Container */}
            <div className="rounded-2xl md:rounded-[3rem] overflow-hidden shadow-xl md:shadow-2xl shadow-blue-900/10 border-4 md:border-8 border-white mb-6 md:mb-10 relative z-0">
              <ItineraryMap spots={spots} />
            </div>
            
            {/* 🚗 START NAVIGATION CTA */}
            <button 
              onClick={openInGoogleMaps}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-[1000] text-xs md:text-sm py-5 md:py-6 rounded-2xl md:rounded-[2rem] uppercase tracking-widest transition-all shadow-xl active:scale-95 mb-10 md:mb-16 flex items-center justify-center gap-3 md:gap-4 border-b-6 md:border-b-8 border-blue-800 min-h-[56px]"
            >
              <span className="text-lg md:text-xl">🚀</span> 
              <span className="hidden md:inline">Start Navigation (from Current Location)</span>
              <span className="md:hidden">Start Navigation</span>
            </button>

            {/* --- THE TIMELINE --- */}
            <div className="space-y-5 md:space-y-8 relative">
              {/* Vertical dotted line */}
              <div className="absolute left-6 md:left-7 top-8 md:top-10 bottom-8 md:bottom-10 w-px border-l-2 border-dashed border-gray-200 -z-10" />

              {spots.map((spot, index) => (
                <div key={spot.id} className="flex gap-4 md:gap-8 items-center group">
                  {/* Stop Number Icon */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-black text-white flex items-center justify-center font-[1000] italic shadow-xl shrink-0 z-10 transition-transform group-hover:scale-110 text-sm md:text-base">
                    {index + 1}
                  </div>
                  
                  {/* Spot Card */}
                  <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-gray-100 flex-1 shadow-sm group-hover:shadow-lg transition-all relative flex justify-between items-center pr-10 md:pr-12 min-h-[64px]">
                    <div className="min-w-0">
                      <h3 className="font-[1000] uppercase italic text-gray-900 tracking-tighter text-base md:text-lg leading-none truncate">{spot.name}</h3>
                      <span className="text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1.5 md:mt-2 block">{spot.category}</span>
                    </div>
                    
                    <button 
                      onClick={() => removeFromTrip(spot.id)}
                      className="absolute right-3 md:right-6 text-gray-200 hover:text-red-500 transition-colors p-2 active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* ACTION FOOTER */}
              <div className="pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-4">
                <button 
                  onClick={() => { if(confirm("Clear your entire route?")) clearTrip(); }} 
                  className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em] hover:opacity-70 transition-opacity order-2 md:order-1"
                >
                  Reset Route Plan
                </button>
                <Link 
                  href="/" 
                  className="bg-gray-900 text-white font-black text-[10px] px-6 md:px-8 py-4 rounded-xl md:rounded-2xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg w-full md:w-auto text-center active:scale-95 order-1 md:order-2"
                >
                  + Add More Spots
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-16 md:py-24 bg-gray-50 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="text-4xl mb-4 opacity-30">🗺️</div>
            <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.4em] mb-6 md:mb-8">Your adventure list is empty</p>
            <Link 
              href="/" 
              className="bg-black text-white font-black text-[10px] px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all inline-block italic"
            >
              Start Discovering →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}