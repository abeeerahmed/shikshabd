import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../api/client';
import { Search as SearchIcon, School, User } from 'lucide-react';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ institutes: any[]; teachers: any[] }>({ institutes: [], teachers: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await searchApi.global(q);
      setResults(r.data);
    } catch {
      setResults({ institutes: [], teachers: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Global Search</h1>
        <p className="text-[var(--color-muted)] mt-1">Search across institutes and teachers</p>
      </div>

      <form onSubmit={handleSearch} className="bg-[var(--color-surface)] rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type at least 2 characters..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-lg bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-800 transition">
            Search
          </button>
        </div>
      </form>

      {loading && <div className="text-center py-20 text-[var(--color-muted)]">Searching...</div>}

      {searched && !loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Institutes */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <School size={18} /> Institutes ({results.institutes.length})
            </h2>
            <div className="space-y-3">
              {results.institutes.map((inst: any) => (
                <Link key={inst.eiin_or_code} to={`/institutes/${inst.eiin_or_code}`} className="block p-3 rounded-xl hover:bg-[var(--color-border)] border border-transparent hover:border-[var(--color-border)] transition">
                  <p className="font-medium text-[var(--color-text)]">{inst.institute_name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{inst.eiin_or_code} · {inst.district}, {inst.division} · {inst.institute_type}</p>
                </Link>
              ))}
              {results.institutes.length === 0 && <p className="text-[var(--color-muted)] text-sm">No institutes found</p>}
            </div>
          </div>

          {/* Teachers */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <User size={18} /> Teachers ({results.teachers.length})
            </h2>
            <div className="space-y-3">
              {results.teachers.map((t: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-[var(--color-border)]">
                  <p className="font-medium text-[var(--color-text)]">{t.teacher_name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{t.designation} · {t.institute_name}</p>
                  <p className="text-xs text-[var(--color-muted)] opacity-70">{t.district}</p>
                </div>
              ))}
              {results.teachers.length === 0 && <p className="text-[var(--color-muted)] text-sm">No teachers found</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}