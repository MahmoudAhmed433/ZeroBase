'use client';

import { useState } from 'react';
import { authLogin, fetchMe } from '@/lib/api';
import { setSession } from '@/lib/auth';

export default function LoginPage() {
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await authLogin(form.get('username'), form.get('password'));
      const me = await fetchMe(data.access);
      setSession(data.access, me.role);
      window.location.href = '/';
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="content-panel mx-auto max-w-xl text-white">
      <h1 className="font-serifHead text-3xl">Login</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input name="username" required placeholder="Username" className="w-full rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
        <input name="password" required type="password" placeholder="Password" className="w-full rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold">Login</button>
        {error && <p className="text-sm text-red-200">{error}</p>}
      </form>
    </section>
  );
}
