'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaperPostCard({ post }) {
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    const savedList = JSON.parse(localStorage.getItem('savedCourseIds') || '[]');
    const compareList = JSON.parse(localStorage.getItem('compareCourseIds') || '[]');
    setSaved(savedList.includes(post.id));
    setCompared(compareList.includes(post.id));
  }, [post.id]);

  const onSave = () => {
    const savedList = JSON.parse(localStorage.getItem('savedCourseIds') || '[]');
    const next = savedList.includes(post.id)
      ? savedList.filter((id) => id !== post.id)
      : [...savedList, post.id];
    localStorage.setItem('savedCourseIds', JSON.stringify(next));
    setSaved(next.includes(post.id));
    setMessage(next.includes(post.id) ? 'Saved to your list.' : 'Removed from saved.');
  };

  const onCompare = () => {
    const compareList = JSON.parse(localStorage.getItem('compareCourseIds') || '[]');
    if (!compareList.includes(post.id) && compareList.length >= 3) {
      setMessage('You can compare up to 3 programs.');
      return;
    }
    const next = compareList.includes(post.id)
      ? compareList.filter((id) => id !== post.id)
      : [...compareList, post.id];
    localStorage.setItem('compareCourseIds', JSON.stringify(next));
    setCompared(next.includes(post.id));
    setMessage(next.includes(post.id) ? 'Added to compare.' : 'Removed from compare.');
  };

  const rotation = `${((post.id % 3) - 1) * 0.15}deg`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, rotate: 0 }}
      className="paper-note relative rounded-xl p-6"
      style={{ transform: `rotate(${rotation})` }}
    >
      <span className="push-pin absolute left-1/2 top-2 -translate-x-1/2" />
      <h3 className="mt-3 font-serifHead text-2xl text-gray-900">{post.title}</h3>
      <p className="mt-2 text-sm text-gray-700">{post.company_name}</p>
      <p className="text-xs text-gray-600">{post.company_location || 'Location not specified'}</p>
      <p className="mt-2 line-clamp-3 text-sm text-gray-700">{post.description}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <p>Duration: {post.duration}</p>
        <p>Level: {post.level || 'N/A'}</p>
        <p>Category: {post.category || 'General'}</p>
        <p>Price: {Number(post.price || 0) === 0 ? 'Free' : `$${post.price}`}</p>
      </div>
      <p className="mt-1 text-xs text-gray-600">Instructor: {post.instructor_info}</p>
      {post.prerequisites && (
        <p className="mt-1 text-xs text-gray-600">Prerequisites: {post.prerequisites}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {post.is_verified ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Verified Company</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Unverified</span>
        )}
        <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700">Trust {post.trust_score}</span>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{post.category || 'General'}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-xs font-semibold text-gray-600">Trust Score</div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${post.trust_score || 0}%` }} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link href={`/courses/${post.id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800">
          View Program
        </Link>
        <button onClick={onSave} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">
          {saved ? 'Saved' : 'Save'}
        </button>
        <button onClick={onCompare} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800">
          {compared ? 'Comparing' : 'Compare'}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
    </motion.article>
  );
}
