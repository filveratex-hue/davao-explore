'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Place } from '../types';

type TripContextType = {
  trip: Place[]; // 👈 NEW: Stores the full spot objects for sharing
  tripIds: string[];
  addToTrip: (place: Place) => void; // 👈 Accepts the whole object now
  removeFromTrip: (id: string) => void;
  clearTrip: () => void;
  isInTrip: (id: string) => boolean;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [tripData, setTripData] = useState<{ items: Place[], ids: string[] }>({ items: [], ids: [] });
  const { items: trip, ids: tripIds } = tripData;

  // Load trip from local storage so it persists on refresh
  useEffect(() => {
    const saved = localStorage.getItem('catigan_trip_data');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTripData({ items: parsedData, ids: parsedData.map((p: Place) => p.id) });
      } catch (e) {
        console.error("Failed to load trip data:", e);
      }
    }
  }, []);

  // Helper to save to local storage
  const saveToLocal = (data: Place[]) => {
    localStorage.setItem('catigan_trip_data', JSON.stringify(data));
  };

  const addToTrip = (place: Place) => {
    // Safety check: ensure the object has an ID
    if (!place || !place.id) return;

    if (!tripIds.includes(place.id)) {
      const updatedItems = [...trip, place];
      const updatedIds = [...tripIds, place.id];
      setTripData({ items: updatedItems, ids: updatedIds });
      saveToLocal(updatedItems);
    }
  };

  const removeFromTrip = (id: string) => {
    const updatedItems = trip.filter(p => p.id !== id);
    const updatedIds = tripIds.filter(tid => tid !== id);
    setTripData({ items: updatedItems, ids: updatedIds });
    saveToLocal(updatedItems);
  };

  const clearTrip = () => {
    setTripData({ items: [], ids: [] });
    localStorage.removeItem('catigan_trip_data');
  };

  const isInTrip = (id: string) => tripIds.includes(id);

  return (
    <TripContext.Provider value={{ trip, tripIds, addToTrip, removeFromTrip, clearTrip, isInTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip must be used within a TripProvider');
  return context;
};