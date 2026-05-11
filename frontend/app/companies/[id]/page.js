import Link from 'next/link';
import { fetchCompanyById } from '@/lib/api';

function listOrFallback(items, fallback) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-600">{fallback}</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-6 text-sm text-gray-800">
      {items.map((item, index) => (
        <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}

export default async function CompanyDetailPage({ params }) {
  const { id } = await params;
  const company = await fetchCompanyById(id);

  return (
    <article className="paper-note mx-auto max-w-5xl rounded-2xl p-6 shadow-paper md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="font-serifHead text-4xl text-gray-900">{company.name}</h1>
          <p className="mt-2 text-sm text-gray-600">{company.industry} · {company.headquarters || 'Unknown HQ'}</p>
        </div>
        <div className="flex items-center gap-2">
          {company.is_verified && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">✔ Verified by ZeroBase</span>}
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">Trust {company.trust_score}/100</span>
        </div>
      </div>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="font-serifHead text-2xl text-gray-900">Company Report</h2>
          <p className="mt-3 text-sm leading-6 text-gray-800">{company.about_summary}</p>
          <p className="mt-3 text-sm leading-6 text-gray-800">{company.market_contribution || 'Market contribution details are being curated by admin reviewers.'}</p>
        </div>

        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">Trust Inputs</h3>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li>Website: {company.official_website ? 'Yes' : 'No'}</li>
            <li>LinkedIn: {company.linkedin_url ? 'Yes' : 'No'}</li>
            <li>Crunchbase: {company.crunchbase_url ? 'Yes' : 'No'}</li>
            <li>Sources: {company.sources?.length || 0}</li>
          </ul>
        </aside>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-serifHead text-xl text-gray-900">Achievements</h3>
          <div className="mt-3">{listOrFallback(company.achievements, 'No achievements listed yet.')}</div>
        </div>

        <div>
          <h3 className="font-serifHead text-xl text-gray-900">Milestones Timeline</h3>
          <div className="mt-3">{listOrFallback(company.milestones, 'No timeline milestones yet.')}</div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-serifHead text-xl text-gray-900">Sources</h3>
        {company.sources && company.sources.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {company.sources.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No approved sources published yet.</p>
        )}
      </section>

      <div className="mt-8">
        <Link href="/" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Back to Board
        </Link>
      </div>
    </article>
  );
}
