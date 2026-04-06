'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Place } from '../types';

// Fix for default Leaflet icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const createNumberedIcon = (number: number) => {
  return L.divIcon({
    html: `<div class="bg-black text-white w-8 h-8 rounded-2xl flex items-center justify-center font-black border-2 border-white shadow-xl text-xs italic">${number}</div>`,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function ItineraryMap({ spots }: { spots: Place[] }) {
  if (spots.length === 0) return null;

  // Center on the first spot
  const center: [number, number] = [spots[0].latitude || 0, spots[0].longitude || 0];
  
  // Extract coordinates for the connecting polyline
  const polylinePoints: [number, number][] = spots.map(s => [s.latitude || 0, s.longitude || 0]);

  return (
    <div className="w-full h-[400px] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl mb-10 relative z-0">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap'
        />
        
        {/* The visual path connecting the spots */}
        <Polyline positions={polylinePoints} color="#3b82f6" weight={4} dashArray="10, 10" opacity={0.8} />

        {spots.map((spot, index) => (
          <Marker 
            key={spot.id} 
            position={[spot.latitude || 0, spot.longitude || 0]} 
            icon={createNumberedIcon(index + 1)}
          >
            <Popup>
              <p className="font-black uppercase italic text-[10px] m-0">{spot.name}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}