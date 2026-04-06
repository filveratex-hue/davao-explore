export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-900 overflow-hidden relative">
      {/* Skeleton Hero Image Layer */}
      <div className="absolute inset-0 z-0 bg-gray-800 animate-pulse" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

      {/* Floating Header Skeleton */}
      <div className="fixed top-8 left-6 z-20">
        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl animate-pulse" />
      </div>

      <div className="fixed top-8 right-6 z-20">
        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl animate-pulse" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="relative z-20 mt-[45vh] bg-white rounded-t-[3rem] min-h-[60vh] pb-40 px-6 md:px-8 shadow-2xl">
        <div className="max-w-2xl mx-auto pt-8">
          
          {/* Dragger */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-10" />

          {/* Title Area */}
          <div className="space-y-4 mb-8">
            <div className="h-3 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-12 w-3/4 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-12 w-1/2 bg-gray-200 rounded-2xl animate-pulse" />
          </div>

          {/* Grid Attributes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>

          {/* Description Block */}
          <div className="space-y-3 mb-10">
            <div className="h-3 w-32 bg-gray-200 rounded-full animate-pulse mb-6" />
            <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-100 rounded-full animate-pulse" />
          </div>

        </div>
      </div>
    </main>
  );
}
