'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import DistanceBadge from './DistanceBadge';
import { useTrip } from '../context/TripContext';
import { Place } from '../types';

export default function PlaceFeed({ initialPlaces }: { initialPlaces: Place[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [placesList, setPlacesList] = useState<Place[]>(initialPlaces);
  const { addToTrip, isInTrip, removeFromTrip } = useTrip();

  const categories = ['All', 'Cafe', 'Camping', 'Viewpoint', 'Restaurant', 'Resort', '24 Hours', 'Sedan-friendly'];

  // OFFLINE CACHE LOGIC
  useEffect(() => {
    if (initialPlaces && initialPlaces.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlacesList(initialPlaces);
      try {
        localStorage.setItem('catigan_offline_feed', JSON.stringify(initialPlaces));
      } catch (e) {
        console.warn("Storage quota exceeded");
      }
    } else {
      const cached = localStorage.getItem('catigan_offline_feed');
      if (cached) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlacesList(JSON.parse(cached));
      }
    }
  }, [initialPlaces]);

  // 🔍 SMART FILTERING LOGIC
  const filteredPlaces = useMemo(() => {
    return placesList.filter((place) => {
      const matchesSearch = 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === '24 Hours') {
        matchesFilter = place.is_24_hours === true;
      } else if (activeFilter === 'Sedan-friendly') {
        matchesFilter = place.road_condition?.includes('Sedan') ?? false; 
      } else if (activeFilter !== 'All') {
        matchesFilter = place.category === activeFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, placesList]);

  return (
    <div className="w-full space-y-8 md:space-y-12">
      
      {/* 1. COMMAND BAR (Search & Categories sticky) */}
      <div className="sticky top-16 md:top-20 z-30 bg-white/85 backdrop-blur-3xl py-4 md:py-6 -mx-2 md:-mx-4 px-3 md:px-4 rounded-2xl md:rounded-[2.5rem] mt-4 md:mt-6 border-b border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-5">
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cafes, viewpoints..."
              className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-3.5 md:py-4 bg-gray-50 border border-gray-200 rounded-xl md:rounded-[1.5rem] shadow-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-gray-900 placeholder:text-gray-400 text-base"
            />
          </div>

          {/* Action Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-2 justify-start md:justify-center snap-x snap-mandatory">
            {categories.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative shrink-0 snap-center px-4 md:px-5 py-2.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-black text-white shadow-md scale-105'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. THE DISCOVERY FEED */}
      {filteredPlaces.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-20 md:py-32 text-center bg-white rounded-2xl md:rounded-[3rem] border border-gray-100 shadow-sm"
        >
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No spots matched your filters.</p>
        </motion.div>
      ) : (
        <>
          {/* MOBILE: Horizontal swipeable cards */}
          <div className="md:hidden">
            <div className="snap-scroll-x flex gap-4 px-1 -mx-1">
              {filteredPlaces.map((place) => {
                const approvedImages = place.place_images?.filter((img) => img.status === 'approved') || [];
                const coverImage = place.cover_image_url || (approvedImages.length > 0 ? approvedImages[0].image_url : null);
                
                const ratings = place.reviews || [];
                const avgRating = ratings.length > 0 
                  ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
                  : "5.0";

                const selected = isInTrip(place.id);

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    key={place.id}
                    className="shrink-0 w-[82vw] snap-start group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col"
                  >
                    <Link href={`/place/${place.id}`} className="absolute inset-0 z-0" />

                    {/* IMAGE */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 z-10 pointer-events-none">
                      {coverImage ? (
                        <Image 
                          src={coverImage} 
                          className="object-cover" 
                          alt={place.name}
                          fill
                          sizes="82vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 grayscale">🏔️</div>
                      )}
                      
                      {/* Category + Rating overlay */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                          {place.category || 'Spot'}
                        </span>
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black">
                          ★ {avgRating}
                        </div>
                      </div>
                    </div>

                    {/* ADD TO TRIP BUTTON */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        if (selected) {
                          removeFromTrip(place.id);
                        } else {
                          addToTrip(place);
                        }
                      }}
                      className={`absolute top-[55%] right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-[3px] border-white active:scale-90 ${
                        selected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-900'
                      }`}
                    >
                      {selected ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <span className="text-xl font-bold">+</span>
                      )}
                    </button>

                    {/* CONTENT */}
                    <div className="p-4 flex flex-col flex-grow z-10 pointer-events-none bg-white">
                      <h3 className="text-lg font-[900] uppercase tracking-tight text-gray-900 leading-[1.1] mb-1.5">
                        {place.name}
                      </h3>
                      
                      <p className="text-gray-500 text-xs font-semibold leading-relaxed mb-4 line-clamp-2">
                        {place.description}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 border-t border-gray-50">
                        <DistanceBadge placeLat={place.latitude ?? null} placeLng={place.longitude ?? null} />
                        
                        {place.road_condition && (
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            place.road_condition.includes('Rough') 
                            ? 'bg-orange-50 text-orange-700' 
                            : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            🚜 {place.road_condition.split(' ')[0]}
                          </div>
                        )}
                        
                        <div className="ml-auto text-gray-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Swipe indicator */}
            <div className="flex justify-center mt-3 gap-1">
              {filteredPlaces.slice(0, Math.min(filteredPlaces.length, 5)).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              ))}
              {filteredPlaces.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
            </div>
          </div>

          {/* DESKTOP: Grid layout (unchanged behavior) */}
          <motion.div layout className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            <AnimatePresence>
              {filteredPlaces.map((place) => {
                const approvedImages = place.place_images?.filter((img) => img.status === 'approved') || [];
                const coverImage = place.cover_image_url || (approvedImages.length > 0 ? approvedImages[0].image_url : null);
                
                const ratings = place.reviews || [];
                const avgRating = ratings.length > 0 
                  ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
                  : "5.0";

                const selected = isInTrip(place.id);

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                    key={place.id} 
                    className="group relative bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                  >
                    <Link href={`/place/${place.id}`} className="absolute inset-0 z-0" />

                    {/* IMAGE SECTION */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 z-10 pointer-events-none border-b border-gray-100">
                      {coverImage ? (
                        <Image 
                          src={coverImage} 
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                          alt={place.name}
                          fill
                          sizes="(max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 grayscale">🏔️</div>
                      )}
                      
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                          {place.category || 'Spot'}
                        </span>
                      </div>
                    </div>

                    {/* PLUS BUTTON */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        if (selected) {
                          removeFromTrip(place.id);
                        } else {
                          addToTrip(place);
                        }
                      }}
                      className={`absolute top-[40%] right-6 w-12 h-12 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all z-20 border-[3px] border-white active:scale-90 ${
                        selected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-900 hover:bg-black hover:text-white'
                      }`}
                    >
                      {selected ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <span className="text-xl font-bold">+</span>
                      )}
                    </button>

                    {/* CONTENT SECTION */}
                    <div className="p-6 md:p-8 flex flex-col flex-grow z-10 pointer-events-none bg-white">
                      <div className="flex justify-between items-start mb-3 gap-4">
                        <h3 className="text-2xl font-[900] uppercase tracking-tight text-gray-900 leading-[1.1] transition-colors group-hover:text-blue-600">
                          {place.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0">
                          ★ {avgRating}
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-xs font-semibold leading-relaxed mb-6 line-clamp-2">
                        {place.description}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 border-t border-gray-50">
                        <DistanceBadge placeLat={place.latitude ?? null} placeLng={place.longitude ?? null} />
                        
                        {place.road_condition && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            place.road_condition.includes('Rough') 
                            ? 'bg-orange-50 text-orange-700' 
                            : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            🚜 {place.road_condition.split(' ')[0]}
                          </div>
                        )}
                        
                        <div className="ml-auto text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </div>
  );
}