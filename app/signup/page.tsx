'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('@');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validation
    if (!username.startsWith('@') || username.length < 3) {
      return setMessage({ text: 'Username must start with @ and be at least 2 characters long.', type: 'error' });
    }
    if (username.includes(' ')) {
      return setMessage({ text: 'Username cannot contain spaces.', type: 'error' });
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(), // This goes straight to your trigger!
        }
      }
    });

    setLoading(false);

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      // Supabase requires email confirmation by default
      setMessage({ text: 'Success! Your account is created and is pending Admin approval.', type: 'success' });
      // Optional: If you have email confirmation turned off, you can just route them to home:
      // router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Join the Community</h1>
          <p className="text-gray-500 mt-2 text-sm">Create an account to share your favorite spots.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const val = e.target.value;
                // Force the @ symbol to stay at the front
                setUsername(val.startsWith('@') ? val : '@' + val.replace('@', ''));
              }}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900"
              required
              placeholder="@nightowl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </main>
  );
}