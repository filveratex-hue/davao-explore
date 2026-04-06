'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Place } from '../types';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';

// --- 🧭 NAVIGATION CONTROLLER ---
function RoutingMachine({ waypoints, userPos, isFollowing }: { waypoints: Place[]; userPos: [number, number]; isFollowing: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 1 || !userPos) return;

    // 🚀 Access Routing via any cast to bypass missing type defs
    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(userPos[0], userPos[1]), 
        ...waypoints.map((w: Place) => L.latLng(w.latitude || 0, w.longitude || 0))
      ],
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 5, opacity: 0.9 }], // Slightly thinner for mobile
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      show: false, 
      addWaypoints: false,
      routeWhileDragging: false,
    }).addTo(map);

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, waypoints, userPos]);

  useEffect(() => {
    if (isFollowing && userPos && map) {
      map.flyTo(userPos, 16, { animate: true });
    }
  }, [userPos, isFollowing, map]);

  return null;
}

export default function LiveNavigator({ spots }: { spots: Place[] }) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("GPS Signal Lost:", err),
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0   
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!userPos) {
    return (
      <div className="h-[50vh] md:h-[600px] w-full bg-gray-50 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center border-4 border-white shadow-inner">
        <div className="text-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full animate-ping mx-auto mb-6 opacity-30"></div>
          <p className="text-[9px] font-[1000] text-gray-400 uppercase tracking-[0.4em] italic">Awaiting Satellite Lock...</p>
        </div>
      </div>
    );
  }

  return (
    // Responsive Height: 55% of screen on mobile, 600px max on desktop
    <div className="relative w-full h-[55vh] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-white shadow-2xl z-0">
      <MapContainer 
        center={userPos} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Hides default zoom buttons to keep UI clean
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <Marker 
          position={userPos} 
          icon={L.divIcon({ 
            html: '<div class="relative flex items-center justify-center"><div class="absolute w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-20"></div><div class="w-5 h-5 bg-blue-600 rounded-full border-[3px] border-white shadow-lg"></div></div>', 
            className: '' 
          })} 
        />

        <RoutingMachine waypoints={spots} userPos={userPos} isFollowing={isFollowing} />
      </MapContainer>

      {/* Gradient Overlay so the button always pops against the map */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/30 to-transparent z-[500] pointer-events-none" />

      {/* Control Overlay: Moved to Bottom Right (Thumb Zone) */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-5 py-3 md:px-6 md:py-3 rounded-2xl font-[1000] text-[9px] md:text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 border-b-4 backdrop-blur-md ${
            isFollowing 
              ? 'bg-blue-600/95 text-white border-blue-800' 
              : 'bg-white/95 text-gray-900 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isFollowing ? '📍 Following Path' : '🛰️ Free Roam'}
        </button>
      </div>
    </div>
  );
}