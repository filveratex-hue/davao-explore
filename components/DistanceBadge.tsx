'use client';

import { useState, useEffect } from 'react';

// Math logic for the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export default function DistanceBadge({ placeLat, placeLng }: { placeLat: number | null, placeLng: number | null }) {
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<'locating' | 'denied' | 'unsupported' | 'ready'>('locating');

  useEffect(() => {
    if (!placeLat || !placeLng) {
      setStatus('unsupported');
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const calculatedDist = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            placeLat,
            placeLng
          );
          setDistance(calculatedDist);
          setStatus('ready');
        },
        (error) => {
          console.error("Location error:", error);
          setStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setStatus('unsupported');
    }
  }, [placeLat, placeLng]);

  // --- RENDERING ---

  // While finding the user
  if (status === 'locating') {
    return (
      <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 animate-pulse">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">📍 Syncing GPS...</span>
      </div>
    );
  }

  // If the user said "No" to location
  if (status === 'denied' || status === 'unsupported') {
    return (
      <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">📍 Distance Hidden</span>
      </div>
    );
  }

  // Success state
  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm transition-all hover:scale-105">
      <span className="text-blue-600">📍</span>
      <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
        {distance !== null ? `${distance.toFixed(1)} KM AWAY` : 'LOCATED'}
      </span>
    </div>
  );
}