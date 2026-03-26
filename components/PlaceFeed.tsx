'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DistanceBadge from './DistanceBadge';
import { useTrip } from '../context/TripContext';

export default function PlaceFeed({ initialPlaces }: { initialPlaces: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToTrip, isInTrip, removeFromTrip } = useTrip();

  const categories = ['All', 'Cafe', 'Camping', 'Viewpoint', 'Restaurant', 'Resort', '24 Hours', 'Sedan-friendly'];

  // 🔍 SMART FILTERING LOGIC
  const filteredPlaces = useMemo(() => {
    return initialPlaces.filter((place) => {
      const matchesSearch = 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === '24 Hours') {
        matchesFilter = place.is_24_hours === true;
      } else if (activeFilter === 'Sedan-friendly') {
        matchesFilter = place.road_condition?.includes('Sedan'); 
      } else if (activeFilter !== 'All') {
        matchesFilter = place.category === activeFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, initialPlaces]);

  return (
    <div className="w-full space-y-12">
      
      {/* --- 1. THE COMMAND BAR (Search & Categories) --- */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md py-6 -mx-4 px-4 rounded-[2.5rem]">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Modern Search Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cafes, viewpoints, hidden spots..."
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/30 outline-none focus:border-blue-600 transition-all font-bold text-gray-900 placeholder:text-gray-300"
            />
          </div>

          {/* Action Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2 justify-start md:justify-center">
            {categories.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 px-6 py-2.5 rounded-2xl font-[1000] text-[10px] uppercase tracking-widest transition-all duration-300 border-2 ${
                  activeFilter === filter
                    ? 'bg-black border-black text-white shadow-lg scale-105'
                    : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-gray-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- 2. THE DISCOVERY GRID --- */}
      {filteredPlaces.length === 0 ? (
        <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
          <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-xs italic">No matching spots found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredPlaces.map((place) => {
            const approvedImages = place.place_images?.filter((img: any) => img.status === 'approved') || [];
            const coverImage = place.cover_image_url || (approvedImages.length > 0 ? approvedImages[0].image_url : null);
            
            const ratings = place.reviews || [];
            const avgRating = ratings.length > 0 
              ? (ratings.reduce((acc: any, curr: any) => acc + curr.rating, 0) / ratings.length).toFixed(1)
              : "5.0";

            const selected = isInTrip(place.id);

            return (
              <div 
                key={place.id} 
                className="group relative bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col h-full"
              >
                {/* 🚀 FULL CARD LINK: Wraps the background logic */}
                <Link href={`/place/${place.id}`} className="absolute inset-0 z-0" />

                {/* IMAGE SECTION */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 z-10 pointer-events-none">
                  {coverImage ? (
                    <img 
                      src={coverImage} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={place.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 grayscale">🏔️</div>
                  )}
                  
                  {/* Category Badge Overlay */}
                  <div className="absolute top-6 left-6">
                    <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-[1000] uppercase tracking-widest px-4 py-2 rounded-full border border-white/20">
                      {place.category || 'Spot'}
                    </span>
                  </div>
                </div>

                {/* 📍 THE PLUS BUTTON: stopPropagation ensures it doesn't trigger the Link */}
                <button 
                  onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    // ✅ FIXED: Pass 'place' (object), not 'place.id' (string)
                    selected ? removeFromTrip(place.id) : addToTrip(place); 
                  }}
                  className={`absolute top-[40%] right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 z-20 border-4 border-white ${
                    selected 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-900 hover:bg-black hover:text-white'
                  }`}
                >
                  {selected ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <span className="text-2xl font-light">+</span>
                  )}
                </button>

                {/* CONTENT SECTION */}
                <div className="p-8 flex flex-col flex-grow z-10 pointer-events-none">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-2xl font-[1000] uppercase italic tracking-tighter text-gray-900 leading-[0.9] group-hover:text-blue-600 transition-colors">
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-[10px] font-black border border-amber-100 shrink-0">
                      ★ {avgRating}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-[13px] font-bold leading-relaxed mb-8 line-clamp-2 italic">
                    {place.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-6 border-t border-gray-50">
                    <DistanceBadge placeLat={place.latitude} placeLng={place.longitude} />
                    
                    {place.road_condition && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-[1000] uppercase tracking-widest border ${
                        place.road_condition.includes('Rough') 
                        ? 'bg-orange-50 text-orange-600 border-orange-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        🚜 {place.road_condition.split(' ')[0]}
                      </div>
                    )}
                    
                    <div className="ml-auto text-gray-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}