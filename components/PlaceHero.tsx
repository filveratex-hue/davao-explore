import Link from 'next/link';
import Image from 'next/image';

export default function PlaceHero({ heroImage, placeName }: { heroImage: string | null; placeName: string }) {
  return (
    <>
      {/* 📸 HERO IMAGE (Fixed Background) — Shorter on mobile */}
      <div className="fixed top-0 left-0 w-full h-[40vh] md:h-[55vh] z-0">
        {heroImage ? (
          <Image 
            src={heroImage} 
            alt={placeName} 
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />
      </div>

      {/* 🛡️ FLOATING TOP NAV */}
      <div 
        className="fixed top-0 left-0 w-full px-4 md:px-6 z-50 flex justify-between items-center max-w-2xl mx-auto right-0"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link href="/" className="w-11 h-11 md:w-12 md:h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 shadow-lg active:scale-90 transition-transform">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>
    </>
  );
}
