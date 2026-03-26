'use client';

import dynamic from 'next/dynamic';

// This is where we safely do the ssr: false
const MainMap = dynamic(() => import('./MainMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-100 rounded-[2.5rem] mb-12 flex items-center justify-center border-2 border-dashed border-gray-200">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
        Initializing Davao Satellite...
      </p>
    </div>
  )
});

export default function MapWrapper({ places }: { places: any[] }) {
  return <MainMap places={places} />;
}