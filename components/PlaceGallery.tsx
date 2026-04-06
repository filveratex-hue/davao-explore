import Image from 'next/image';

export default function PlaceGallery({ galleryImages }: { galleryImages: { image_url: string }[] }) {
  return (
    <div className="mb-12">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Community Photos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {galleryImages.map((img, index) => (
          <div key={index} className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm group">
            <Image 
              src={img.image_url} 
              alt={`Community Photo ${index}`} 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
