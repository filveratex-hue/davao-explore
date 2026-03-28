export default function PlaceFeedSkeleton() {
  return (
    <div className="w-full space-y-12 animate-pulse">
      
      {/* Ghost Command Bar */}
      <div className="sticky top-20 z-30 bg-white/50 py-6 -mx-4 px-4 rounded-[2.5rem]">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-full h-16 bg-gray-100 rounded-[2rem]"></div>
          <div className="flex gap-2 overflow-x-hidden justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-24 h-10 bg-gray-100 rounded-2xl shrink-0"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Ghost Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm flex flex-col h-full"
          >
            {/* Image Placeholder */}
            <div className="relative aspect-[4/3] bg-gray-100"></div>

            {/* Content Placeholder */}
            <div className="p-8 flex flex-col flex-grow">
              {/* Title & Rating */}
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="w-3/4 h-8 bg-gray-100 rounded-lg"></div>
                <div className="w-12 h-6 bg-amber-50 rounded-xl"></div>
              </div>
              
              {/* Description Lines */}
              <div className="space-y-2 mb-8">
                <div className="w-full h-3 bg-gray-50 rounded-full"></div>
                <div className="w-5/6 h-3 bg-gray-50 rounded-full"></div>
              </div>

              {/* Badges Footer */}
              <div className="mt-auto flex gap-2 pt-6 border-t border-gray-50">
                <div className="w-20 h-8 bg-emerald-50 rounded-2xl"></div>
                <div className="w-24 h-8 bg-orange-50 rounded-2xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}