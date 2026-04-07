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
    html: `
      <div class="custom-pin-container">
        <div class="custom-pin">
          <span>${emoji}</span>
        </div>
      </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -54]
  });
};

// --- 🔍 CUSTOM ZOOM CONTROLS ---
function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-4 z-[1000] flex flex-col gap-2">
      <button 
        onClick={() => map.zoomIn()}
        className="w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-lg flex items-center justify-center text-lg md:text-xl font-bold hover:bg-white active:scale-90 transition-all text-gray-900 border border-white/50"
        title="Zoom In"
      >
        +
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-lg flex items-center justify-center text-lg md:text-xl font-bold hover:bg-white active:scale-90 transition-all text-gray-900 border border-white/50"
        title="Zoom Out"
      >
        −
      </button>
    </div>
  );
}

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
          // Push the marker down in the frame so the popup is fully visible above it
          const latOffset = window.innerWidth < 768 ? 0.008 : 0.005;
          map.flyTo([(place.latitude || 0) + latOffset, place.longitude || 0], 14, {
            animate: true,
            duration: 1.2
          });
        },
      }}
    >
      <Popup className="custom-popup" closeButton={false}>
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden w-[220px] md:w-64 border-[3px] md:border-4 border-white transform transition-all hover:scale-105">
          <div className="h-16 md:h-24 w-full bg-gray-100 relative">
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
          <div className="p-2 md:p-4 flex flex-col items-center text-center bg-white">
            <h3 className="font-black text-sm md:text-lg uppercase italic text-gray-900 leading-tight mb-0.5 truncate w-full">{place.name}</h3>
            <p className="text-[8px] md:text-[10px] text-gray-500 font-bold mb-2 md:mb-4 line-clamp-1">{place.description}</p>
            
            <Link 
              href={`/place/${place.id}`}
              className="w-full bg-blue-600 text-white text-[9px] md:text-[10px] font-black px-4 py-2.5 md:py-3 rounded-xl uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] text-center block mb-1.5"
            >
              Explore Spot →
            </Link>

            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white text-gray-900 text-[9px] md:text-[10px] font-black px-4 py-2.5 md:py-3 rounded-xl uppercase tracking-widest border-2 border-gray-100 hover:bg-gray-50 active:scale-95 transition-all shadow-sm text-center block"
            >
              Navigate 🚗
            </a>
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
        zoomControl={false}
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
        <ZoomControls />
      </MapContainer>
      
      {/* Floating Info Badge — visible on all screens now */}
      <div className="absolute top-2.5 left-2.5 md:top-6 md:left-6 z-[1000]">
        <div className="bg-black/90 backdrop-blur-xl px-2.5 md:px-5 py-1 md:py-3.5 rounded-lg md:rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2 md:gap-3">
          <div className="relative">
            <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <div className="absolute inset-0 w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
          </div>
          <div className="flex flex-col">
            <p className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-white leading-tight">
              Davao Satellite
            </p>
            <p className="text-[6px] md:text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
              Live • {places.length} Spots
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}