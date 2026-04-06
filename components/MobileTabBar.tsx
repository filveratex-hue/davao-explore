'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrip } from '../context/TripContext';

const tabs = [
  {
    label: 'Explore',
    href: '/',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d={active 
          ? "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          : "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        }/>
      </svg>
    ),
  },
  {
    label: 'Map',
    href: '/map',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
      </svg>
    ),
  },
  {
    label: 'Add',
    href: '/add-spot',
    isFab: true,
    icon: (_active: boolean) => (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
    ),
  },
  {
    label: 'My Route',
    href: '/itinerary',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { tripIds } = useTrip();

  // Hide on admin pages, login, signup — and place detail pages (which have their own bottom bar)
  const hiddenPaths = ['/admin', '/login', '/signup'];
  const isHidden = hiddenPaths.some(p => pathname?.startsWith(p));
  const isPlaceDetail = pathname?.startsWith('/place/');

  if (isHidden || isPlaceDetail) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[4000] bg-white/95 backdrop-blur-2xl border-t border-gray-100/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname?.startsWith(tab.href);

          // Center FAB (Add Spot)
          if (tab.isFab) {
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="relative -mt-5 flex flex-col items-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-active:scale-90 transition-transform border-2 border-blue-500">
                  {tab.icon(false)}
                </div>
                <span className="text-[9px] font-bold text-blue-600 mt-1 uppercase tracking-wider">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all relative group active:scale-90 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`transition-transform ${isActive ? 'animate-tab-pop' : ''}`}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[9px] mt-0.5 uppercase tracking-wider transition-colors ${
                isActive ? 'font-extrabold text-blue-600' : 'font-semibold text-gray-400'
              }`}>
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 bg-blue-600 rounded-full" />
              )}
              {/* Trip count badge on My Route tab */}
              {tab.label === 'My Route' && tripIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {tripIds.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
