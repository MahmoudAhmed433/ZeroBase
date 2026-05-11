import PaperPostCard from '@/components/PaperPostCard';
import { fetchPosts } from '@/lib/api';

const fallbackPosts = [
  {
    id: 9001,
    company_name: 'NileTech Labs',
    company_location: 'Cairo, Egypt',
    title: 'Frontend Practical Training Program',
    description: 'Build real UI modules with mentorship from senior engineers in a production workflow.',
    duration: '8 weeks',
    category: 'Web Development',
    level: 'Intermediate',
    price: 0,
    instructor_info: 'Senior Frontend Engineer',
    trust_score: 92,
    is_verified: true,
    created_at: '2026-05-01T00:00:00'
  },
  {
    id: 9002,
    company_name: 'Delta Secure Systems',
    company_location: 'Alexandria, Egypt',
    title: 'Cybersecurity SOC Internship',
    description: 'Hands-on SOC monitoring and incident response simulations with enterprise tooling.',
    duration: '10 weeks',
    category: 'Cybersecurity',
    level: 'Beginner',
    price: 0,
    instructor_info: 'Lead Security Analyst',
    trust_score: 88,
    is_verified: true,
    created_at: '2026-04-26T00:00:00'
  },
  {
    id: 9003,
    company_name: 'Orbit Data Works',
    company_location: 'Giza, Egypt',
    title: 'Data Analyst Job Simulation',
    description: 'Practice analytics pipelines, reporting, and KPI dashboards on realistic business datasets.',
    duration: '6 weeks',
    category: 'Data Analytics',
    level: 'Beginner',
    price: 450,
    instructor_info: 'Data Platform Engineer',
    trust_score: 79,
    is_verified: false,
    created_at: '2026-04-20T00:00:00'
  }
];

function applyFallbackFilters(items, params) {
  let list = [...items];
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(s) || p.company_name.toLowerCase().includes(s));
  }
  if (params.min_trust) {
    list = list.filter((p) => p.trust_score >= Number(params.min_trust));
  }
  if (params.is_verified === 'true') {
    list = list.filter((p) => p.is_verified);
  }
  if (params.is_verified === 'false') {
    list = list.filter((p) => !p.is_verified);
  }
  if (params.ordering === 'created_at') {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (params.ordering === 'company__trust_score') {
    list.sort((a, b) => a.trust_score - b.trust_score);
  } else if (params.ordering === '-company__trust_score') {
    list.sort((a, b) => b.trust_score - a.trust_score);
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
}

function Field({ label, name, defaultValue, type = 'text', placeholder }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue || ''}
        placeholder={placeholder}
        className="rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-gray-900"
      />
    </label>
  );
}

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  let posts = [];
  let loadError = "";
  try {
    posts = await fetchPosts({
      search: params.search,
      company__industry: params.industry,
      company__is_verified: params.is_verified,
      min_trust: params.min_trust,
      posted_after: params.posted_after,
      ordering: params.ordering || '-created_at'
    });
  } catch (error) {
    loadError = "Backend is currently offline. Showing demo posts.";
    posts = applyFallbackFilters(fallbackPosts, params);
  }

  return (
    <div className="space-y-6">
      <header className="content-panel text-white shadow-xl">
        <h1 className="font-serifHead text-4xl">ZeroBase Practical Learning Board</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-100">
          Real professionals. Real companies. Practical training opportunities pinned for students.
        </p>
      </header>

      <section className="content-panel">
        <form className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Field label="Search" name="search" defaultValue={params.search} placeholder="Title or company" />
          <Field label="Industry" name="industry" defaultValue={params.industry} placeholder="AI, Cybersecurity..." />
          <Field label="Min Trust" name="min_trust" type="number" defaultValue={params.min_trust} placeholder="0-100" />
          <Field label="Posted After" name="posted_after" type="date" defaultValue={params.posted_after} />

          <label className="flex flex-col gap-2 text-sm font-medium text-white">
            Verified
            <select name="is_verified" defaultValue={params.is_verified || ''} className="rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-gray-900">
              <option value="">All</option>
              <option value="true">Verified only</option>
              <option value="false">Not verified</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-white">
            Sort
            <select name="ordering" defaultValue={params.ordering || '-created_at'} className="rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-gray-900">
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="-company__trust_score">Highest Trust</option>
              <option value="company__trust_score">Lowest Trust</option>
            </select>
          </label>

          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white md:col-span-2 lg:col-span-1 lg:self-end">
            Filter Board
          </button>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loadError && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{loadError}</div>
        )}
        {!loadError && posts.length === 0 && (
          <div className="rounded-lg bg-white/90 p-3 text-sm text-gray-800">
            No posts yet. Create a training post from the company dashboard.
          </div>
        )}
        {posts.map((post) => (
          <PaperPostCard key={post.id} post={post} />
        ))}
      </section>
    </div>
  );
}
