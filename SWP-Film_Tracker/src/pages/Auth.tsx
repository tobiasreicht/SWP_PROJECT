import React, { useEffect, useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export const Auth: React.FC = () => {
  const { user, isLoading, login, register } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await register(
          email,
          email.split('@')[0],
          displayName || email.split('@')[0],
          password
        );
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error?.response?.data || error);
      alert(error?.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 FilmTracker</h1>
          <p className="text-gray-400">
            {isLogin ? 'Welcome back!' : 'Join the community'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name (Sign Up) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <Input
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Forgot Password (Login) */}
          {isLogin && (
            <a href="#" className="text-sm text-red-600 hover:text-red-500">
              Forgot password?
            </a>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" className="w-full">
            Google
          </Button>
          <Button variant="secondary" className="w-full">
            GitHub
          </Button>
        </div>

        {/* Toggle Sign In/Up */}
        <p className="text-center text-gray-400 text-sm mt-6">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-red-600 hover:text-red-500 font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </Card>
    </div>
  );
};
