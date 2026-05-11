'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { applyToPost, createBookmark, fetchBookmarks, fetchPostById, removeBookmark } from '@/lib/api';
import { getAccessToken, getRole } from '@/lib/auth';

function Stars({ value }) {
  const rounded = Math.round(value || 0);
  return <span>{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>;
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [msg, setMsg] = useState('');

  const token = getAccessToken();

  useEffect(() => {
    async function load() {
      try {
        const detail = await fetchPostById(id, token);
        setPost(detail);
        if (token && getRole() === 'STUDENT') {
          const list = await fetchBookmarks(token);
          setBookmarks(list);
        }
      } catch (error) {
        setMsg(error.message);
      }
    }
    load();
  }, [id, token]);

  const currentBookmark = useMemo(
    () => bookmarks.find((item) => Number(item.post) === Number(id)),
    [bookmarks, id]
  );

  const onApply = async () => {
    try {
      if (!token || getRole() !== 'STUDENT') {
        router.push('/login');
        return;
      }
      await applyToPost(id, token);
      setMsg('Applied successfully.');
    } catch (error) {
      setMsg(error.message);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (!token || getRole() !== 'STUDENT') {
        router.push('/login');
        return;
      }
      if (currentBookmark) {
        await removeBookmark(currentBookmark.id, token);
      } else {
        await createBookmark(id, token);
      }
      const list = await fetchBookmarks(token);
      setBookmarks(list);
    } catch (error) {
      setMsg(error.message);
    }
  };

  if (!post) {
    return <section className="rounded-xl bg-white/90 p-5">Loading course details...</section>;
  }

  const company = post.company_details || {};
  const locationText = company.headquarters || post.company_location || 'Cairo, Egypt';
  const mapQuery = encodeURIComponent(`${company.name || ''} ${locationText}`.trim());
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="space-y-5">
      <article className="paper-note rounded-xl p-6">
        <h1 className="font-serifHead text-3xl text-gray-900">{post.title}</h1>
        <p className="mt-2 text-gray-700">{post.description}</p>
        <div className="mt-4 grid gap-2 text-sm text-gray-700 md:grid-cols-3">
          <p><strong>Price:</strong> {Number(post.price || 0) === 0 ? 'Free' : `$${post.price}`}</p>
          <p><strong>Duration:</strong> {post.duration}</p>
          <p><strong>Level:</strong> {post.level}</p>
          <p><strong>Category:</strong> {post.category}</p>
          <p><strong>Instructor:</strong> {post.instructor_info}</p>
          <p><strong>Prerequisites:</strong> {post.prerequisites || 'None'}</p>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onApply} className="rounded-lg bg-gray-900 px-4 py-2 text-white">Apply Now</button>
          <button onClick={toggleBookmark} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800">
            {currentBookmark ? 'Saved' : 'Save'}
          </button>
        </div>
      </article>

      <article className="paper-note rounded-xl p-6">
        <h2 className="font-serifHead text-2xl text-gray-900">Company Information</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <p><strong>Name:</strong> {company.name}</p>
          <p><strong>Location:</strong> {company.headquarters || 'N/A'}</p>
          <p className="md:col-span-2"><strong>Description:</strong> {company.about_summary}</p>
          <p><strong>Verification:</strong> {company.is_verified ? 'Trusted / Verified' : 'Not Verified'}</p>
          <p><strong>Trust Score:</strong> {company.trust_score}/100</p>
          <p><strong>Rating:</strong> <Stars value={company.average_rating} /> ({company.reviews_count || 0} reviews)</p>
          <p><strong>Logo:</strong> {company.logo || 'N/A'}</p>
          <div className="md:col-span-2">
            <div className="mb-1 text-sm font-semibold text-gray-700">Trust Score Bar</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${company.trust_score || 0}%` }} />
            </div>
          </div>
        </div>
      </article>

      <article className="paper-note rounded-xl p-6">
        <h2 className="font-serifHead text-2xl text-gray-900">Company Location</h2>
        <p className="mt-2 text-sm text-gray-700"><strong>City:</strong> {locationText}</p>
        <p className="text-sm text-gray-700"><strong>Address:</strong> {locationText}</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
          <iframe
            title="Company location map"
            src={mapSrc}
            width="100%"
            height="320"
            loading="lazy"
          />
        </div>
      </article>

      <article className="paper-note rounded-xl p-6">
        <h2 className="font-serifHead text-2xl text-gray-900">Testimonials</h2>
        <div className="mt-3 space-y-3">
          {(post.testimonials || []).length === 0 && <p className="text-sm text-gray-600">No reviews yet.</p>}
          {(post.testimonials || []).map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-semibold text-gray-900">{item.student_name || 'Student'}</p>
              <p className="text-xs text-amber-700"><Stars value={item.rating} /></p>
              <p className="mt-1 text-sm text-gray-700">{item.comment}</p>
            </div>
          ))}
        </div>
      </article>

      {msg && <p className="rounded-lg bg-white/90 p-3 text-sm text-gray-800">{msg}</p>}
    </section>
  );
}
