import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Scale, X } from 'lucide-react';

const FAV_KEY = 'edu_favorites';
function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}

export function FloatingActions() {
  const [favCount, setFavCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setFavCount(getFavorites().length);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 no-print">
      {open && (
        <div className="flex flex-col gap-2 mb-2">
          <Link to="/favorites" className="flex items-center gap-2 bg-white dark:bg-slate-800 text-red-500 px-4 py-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition text-sm font-medium">
            <Heart size={16} className={favCount > 0 ? 'fill-red-500' : ''} /> Favorites {favCount > 0 && `(${favCount})`}
          </Link>
          <Link to="/compare" className="flex items-center gap-2 bg-white dark:bg-slate-800 text-blue-600 px-4 py-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition text-sm font-medium">
            <Scale size={16} /> Compare
          </Link>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 hover:shadow-xl transition flex items-center justify-center"
        aria-label="Quick actions"
      >
        {open ? <X size={24} /> : <Heart size={24} />}
      </button>
    </div>
  );
}