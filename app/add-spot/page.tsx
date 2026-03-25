'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import dynamic from 'next/dynamic';

// We dynamically import the map so Next.js doesn't crash during Server-Side Rendering
const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">Loading map...</div>
});

export default function AddSpotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roadCondition, setRoadCondition] = useState('Sedan-friendly');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login'); 
      } else {
        setUserId(session.user.id);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) {
      alert("Please drop a pin on the map!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('places').insert([
      {
        name,
        description,
        road_condition: roadCondition,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        submitted_by: userId,
        status: 'pending'
      }
    ]);

    setLoading(false);

    if (error) {
      console.error('Error adding place:', error);
      alert('Failed to add spot.');
    } else {
      alert('Spot added successfully! It is pending approval.');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto w-full p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 mb-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add a New Spot</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Secret View Deck"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What makes this place special?"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Road Condition</label>
          <select
            value={roadCondition}
            onChange={(e) => setRoadCondition(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option>Sedan-friendly</option>
            <option>Steep Incline</option>
            <option>4x4 Recommended</option>
            <option>Motorcycle Only</option>
          </select>
        </div>

        {/* The New Map Section! */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pinpoint the Location</label>
          <p className="text-xs text-gray-500 mb-2">Click anywhere on the map to drop a pin.</p>
          <LocationPicker 
            onLocationSelect={(latitude, longitude) => {
              setLat(latitude);
              setLng(longitude);
            }} 
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          {loading ? 'Submitting...' : 'Submit Spot for Approval'}
        </button>
      </form>
    </div>
  );
}