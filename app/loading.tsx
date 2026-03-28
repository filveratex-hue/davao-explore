import PlaceFeedSkeleton from '../components/PlaceFeedSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-white text-gray-900 pb-32">
      <div className="max-w-7xl mx-auto p-4 pt-32">
        <PlaceFeedSkeleton />
      </div>
    </main>
  );
}