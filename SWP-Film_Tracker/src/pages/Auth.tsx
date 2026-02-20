import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const resp = await authAPI.login({ email, password });
        const { token, user } = resp.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/');
      } else {
        const resp = await authAPI.register({ email, username: email.split('@')[0], password, displayName: displayName || email.split('@')[0] });
        const { token, user } = resp.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error?.response?.data || error);
      alert(error?.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoading(false);
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

        {/* Demo Account */}
        {isLogin && (
          <div className="mt-8 p-4 rounded-lg bg-blue-600/10 border border-blue-600/50">
            <p className="text-xs text-blue-400 mb-2">Demo Account:</p>
            <p className="text-xs text-gray-300">
              Email: <span className="font-mono">demo@example.com</span>
              </p>
              <p className="text-xs text-gray-300">
                Password: <span className="font-mono">demo123</span>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
