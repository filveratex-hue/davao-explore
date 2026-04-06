'use client';

import dynamic from 'next/dynamic';
import { Place } from '../types';

// This is where we safely do the ssr: false
const MainMap = dynamic(() => import('./MainMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[40vh] bg-gray-100 flex items-center justify-center">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
        Initializing Davao Satellite...
      </p>
    </div>
  )
});

export default function MapWrapper({ places }: { places: Place[] }) {
  return <MainMap places={places} />;
}