import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sword } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Sword className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-zinc-100">GM-OS</h1>
          <p className="text-zinc-500 text-sm mt-1">Game Master Operating System</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-zinc-300 text-sm">
              Check your email for a magic link to sign in.
            </p>
            <p className="text-zinc-600 text-xs">
              Sent to <span className="text-zinc-400">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-400 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Magic Link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
