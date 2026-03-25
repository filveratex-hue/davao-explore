'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../utils/supabase';   

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
      // --- THE MASTER KEY ---
      // If the email is your admin email, we let you in immediately!
      if (authData.user.email === 'filjhun145@gmail.com') {
        router.push('/'); 
        router.refresh();
        return;
      }

      // --- THE BOUNCER (For everyone else) ---
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h2>
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>

        {message.type && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Verifying...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}