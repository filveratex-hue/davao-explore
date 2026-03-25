import { supabase } from '../utils/supabase';
import PlaceFeed from '../components/PlaceFeed';

export default async function Home() {
  // Fetch the data on the server
  // Note: 'cover_image_url' is automatically included in '*'
  const { data: places, error } = await supabase
    .from('places')
    .select(`
      *,
      place_images (
        image_url,
        status
      )
    `)
    .eq('status', 'approved'); 

  if (error) {
    console.error('Error fetching places:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-red-500 font-bold">
        Failed to load places. Please check your connection.
      </div>
    );
  }

  // We send the places to the PlaceFeed. 
  // The PlaceFeed (or SpotCard) will now use spot.cover_image_url 
  // as the primary image.
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Explore Catigan</h1>
          <p className="text-gray-500 mt-2 font-medium">Discover the best hidden gems in the city.</p>
        </header>
        
        <PlaceFeed initialPlaces={places || []} />
      </div>
    </main>
  );
}