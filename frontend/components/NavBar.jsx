'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearSession, getRole } from '@/lib/auth';

export default function NavBar() {
  const [role, setRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setRole(getRole());
  }, []);

  const logout = () => {
    clearSession();
    setRole('');
    window.location.href = '/';
  };

  return (
    <header className="mb-6 rounded-2xl border border-white/25 bg-black/35 p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="font-serifHead text-2xl">ZeroBase</Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="rounded-md px-2 py-1 hover:bg-white/10">Home</Link>
          {!role && (
            <>
              <Link href="/login" className="rounded-md border border-white/40 px-3 py-1">Sign In</Link>
              <Link href="/signup" className="rounded-md bg-emerald-600 px-3 py-1 text-white">Sign Up</Link>
            </>
          )}
          {role && (
            <div className="relative">
              <button onClick={() => setMenuOpen((prev) => !prev)} className="rounded-md bg-white/20 px-3 py-1">
                Account
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white p-2 text-gray-900 shadow-lg">
                  {role === 'STUDENT' && (
                    <Link href="/student" className="block rounded px-2 py-1 hover:bg-gray-100">My Courses</Link>
                  )}
                  {role === 'COMPANY' && (
                    <Link href="/company" className="block rounded px-2 py-1 hover:bg-gray-100">Company Dashboard</Link>
                  )}
                  <button onClick={logout} className="mt-1 w-full rounded px-2 py-1 text-left hover:bg-gray-100">Logout</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
