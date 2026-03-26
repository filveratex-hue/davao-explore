'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';

// --- 🧭 NAVIGATION CONTROLLER ---
function RoutingMachine({ waypoints, userPos, isFollowing }: any) {
  const map = useMap();

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 1 || !userPos) return;

    // 🚀 We use @ts-ignore here to force Vercel to ignore the 'Routing' type error
    // @ts-ignore
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userPos[0], userPos[1]), 
        ...waypoints.map((w: any) => L.latLng(w.latitude, w.longitude))
      ],
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }],
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

export default function LiveNavigator({ spots }: { spots: any[] }) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("GPS Error:", err),
      { 
        enableHighAccuracy: true, 
        timeout: 10000, // Increased timeout slightly for mountain signals
        maximumAge: 0 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!userPos) {
    return (
      <div className="h-[500px] w-full bg-gray-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full animate-ping mx-auto mb-6 opacity-20"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Locking GPS Signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl z-0">
      <MapContainer center={userPos} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* User Pulse Marker */}
        <Marker 
          position={userPos} 
          icon={L.divIcon({ 
            html: '<div class="relative flex items-center justify-center"><div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div><div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div></div>', 
            className: '' 
          })} 
        />

        <RoutingMachine waypoints={spots} userPos={userPos} isFollowing={isFollowing} />
      </MapContainer>

      {/* Control Overlay */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-6 py-3 rounded-2xl font-[1000] text-[9px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${
            isFollowing 
              ? 'bg-blue-600 text-white border-b-4 border-blue-800' 
              : 'bg-white text-gray-900 border-b-4 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isFollowing ? '● Auto-Following' : '🛰️ Manual View'}
        </button>
      </div>
    </div>
  );
}