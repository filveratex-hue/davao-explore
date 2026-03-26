'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Next.js messes up the default Leaflet map pins, so we pull them directly from the web
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// A small helper component to listen for clicks on the map
function MapClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LocationPicker({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: string, lng: string) => void 
}) {
  // We center the map roughly over Davao/Catigan to start
  const defaultCenter: [number, number] = [7.0215, 125.4852];
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (position) {
      onLocationSelect(position[0].toString(), position[1].toString());
    }
  }, [position, onLocationSelect]);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-200 relative z-0">
        <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler setPosition={setPosition} />
          {position && <Marker position={position} icon={customIcon} />}
        </MapContainer>
      </div>
      {position && (
        <p className="text-xs text-emerald-600 font-medium text-right">
          📍 Pin dropped at: {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </p>
      )}
    </div>
  );
}