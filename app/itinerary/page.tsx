'use client';

import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../utils/supabase';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ItineraryMap = dynamic(() => import('../../components/ItineraryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-white rounded-[3rem] mb-10 animate-pulse flex items-center justify-center border border-gray-100 shadow-inner">
       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Plotting your path...</p>
    </div>
  )
});

export default function ItineraryPage() {
  const { tripIds, trip, clearTrip, removeFromTrip } = useTrip();
  const { showToast } = useToast();
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTripSpots = async () => {
    setLoading(true);
    // Fetch fresh data for the IDs in the trip
    const { data } = await supabase.from('places').select('*').in('id', tripIds);
    
    // Sort logic: Keep the order they were added or by proximity to Davao
    const sorted = data?.sort((a, b) => {
       const distA = Math.sqrt(Math.pow(a.latitude - 7.07, 2) + Math.pow(a.longitude - 125.61, 2));
       const distB = Math.sqrt(Math.pow(b.latitude - 7.07, 2) + Math.pow(b.longitude - 125.61, 2));
       return distA - distB;
    });

    setSpots(sorted || []);
    setLoading(false);
  };

  useEffect(() => {
    if (tripIds.length > 0) fetchTripSpots();
    else { setSpots([]); setLoading(false); }
  }, [tripIds]);

  // 📝 SHARING LOGIC (Since Tray is hidden here)
  const handleShare = () => {
    if (spots.length === 0) return;
    const header = `🚀 *MY DAVAO UPLAND ROUTE* \n\n`;
    const body = spots.map((s, i) => `${i + 1}. ${s.name} (${s.category})`).join('\n');
    const footer = `\n\nPlan yours at: ${window.location.origin}`;
    navigator.clipboard.writeText(header + body + footer);
    showToast("Route copied! Ready to paste.", "success");
  };

  // 🚗 UPDATED NAVIGATION LOGIC: Start from Current Location
  const openInGoogleMaps = () => {
    if (spots.length === 0) return;

    // Origin is set to empty/My+Location to trigger user's GPS
    const origin = "My+Location";
    
    // The last spot is the final destination
    const lastSpot = spots[spots.length - 1];
    const destination = `${lastSpot.latitude},${lastSpot.longitude}`;
    
    // All spots before the last one are waypoints
    const waypointsArray = spots.slice(0, -1);
    const waypointsParam = waypointsArray.length > 0 
      ? `&waypoints=${waypointsArray.map(s => `${s.latitude},${s.longitude}`).join('|')}` 
      : '';
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center font-[1000] uppercase italic animate-pulse text-gray-200 text-2xl tracking-tighter">
        Mapping your adventure...
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-32">
      <div className="max-w-2xl mx-auto p-6 pt-16">
        
        {/* --- HEADER --- */}
        <header className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-[1000] italic uppercase tracking-tighter text-gray-900 leading-[0.85]">
              Your <span className="text-blue-600">Route</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4"> Optimized for Discovery</p>
          </div>
          
          {spots.length > 0 && (
            <button 
              onClick={handleShare}
              className="p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-black hover:text-white transition-all active:scale-90"
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
            <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white mb-10 relative z-0">
              <ItineraryMap spots={spots} />
            </div>
            
            {/* 🚗 START NAVIGATION CTA */}
            <button 
              onClick={openInGoogleMaps}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-[1000] text-sm py-6 rounded-[2rem] uppercase tracking-widest transition-all shadow-xl active:scale-95 mb-16 flex items-center justify-center gap-4 border-b-8 border-blue-800"
            >
              <span className="text-xl">🚀</span> 
              Start Navigation (from Current Location)
            </button>

            {/* --- THE TIMELINE --- */}
            <div className="space-y-8 relative">
              {/* Vertical dotted line */}
              <div className="absolute left-7 top-10 bottom-10 w-px border-l-2 border-dashed border-gray-200 -z-10" />

              {spots.map((spot, index) => (
                <div key={spot.id} className="flex gap-8 items-center group">
                  {/* Stop Number Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-[1000] italic shadow-xl shrink-0 z-10 transition-transform group-hover:scale-110">
                    {index + 1}
                  </div>
                  
                  {/* Spot Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex-1 shadow-sm group-hover:shadow-lg transition-all relative flex justify-between items-center pr-12">
                    <div>
                      <h3 className="font-[1000] uppercase italic text-gray-900 tracking-tighter text-lg leading-none">{spot.name}</h3>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-2 block">{spot.category}</span>
                    </div>
                    
                    <button 
                      onClick={() => removeFromTrip(spot.id)}
                      className="absolute right-6 text-gray-200 hover:text-red-500 transition-colors p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* ACTION FOOTER */}
              <div className="pt-12 flex justify-between items-center">
                <button 
                  onClick={() => { if(confirm("Clear your entire route?")) clearTrip(); }} 
                  className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em] hover:opacity-70 transition-opacity"
                >
                  Reset Route Plan
                </button>
                <Link 
                  href="/" 
                  className="bg-gray-900 text-white font-black text-[10px] px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                >
                  + Add More Spots
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.4em] mb-8">Your adventure list is empty</p>
            <Link 
              href="/" 
              className="bg-black text-white font-black text-[10px] px-10 py-5 rounded-2xl uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all inline-block italic"
            >
              Start Discovering →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}