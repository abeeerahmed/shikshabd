import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="back-to-top visible fixed bottom-24 right-6 z-40 w-10 h-10 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 transition flex items-center justify-center no-print"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}