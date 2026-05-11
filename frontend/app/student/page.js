'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMyCourses } from '@/lib/api';
import { getAccessToken, getRole } from '@/lib/auth';

export default function StudentPage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        if (getRole() !== 'STUDENT') {
          router.replace('/login');
          return;
        }
        const data = await fetchMyCourses(getAccessToken());
        setCourses(data);
      } catch (e) {
        setError(e.message);
      }
    };
    run();
  }, [router]);

  return (
    <section className="space-y-4">
      <h1 className="font-serifHead text-3xl text-white">My Courses Board</h1>
      {error && <p className="text-red-200">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((item) => (
          <article key={item.id} className="paper-note rounded-xl p-4 shadow-paper">
            <h2 className="font-serifHead text-xl text-gray-900">{item.post_title}</h2>
            <p className="mt-2 text-sm text-gray-700">Application Status: <strong>{item.status}</strong></p>
            <p className="mt-1 text-xs text-gray-600">Submitted: {new Date(item.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
