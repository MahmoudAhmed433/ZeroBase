'use client';

import { useState } from 'react';
import { authSignup } from '@/lib/api';

export default function SignupPage() {
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);

    const payload = {
      username: form.get('username'),
      email: form.get('email'),
      password: form.get('password'),
      role,
      full_name: form.get('full_name'),
      bio: form.get('bio')
    };

    if (role === 'COMPANY') {
      payload.company = {
        name: form.get('company_name'),
        about_summary: form.get('about_summary'),
        industry: form.get('industry'),
        official_website: form.get('official_website'),
        linkedin_url: form.get('linkedin_url'),
        headquarters: form.get('headquarters')
      };
    }

    try {
      await authSignup(payload);
      setMessage('Registration successful. Redirecting to home...');
      formEl.reset();
      setStep(1);
      setRole('');
      setTimeout(() => {
        window.location.href = '/';
      }, 700);
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <section className="content-panel mx-auto max-w-2xl text-white">
      <h1 className="font-serifHead text-3xl">Create Account</h1>
      {step === 1 ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-gray-100">Are you a company?</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setRole('COMPANY'); setStep(2); }} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold">
              Company
            </button>
            <button type="button" onClick={() => { setRole('STUDENT'); setStep(2); }} className="rounded-lg bg-white px-4 py-2 font-semibold text-gray-900">
              Student
            </button>
          </div>
        </div>
      ) : (
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
        <input name="username" required placeholder="Username" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
        <input name="email" type="email" required placeholder="Email" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
        <input name="password" type="password" required minLength={8} placeholder="Password" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
        <input name="full_name" placeholder="Full name" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
        <input value={role} disabled className="rounded-lg bg-white/80 px-3 py-2 text-gray-800" />

        <input name="bio" placeholder="Short bio" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />

        {role === 'COMPANY' && (
          <>
            <input name="company_name" required placeholder="Company name" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
            <input name="industry" required placeholder="Industry" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
            <input name="official_website" required placeholder="Official website" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
            <input name="linkedin_url" required placeholder="LinkedIn URL" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
            <input name="headquarters" placeholder="Headquarters" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900" />
            <textarea name="about_summary" required placeholder="About company" className="rounded-lg bg-white/90 px-3 py-2 text-gray-900 md:col-span-2" />
          </>
        )}

        <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-white/40 px-4 py-2 font-semibold md:col-span-1">Back</button>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold md:col-span-2">Sign Up</button>
      </form>
      )}
      {message && <p className="mt-3 text-sm text-gray-100">{message}</p>}
    </section>
  );
}
