import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { institutesApi } from '../api/client';
import type { Institute } from '../types';
import { Heart, Trash2, MapPin, Building2 } from 'lucide-react';

const FAV_KEY = 'edu_favorites';

export function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
export function toggleFavorite(eiin: string) {
  const favs = getFavorites();
  const idx = favs.indexOf(eiin);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(eiin);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  return favs;
}
export function isFavorite(eiin: string) { return getFavorites().includes(eiin); }

export function Favorites() {
  const [favIds, setFavIds] = useState<string[]>(getFavorites());
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favIds.length === 0) { setLoading(false); return; }
    // fetch each (batch via detail endpoint not ideal, but ok for small lists)
    Promise.all(favIds.map((id) => institutesApi.detail(id).then((r) => r.data.institute).catch(() => null)))
      .then((results) => { setInstitutes(results.filter(Boolean)); setLoading(false); });
  }, [favIds]);

  const remove = (eiin: string) => {
    toggleFavorite(eiin);
    setFavIds(getFavorites());
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Heart className="text-red-500" /> Favorites
        </h1>
        <p className="text-slate-500 mt-1">{institutes.length} saved institutes</p>
      </div>

      {institutes.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No favorites yet. Click the heart icon on any institute to save it.</p>
          <Link to="/institutes" className="inline-block mt-4 text-emerald-700 font-medium hover:underline">Browse Institutes →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutes.map((inst: any) => (
            <div key={inst.eiin_or_code} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative">
              <button onClick={() => remove(inst.eiin_or_code)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition">
                <Trash2 size={16} />
              </button>
              <Link to={`/institutes/${inst.eiin_or_code}`} className="block">
                <h3 className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors pr-8">{inst.institute_name}</h3>
                <p className="text-xs text-slate-400 mt-1">ID: {inst.eiin_or_code}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {inst.district}, {inst.division}</span>
                  <span className="flex items-center gap-1"><Building2 size={12} /> {inst.institute_type}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}