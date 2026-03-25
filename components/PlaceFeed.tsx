'use client';
import { useState } from 'react';
import Link from 'next/link';
import DistanceBadge from './DistanceBadge';

export default function PlaceFeed({ initialPlaces }: { initialPlaces: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter the places based on the search bar AND the selected filter button
  const filteredPlaces = initialPlaces.filter((place) => {
    // 1. Does it match the search text?
    const matchesSearch = 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Does it match the active filter button?
    let matchesFilter = true;
    if (activeFilter === '24 Hours') {
      matchesFilter = place.is_24_hours === true;
    } else if (activeFilter === 'Sedan-friendly') {
      // Assuming 'Sedan-friendly' is part of the string in your database
      matchesFilter = place.road_condition?.includes('Sedan'); 
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto pb-10">
      
      {/* --- SEARCH BAR --- */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search cafes, views, spots..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow shadow-sm"
        />
        <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
      </div>

      {/* --- QUICK FILTERS --- */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mt-2">
        {['All', '24 Hours', 'Sedan-friendly'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors shadow-sm ${
              activeFilter === filter
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* --- THE FEED --- */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
          No spots found matching your search.
        </div>
      ) : (
        filteredPlaces.map((place) => {
          const approvedImages = place.place_images?.filter((img: any) => img.status === 'approved') || [];
          const coverImage = approvedImages.length > 0 ? approvedImages[0].image_url : null;

          return (
            <Link href={`/place/${place.id}`} key={place.id} className="block transition-transform hover:-translate-y-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                
                <div 
                  className={`h-48 w-full relative bg-cover bg-center ${!coverImage ? 'bg-gray-200' : ''}`}
                  style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
                >
                  {coverImage && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>}

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm z-10">
                    {place.is_24_hours 
                      ? 'Open 24/7' 
                      : `⏰ ${place.open_time?.slice(0,5) || '?'} - ${place.close_time?.slice(0,5) || '?'}`}
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{place.name}</h2>
                  <p className="text-gray-500 mt-1 text-sm leading-relaxed line-clamp-2">{place.description}</p>
                  
                  <div className="mt-3">
                    <DistanceBadge placeLat={place.latitude} placeLng={place.longitude} />
                  </div>
                  
                  {place.road_condition && (
                    <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold px-3 py-2 rounded-lg">
                      <span>🚗</span>
                      {place.road_condition}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}