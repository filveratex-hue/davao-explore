'use client';

export default function QuickShareButton() {
  const handleShare = () => {
    if (typeof window === 'undefined') return;
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl active:scale-90 transition-transform"
    >
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </button>
  );
}
