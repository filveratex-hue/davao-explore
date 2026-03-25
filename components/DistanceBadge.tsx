'use client'; // This tells Next.js this code runs in the browser!
import ReviewsSection from '../../../components/ReviewsSection';
import { useState, useEffect } from 'react';

// The "Haversine" formula: A standard math formula to calculate distance between two coordinates on a sphere (Earth)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function DistanceBadge({ placeLat, placeLng }: { placeLat: number | null, placeLng: number | null }) {
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('📍 Locating...');

  useEffect(() => {
    // If the place doesn't have coordinates in the database, stop here.
    if (!placeLat || !placeLng) {
      setStatus('');
      return;
    }

    // Ask the browser for the user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const calculatedDist = calculateDistance(userLat, userLng, placeLat, placeLng);
          
          setDistance(calculatedDist);
          setStatus(''); // Clear the locating text
        },
        (error) => {
          console.error("Location error:", error);
          setStatus('📍 Location access denied');
        }
      );
    } else {
      setStatus('📍 Geolocation not supported');
    }
  }, [placeLat, placeLng]);

  if (status) return <span className="text-xs text-gray-400 mt-2 block">{status}</span>;
  if (distance === null) return null;

  return (
    <div className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-100">
      📍 {distance.toFixed(1)} km away from you
    </div>
  );
}