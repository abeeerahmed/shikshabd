import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Network } from '@capacitor/network';
import { BackToTop } from './components/BackToTop';
import { GraduationCap, Users, BarChart3, Search as SearchIcon, Home as HomeIcon, Menu, X, Moon, Sun } from 'lucide-react';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Institutes = lazy(() => import('./pages/Institutes').then((m) => ({ default: m.Institutes })));
const InstituteDetail = lazy(() => import('./pages/InstituteDetail').then((m) => ({ default: m.InstituteDetail })));
const Teachers = lazy(() => import('./pages/Teachers').then((m) => ({ default: m.Teachers })));
const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })));
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const Compare = lazy(() => import('./pages/Compare').then((m) => ({ default: m.Compare })));
const Map = lazy(() => import('./pages/Map').then((m) => ({ default: m.Map })));

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const links = [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/institutes', label: 'Institutes', icon: GraduationCap },
    { to: '/teachers', label: 'Teachers', icon: Users },
    { to: '/stats', label: 'Stats', icon: BarChart3 },
    { to: '/search', label: 'Search', icon: SearchIcon },
    { to: '/map', label: 'Map', icon: SearchIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="ShikshaBD" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-lg text-[var(--color-text)]">ShikshaBD</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-red-600 text-white' : 'text-[var(--color-muted)] hover:text-red-600'
                }`
              }
            >
              ♥
            </NavLink>
            <button
              onClick={() => setDark(!dark)}
              className="ml-2 p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="p-1.5 text-[var(--color-muted)]" aria-label="Toggle dark mode">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 text-[var(--color-muted)]" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1 border-t border-[var(--color-border)] pt-3">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-emerald-700 text-white' : 'text-[var(--color-muted)]'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <NavLink to="/favorites" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-[var(--color-muted)]">
              Favorites
            </NavLink>
            <NavLink to="/compare" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-[var(--color-muted)]">
              Compare
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function NetworkBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    Network.getStatus().then((s) => setOffline(!s.connected));
    const handle = Network.addListener('networkStatusChange', (s) => setOffline(!s.connected));
    return () => { handle.then((h) => h.remove()); };
  }, []);
  if (!offline) return null;
  return (
    <div className="bg-amber-500 text-white text-center text-sm py-2 px-4">
      ⚠️ You are offline. Some features may not work.
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Suspense fallback={<Loading />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/institutes" element={<Institutes />} />
            <Route path="/institutes/:eiin" element={<InstituteDetail />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/search" element={<Search />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/map" element={<Map />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <NetworkBanner />
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <AnimatedRoutes />
        </main>
        <BackToTop />
      </div>
    </BrowserRouter>
  );
}