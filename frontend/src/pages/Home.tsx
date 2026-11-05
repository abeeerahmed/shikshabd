import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { statsApi } from '../api/client';
import { GraduationCap, Users, School, BookOpen, ArrowRight, MapPin } from 'lucide-react';

export function Home() {
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => statsApi.overview().then((r) => r.data),
  });

  const cards = [
    { label: 'Total Institutes', value: stats?.total_institutes, icon: School },
    { label: 'Primary Schools', value: stats?.primary, icon: BookOpen },
    { label: 'Post-Primary', value: stats?.post_primary, icon: GraduationCap },
    { label: 'Teachers', value: stats?.teachers_scraped, icon: Users },
  ];

  return (
    <div className="space-y-16 page-enter">
      {/* Hero */}
      <section className="py-12 md:py-20 hero-pattern">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-4 tracking-widest uppercase">
            Bangladesh Education Data
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 text-[var(--color-text)]">
            Every school,<br />
            <span className="text-emerald-700 dark:text-emerald-400">every teacher.</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--color-muted)] max-w-xl mb-8 leading-relaxed">
            Explore 101,797 institutes across Bangladesh — with teacher names, designations, joining dates, MPO status, and contact details.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/institutes" className="inline-flex items-center gap-2 bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-800 transition-colors text-sm">
              Browse Institutes <ArrowRight size={16} />
            </Link>
            <Link to="/search" className="inline-flex items-center gap-2 border border-[var(--color-border)] text-[var(--color-text)] font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--color-border)] transition-colors text-sm">
              Search
            </Link>
            <Link to="/map" className="inline-flex items-center gap-2 border border-[var(--color-border)] text-[var(--color-text)] font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--color-border)] transition-colors text-sm">
              <MapPin size={16} /> Map
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-5">
              <Icon size={20} className="text-emerald-700 dark:text-emerald-400 mb-3" />
              <p className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tabular">
                {loading ? '—' : (value ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-[var(--color-muted)] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid md:grid-cols-3 gap-4">
        {[
          { to: '/institutes', title: 'Institutes', desc: `Browse ${(stats?.total_institutes ?? 0).toLocaleString()} institutes with filters` },
          { to: '/teachers', title: 'Teachers', desc: `${(stats?.teachers_scraped ?? 0).toLocaleString()} teachers with details` },
          { to: '/stats', title: 'Statistics', desc: 'Charts and breakdowns' },
        ].map(({ to, title, desc }) => (
          <Link key={to} to={to} className="card p-5 group">
            <h3 className="font-semibold text-[var(--color-text)] group-hover:text-emerald-700 transition-colors">{title}</h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">{desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}