import AuthForm from '../../components/AuthForm';
import Link from 'next/link'; //

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Catigan Explore</h1>
        <p className="text-gray-500 mt-2">Sign in to add places and earn points.</p>
      </div>
      
      <AuthForm />

  {/* --- NEW SIGNUP LINK --- */}
      <p className="mt-8 text-sm text-gray-500">
        Don't have an account?{' '}
        <Link href="/signup" className="text-blue-600 font-bold hover:underline">
          Sign up
        </Link>
      </p>
      
      
    </main>
  );
}