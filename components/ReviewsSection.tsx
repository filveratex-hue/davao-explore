'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function ReviewsSection({ placeId }: { placeId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    // We fetch the reviews AND the username of the person who wrote it!
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
  };

  useEffect(() => {
    fetchReviews();
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, [placeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert('You must be logged in to leave a review.');
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from('reviews')
      .insert([{
        place_id: placeId,
        user_id: userId,
        rating: rating,
        review_text: reviewText
      }]);

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      alert('Failed to submit review.');
    } else {
      setReviewText('');
      setRating(5);
      fetchReviews(); // Instantly reload the reviews to show the new one!
    }
  };

  // Calculate the average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
    
  // Check if the currently logged-in user has already left a review in this list
  const hasReviewed = reviews.some((review) => review.user_id === userId);
  
  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Reviews & Ratings</h2>
        <div className="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-lg flex items-center gap-1">
          <span>⭐</span> {averageRating} <span className="text-amber-900/50 text-sm font-normal">({reviews.length})</span>
        </div>
      </div>

      {/* --- THE REVIEW FORM (WITH ANTI-SPAM LOGIC) --- */}
      {!userId ? (
        <div className="bg-gray-50 p-4 rounded-xl text-center mb-8 border border-gray-100">
          <p className="text-sm text-gray-500">Please log in to leave a review.</p>
        </div>
      ) : hasReviewed ? (
        <div className="bg-emerald-50 p-4 rounded-xl text-center mb-8 border border-emerald-100">
          <p className="text-sm text-emerald-700 font-bold">✨ Thanks for reviewing this spot!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <p className="font-bold text-gray-900 mb-2">Leave a Review</p>
          
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${rating >= star ? 'text-amber-400' : 'text-gray-200'}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think of this spot? How was the road getting there?"
            required
            minLength={15} // Enforces the quality rule!
            className="w-full p-3 border border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            rows={3}
          />
          
          <button
            type="submit"
            disabled={isSubmitting || reviewText.length < 15}
            className="bg-gray-900 text-white font-bold px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Review'}
          </button>
        </form>
      )}

      {/* --- THE REVIEWS LIST --- */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-gray-900 text-sm">{review.profiles?.username || 'Anonymous User'}</p>
                <div className="text-amber-400 text-sm">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{review.review_text}</p>
              <p className="text-xs text-gray-400 mt-3">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}