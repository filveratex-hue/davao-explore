'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../utils/supabase';   
import Link from 'next/link';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | null }>({ text: '', type: null });
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: null });

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
      setLoading(false);
      return;
    }

    if (authData.user) {
      if (authData.user.email === 'filjhun145@gmail.com') {
        router.push('/'); 
        router.refresh();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', authData.user.id)
        .single();

      if (profileError || profile?.status === 'pending' || !profile?.status) {
        await supabase.auth.signOut();
        setMessage({ 
          text: profileError ? `DB Error: ${profileError.message}` : 'Access Denied: Your account is still pending Admin approval.', 
          type: 'error' 
        });
        setLoading(false);
        return;
      }
    }

    setMessage({ text: 'Welcome back!', type: 'success' });
    router.push('/'); 
    router.refresh(); 
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full mx-auto">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-4 shadow-lg">
          D
        </div>
        <h2 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter">Welcome Back</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sign in to explore Davao</p>
      </div>
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900 bg-gray-50 transition-all"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900 bg-gray-50 transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {message.type && (
          <div className={`p-3.5 rounded-xl text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-black text-white font-[1000] py-4 rounded-xl hover:bg-gray-800 transition-all disabled:bg-gray-300 uppercase tracking-widest text-[11px] min-h-[56px] active:scale-95 shadow-lg"
        >
          {loading ? 'Verifying...' : 'Log In'}
        </button>
      </form>

      {/* Sign up link */}
      <div className="text-center mt-6 pt-5 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          New explorer?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-500 transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}