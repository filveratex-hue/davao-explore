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
    if (!map || waypoints.length < 1 || !userPos) return;

    // Initialize the Routing Control
    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(userPos[0], userPos[1]), // Start at User
        ...waypoints.map((w: any) => L.latLng(w.latitude, w.longitude)) // Then the spots
      ],
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      show: false, // Hide the text instructions to keep UI clean
      addWaypoints: false,
      routeWhileDragging: false,
    }).addTo(map);

    return () => { map.removeControl(routingControl); };
  }, [map, waypoints, userPos]);

  // --- 🎥 THE "FOLLOW ME" LOGIC ---
  useEffect(() => {
    if (isFollowing && userPos) {
      map.flyTo(userPos, 16, { animate: true });
    }
  }, [userPos, isFollowing, map]);

  return null;
}

export default function LiveNavigator({ spots }: { spots: any[] }) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);

  useEffect(() => {
    // 📡 WATCH POSITION: This triggers every time the GPS moves
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!userPos) return <div className="p-20 text-center font-black uppercase italic animate-pulse">Waiting for GPS Signal...</div>;

  return (
    <div className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl">
      <MapContainer center={userPos} zoom={15} style={{ height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* User Marker */}
        <Marker position={userPos} icon={L.divIcon({ html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>', className: '' })} />

        <RoutingMachine waypoints={spots} userPos={userPos} isFollowing={isFollowing} />
      </MapContainer>

      {/* Toggle Following Mode */}
      <button 
        onClick={() => setIsFollowing(!isFollowing)}
        className={`absolute top-6 right-6 z-[1000] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${
          isFollowing ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {isFollowing ? '📍 Auto-Following' : '🛰️ Manual View'}
      </button>
    </div>
  );
}