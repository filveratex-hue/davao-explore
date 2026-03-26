'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type TripContextType = {
  trip: any[]; // 👈 NEW: Stores the full spot objects for sharing
  tripIds: string[];
  addToTrip: (place: any) => void; // 👈 Accepts the whole object now
  removeFromTrip: (id: string) => void;
  clearTrip: () => void;
  isInTrip: (id: string) => boolean;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTrip] = useState<any[]>([]);
  const [tripIds, setTripIds] = useState<string[]>([]);

  // Load trip from local storage so it persists on refresh
  useEffect(() => {
    const saved = localStorage.getItem('catigan_trip_data');
    if (saved) {
      const parsedData = JSON.parse(saved);
      setTrip(parsedData);
      setTripIds(parsedData.map((p: any) => p.id));
    }
  }, []);

  // Helper to save to local storage
  const saveToLocal = (data: any[]) => {
    localStorage.setItem('catigan_trip_data', JSON.stringify(data));
  };

  const addToTrip = (place: any) => {
    // Safety check: ensure the object has an ID
    if (!place || !place.id) return;

    if (!tripIds.includes(place.id)) {
      const updatedTrip = [...trip, place];
      setTrip(updatedTrip);
      setTripIds([...tripIds, place.id]);
      saveToLocal(updatedTrip);
    }
  };

  const removeFromTrip = (id: string) => {
    const updatedTrip = trip.filter(p => p.id !== id);
    setTrip(updatedTrip);
    setTripIds(tripIds.filter(tid => tid !== id));
    saveToLocal(updatedTrip);
  };

  const clearTrip = () => {
    setTrip([]);
    setTripIds([]);
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