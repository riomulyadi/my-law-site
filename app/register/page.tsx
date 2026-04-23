"use client";

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Pastikan path ini benar
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
      // Opsional: redirect ke halaman login setelah pendaftaran
      // router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">Daftar Akun Baru</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:bg-slate-400">
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600 mt-4">Sudah punya akun? <Link href="/login" className="text-blue-900 hover:underline">Login</Link></p>
      </div>
    </div>
  );
}