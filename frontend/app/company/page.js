'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPost, fetchCandidates, fetchCompanyDashboard, updateApplicationStatus } from '@/lib/api';
import { getAccessToken, getRole } from '@/lib/auth';

export default function CompanyPage() {
  const [posts, setPosts] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const token = getAccessToken();

  const load = async () => {
    try {
      if (getRole() !== 'COMPANY') {
        router.replace('/login');
        return;
      }
      const [myPosts, allCandidates] = await Promise.all([
        fetchCompanyDashboard(token),
        fetchCandidates(token)
      ]);
      setPosts(myPosts);
      setCandidates(allCandidates);
    } catch (e) {
      setMessage(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const submitPost = async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      await createPost(
        {
          title: form.get('title'),
          description: form.get('description'),
          duration: form.get('duration'),
          prerequisites: form.get('prerequisites'),
          instructor_info: form.get('instructor_info')
        },
        token
      );
      setMessage('Post created successfully.');
      event.currentTarget.reset();
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateApplicationStatus(id, status, token);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="font-serifHead text-3xl text-white">Company Workspace</h1>

      <article className="paper-note rounded-xl p-5 shadow-paper">
        <h2 className="font-serifHead text-2xl text-gray-900">Create Practical Training / Course</h2>
        <form onSubmit={submitPost} className="mt-3 grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Title" className="rounded-lg border px-3 py-2" />
          <input name="duration" required placeholder="Duration (e.g. 8 weeks)" className="rounded-lg border px-3 py-2" />
          <input name="instructor_info" required placeholder="Instructor (working professional)" className="rounded-lg border px-3 py-2 md:col-span-2" />
          <textarea name="description" required placeholder="Practical tasks and workflow" className="rounded-lg border px-3 py-2 md:col-span-2" />
          <textarea name="prerequisites" placeholder="Prerequisites" className="rounded-lg border px-3 py-2 md:col-span-2" />
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white md:col-span-2">Publish Post</button>
        </form>
      </article>

      <article className="paper-note rounded-xl p-5 shadow-paper">
        <h2 className="font-serifHead text-xl text-gray-900">My Posts</h2>
        <ul className="mt-2 space-y-2 text-sm text-gray-700">
          {posts.map((post) => (
            <li key={post.id}>• {post.title} ({post.duration})</li>
          ))}
        </ul>
      </article>

      <article className="paper-note rounded-xl p-5 shadow-paper">
        <h2 className="font-serifHead text-xl text-gray-900">Candidate Management</h2>
        <div className="mt-3 space-y-3">
          {candidates.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <p className="font-semibold">{item.post_title}</p>
              <p className="text-sm">Student: {item.student_profile?.full_name || item.student_profile?.username}</p>
              <p className="text-sm">Status: {item.status}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => changeStatus(item.id, 'ACCEPTED')} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Accept</button>
                <button onClick={() => changeStatus(item.id, 'CONTACTED')} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Contact</button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {message && <p className="text-white">{message}</p>}
    </section>
  );
}
