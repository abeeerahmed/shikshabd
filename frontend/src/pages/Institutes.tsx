import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { institutesApi, searchApi } from '../api/client';
import { Search, MapPin, Mail, Building2, Users, Heart, Filter } from 'lucide-react';
import { getFavorites, toggleFavorite } from './Favorites';
import { useToast } from '../components/Toast';

export function Institutes() {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [sort] = useState('name');
  const [favSet, setFavSet] = useState<Set<string>>(new Set(getFavorites()));
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const toast = useToast();
  // useAppStore available for future use

  const [filters, setFilters] = useState({
    q: '',
    level: '',
    division: '',
    district: '',
    type: '',
    management: '',
    mpo: '',
  });

  useEffect(() => {
    institutesApi.divisions().then((r) => setDivisions(r.data));
    institutesApi.types().then((r) => setTypes(r.data));
  }, []);

  useEffect(() => {
    if (filters.division) {
      institutesApi.districts(filters.division).then((r) => setDistricts(r.data));
    } else {
      setDistricts([]);
    }
  }, [filters.division]);

  // Autocomplete suggestions
  useEffect(() => {
    if (filters.q.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      searchApi.suggest(filters.q).then((r) => { setSuggestions(r.data); setShowSuggestions(true); }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPage = async (p: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const r = await institutesApi.list({ ...filters, page: p, page_size: 100, sort });
      const d = r.data.data ?? [];
      const t = r.data.total ?? 0;
      setTotal(t);
      setAllItems((prev) => (reset ? d : [...prev, ...d]));
      setHasMore(p * 100 < t);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setAllItems([]);
    setHasMore(true);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  useEffect(() => {
    if (page > 1) fetchPage(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const data = allItems;

  const updateFilter = (key: string, val: string) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleFav = (eiin: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(eiin);
    setFavSet(new Set(getFavorites()));
    toast.show(favSet.has(eiin) ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const exportCsv = () => {
    const headers = ['Name', 'ID', 'Level', 'Division', 'District', 'Type', 'Management', 'Email', 'MPO', 'Teachers'];
    const rows = data.map((inst: any) => [
      inst.institute_name, inst.eiin_or_code, inst.level, inst.division, inst.district,
      inst.institute_type, inst.management, inst.email, inst.is_mpo, inst.teacher_count ?? inst.total_teacher ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'institutes.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.show('CSV exported successfully', 'success');
  };

  const clearFilters = () => {
    setFilters({ q: '', level: '', division: '', district: '', type: '', management: '', mpo: '' });
    setPage(1);
    toast.show('Filters cleared', 'info');
  };

  const hasActiveFilters = filters.q || filters.level || filters.division || filters.district || filters.type || filters.management || filters.mpo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">Institutes</h1>
          <p className="text-[var(--color-muted)] mt-1">{total.toLocaleString()} institutes found</p>
        </div>
        <div className="flex gap-2">
          {compareSet.size > 0 && (
            <Link to={`/compare?eiins=${[...compareSet].join(',')}`} className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
              Compare ({compareSet.size})
            </Link>
          )}
          <button onClick={() => setShowFilters(!showFilters)} className="md:hidden px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-border)] transition">
            <Filter size={16} className="inline mr-1" /> Filters
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-100 transition dark:border-slate-600 dark:hover:bg-slate-700 dark:text-slate-300">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick filter presets */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'MPO only', filters: { mpo: 'YES' } },
          { label: 'Government', filters: { management: 'Government' } },
          { label: 'Primary', filters: { level: 'Primary' } },
          { label: 'Post-Primary', filters: { level: 'Post-Primary' } },
        ].map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setFilters((f) => ({ ...f, ...p.filters }));
              setPage(1);
              toast.show(`Filter: ${p.label}`, 'info');
            }}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-emerald-500 hover:text-emerald-700 transition"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button onClick={exportCsv} className="px-4 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition">
          Export CSV
        </button>
      </div>

      {/* Mobile backdrop */}
      {showFilters && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowFilters(false)} />}
      {/* Filters */}
      <div className={`bg-[var(--color-surface)] rounded-xl p-4 md:p-5 shadow-sm border border-[var(--color-border)] z-50
        md:static md:transform-none md:opacity-100
        ${showFilters ? 'block fixed inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto shadow-2xl' : 'hidden md:block'}`}>
        <div className="flex md:hidden items-center justify-between mb-3">
          <h3 className="font-semibold text-[var(--color-text)]">Filters</h3>
          <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)]">✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search name or ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition bg-[var(--color-surface)] text-[var(--color-text)]"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s: any) => (
                  <button
                    key={s.eiin_or_code}
                    onMouseDown={() => { updateFilter('q', s.institute_name); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-700 transition text-sm"
                  >
                    <span className="font-medium text-[var(--color-text)]">{s.institute_name}</span>
                    <span className="text-xs text-[var(--color-muted)] ml-2">{s.district}, {s.division}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={filters.level} onChange={(e) => updateFilter('level', e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]">
            <option value="">All Levels</option>
            <option value="Primary">Primary</option>
            <option value="Post-Primary">Post-Primary</option>
          </select>
          <select value={filters.division} onChange={(e) => updateFilter('division', e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]">
            <option value="">All Divisions</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.district} onChange={(e) => updateFilter('district', e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]">
            <option value="">All Districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]">
            <option value="">All Types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.management} onChange={(e) => updateFilter('management', e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]">
            <option value="">All Management</option>
            <option value="Government">Government</option>
            <option value="NON-GOVERNMENT">Non-Government</option>
            <option value="GOVERNMENT">Government (IPEMIS)</option>
          </select>
          <select value={filters.mpo} onChange={(e) => updateFilter('mpo', e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]">
            <option value="">All MPO</option>
            <option value="YES">MPO</option>
            <option value="NO">Non-MPO</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2 dark:bg-slate-700" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-3 dark:bg-slate-700" />
              <div className="h-3 bg-slate-100 rounded w-full dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((inst: any) => (
            <div
              key={inst.eiin_or_code}
              className={`group card p-5 relative transition-all ${compareSet.has(inst.eiin_or_code) ? 'border-emerald-500 ring-2 ring-emerald-200' : ''}`}
            >
              <Link to={`/institutes/${inst.eiin_or_code}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--color-text)] group-hover:text-emerald-700 transition-colors truncate">
                      {inst.institute_name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] mt-1">ID: {inst.eiin_or_code} · {inst.id_type}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                    inst.level === 'Primary' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {inst.level}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {inst.district}, {inst.division}</span>
                  {inst.email && <span className="flex items-center gap-1"><Mail size={12} /> {inst.email}</span>}
                  <span className="flex items-center gap-1"><Building2 size={12} /> {inst.institute_type}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {inst.is_mpo && (
                    <span className={`text-xs px-2 py-0.5 rounded ${inst.is_mpo === 'YES' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      MPO: {inst.is_mpo}
                    </span>
                  )}
                  {(inst.teacher_count ?? 0) > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                      <Users size={10} /> {inst.teacher_count} teachers
                    </span>
                  )}
                  {inst.total_teacher != null && inst.total_teacher > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <Users size={10} /> {inst.total_teacher} teachers (IPEMIS)
                    </span>
                  )}
                </div>
              </Link>
              <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setCompareSet((prev) => {
                      const next = new Set(prev);
                      if (next.has(inst.eiin_or_code)) next.delete(inst.eiin_or_code);
                      else if (next.size < 3) next.add(inst.eiin_or_code);
                      return next;
                    });
                  }}
                  className={`p-1.5 rounded-full transition ${compareSet.has(inst.eiin_or_code) ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-400'}`}
                  title="Compare (max 3)"
                >
                  <span className="text-xs font-bold">⚖</span>
                </button>
                <button
                  onClick={(e) => handleFav(inst.eiin_or_code, e)}
                  className="p-1.5 rounded-full hover:bg-red-50 transition"
                  title="Save to favorites"
                >
                  <Heart size={16} className={favSet.has(inst.eiin_or_code) ? 'fill-red-500 text-red-500' : 'text-slate-300'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex items-center justify-center mt-6">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : `Load more (${data.length} of ${total.toLocaleString()})`}
          </button>
        </div>
      )}
      {!hasMore && data.length > 0 && (
        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Showing all {data.length.toLocaleString()} of {total.toLocaleString()} institutes
        </p>
      )}
    </div>
  );
}