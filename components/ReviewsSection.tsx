'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useToast } from '../context/ToastContext';
import { Review } from '../types';

interface ReviewWithProfile extends Review {
  profiles?: {
    username: string;
  };
  review_text: string;
}

export default function ReviewsSection({ placeId }: { placeId: string }) {
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0); 
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message);
      return;
    }

    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviews(data as ReviewWithProfile[]);
    }
  }, [placeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
    supabase.auth.getSession().then(({ data: { session } }) => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserId(session?.user?.id || null);
    });
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      showToast("Log in to leave a review.", "error");
      return;
    }
    
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
      showToast("Submission failed: " + error.message, "error");
    } else {
      setReviewText('');
      setRating(5);
      showToast("Review posted! +2 Points earned.", "success");
      fetchReviews();
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
    
  const hasReviewed = reviews.some((review) => review.user_id === userId);
  
  return (
    <div className="mt-10 md:mt-16 pt-8 md:pt-10 border-t border-gray-100">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase italic tracking-tight">Community Talk</h2>
          <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real experiences from explorers</p>
        </div>
        <div className="bg-black text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-2 shadow-xl shadow-gray-200">
          <span className="text-sm">⭐</span> 
          <span className="font-black text-base md:text-lg">{averageRating}</span> 
          <span className="text-gray-500 text-[9px] md:text-[10px] font-black">/ {reviews.length}</span>
        </div>
      </div>

      {/* --- REVIEW FORM --- */}
      {!userId ? (
        <div className="bg-gray-50 p-5 md:p-6 rounded-2xl text-center mb-8 md:mb-12 border border-gray-100 border-dashed">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Log in to share your thoughts</p>
        </div>
      ) : hasReviewed ? (
        <div className="bg-emerald-50 p-5 md:p-6 rounded-2xl text-center mb-8 md:mb-12 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">✨ Mission Complete: Review Submitted</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-gray-50 shadow-sm mb-8 md:mb-12 transition-all hover:border-black/5">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-4 ml-1">Rate your journey</label>
          
          {/* Stars — 44px touch targets */}
          <div className="flex items-center gap-1 md:gap-2 mb-5 md:mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={`w-11 h-11 md:w-auto md:h-auto flex items-center justify-center text-2xl md:text-3xl transition-transform active:scale-90 ${
                  (hoverRating || rating) >= star ? 'text-amber-400' : 'text-gray-100'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Textarea — 16px font to prevent iOS zoom */}
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="How was the vibe? (Min. 15 chars)"
            required
            minLength={15}
            className="w-full p-4 md:p-5 border border-gray-100 bg-gray-50 rounded-2xl mb-4 focus:ring-2 focus:ring-black focus:bg-white outline-none text-base transition-all leading-relaxed"
            rows={3}
          />
          
          <button
            type="submit"
            disabled={isSubmitting || reviewText.length < 15}
            className="w-full bg-black text-white font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:bg-gray-200 disabled:scale-100 uppercase tracking-[0.2em] text-[10px] min-h-[48px]"
          >
            {isSubmitting ? 'Syncing...' : 'Publish Review'}
          </button>
        </form>
      )}

      {/* --- REVIEWS LIST --- */}
      <div className="space-y-4 md:space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-10 opacity-30 grayscale">
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">No data found</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0">
                    {(review.profiles?.username || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-xs uppercase tracking-tight">
                      {review.profiles?.username || 'Explorer'}
                    </p>
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-0.5">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < review.rating ? 'text-amber-400' : 'text-gray-100'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed font-medium pl-1">{review.review_text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}