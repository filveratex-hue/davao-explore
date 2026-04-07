'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useState } from 'react';
import { Place } from '../types';
import Image from 'next/image';

// --- CATEGORY ICON MAPPING ---

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- CATEGORY ICON MAPPING ---
const getCategoryIcon = (category?: string) => {
  const emojiMap: Record<string, string> = {
    'Cafe': '☕',
    'Viewpoint': '🔭',
    'Camping': '⛺',
    'Resort': '🏖️',
    'Restaurant': '🍴',
    'Trail': '🥾'
  };

  const emoji = category && emojiMap[category] ? emojiMap[category] : '📍';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-pin shadow-xl"><span>${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// --- 🧭 LOCATION BUTTON COMPONENT ---
function FindMeButton({ setUserPos }: { setUserPos: (pos: [number, number]) => void }) {
  const map = useMap();

  const handleClick = () => {
    map.locate().on("locationfound", function (e) {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserPos(coords);
      map.flyTo(e.latlng, 14, { animate: true, duration: 1.5 });
    });
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="absolute bottom-28 left-4 md:bottom-8 md:right-8 md:left-auto z-[1000] bg-black text-white p-3.5 md:p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20 group"
      title="Find my location"
    >
      <span className="group-hover:animate-ping absolute inset-0 rounded-2xl bg-white/20 pointer-events-none" />
      <span className="relative text-lg">📍</span>
    </button>
  );
}

// --- 🚀 AUTO-ZOOM LOGIC ---
function MarkerLogic({ place }: { place: Place }) {
  const map = useMap();

  return (
    <Marker 
      position={[place.latitude || 0, place.longitude || 0]} 
      icon={getCategoryIcon(place.category)}
      eventHandlers={{
        click: () => {
          map.flyTo([(place.latitude || 0) + 0.005, place.longitude || 0], 14, {
            animate: true,
            duration: 1.2
          });
        },
      }}
    >
      <Popup className="custom-popup" closeButton={false}>
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden w-56 md:w-64 border-4 border-white transform transition-all hover:scale-105">
          <div className="h-20 md:h-24 w-full bg-gray-100 relative">
            {place.cover_image_url ? (
              <Image src={place.cover_image_url} alt={place.name} className="object-cover" fill sizes="256px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">⛰️</div>
            )}
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
              {place.category}
            </div>
          </div>
          
          {/* Info Section */}
          <div className="p-3 md:p-4 flex flex-col items-center text-center bg-white">
            <h3 className="font-black text-base md:text-lg uppercase italic text-gray-900 leading-tight mb-1 truncate w-full">{place.name}</h3>
            <p className="text-[9px] md:text-[10px] text-gray-500 font-bold mb-3 md:mb-4 line-clamp-1">{place.description}</p>
            
            <Link 
              href={`/place/${place.id}`}
              className="w-full bg-blue-600 text-white text-[10px] font-black px-4 py-3 rounded-xl uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all shadow-md text-center block"
            >
              Explore Spot →
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MainMap({ places }: { places: Place[] }) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const davaoCenter: [number, number] = [7.0707, 125.6128];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={davaoCenter} 
        zoom={11} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos && (
          <Marker position={userPos} icon={userIcon}>
             <Popup className="custom-popup" closeButton={false}>
              <div className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-gray-800">
                You are here
              </div>
            </Popup>
          </Marker>
        )}

        {/* --- MAP SPOTS --- */}
        {places.map((place) => (
          <MarkerLogic key={place.id} place={place} />
        ))}

        <FindMeButton setUserPos={setUserPos} />
      </MapContainer>
      
      {/* Floating Info Badge — visible on all screens now */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] bg-white/90 backdrop-blur-md px-4 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl shadow-xl border border-gray-100">
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2 md:gap-3">
          <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          {places.length} Active Spots
        </p>
      </div>
    </div>
  );
}