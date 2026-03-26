'use client';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div 
      onClick={onClose}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] cursor-pointer flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl border-2 animate-bounce-in transition-all active:scale-95 ${
        type === 'success' ? 'bg-emerald-900 border-emerald-400 text-emerald-50' : 
        type === 'error' ? 'bg-red-900 border-red-400 text-red-50' : 
        'bg-gray-900 border-gray-400 text-white'
      }`}
    >
      <span className="text-xl">
        {type === 'success' ? '✨' : type === 'error' ? '🚫' : '💡'}
      </span>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
        {message}
      </p>
    </div>
  );
}