import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '../api/client';
import { Search } from 'lucide-react';

export function Teachers() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [designations, setDesignations] = useState<string[]>([]);
  const [designation, setDesignation] = useState('');

  useEffect(() => { teachersApi.designations().then((r) => setDesignations(r.data)); }, []);

  const { data: result, isLoading: loading } = useQuery({
    queryKey: ['teachers', q, designation, page],
    queryFn: () => teachersApi.list({ q: q || undefined, designation: designation || undefined, page, page_size: 25 }).then((r) => r.data),
  });

  const data = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Teachers</h1>
        <p className="text-slate-500 mt-1">{total.toLocaleString()} teacher records</p>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search teacher or school..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        </div>
        <select value={designation} onChange={(e) => { setDesignation(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white md:w-64">
          <option value="">All Designations</option>
          {designations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 animate-pulse dark:bg-slate-800">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2 dark:bg-slate-700" />
              <div className="h-3 bg-slate-100 rounded w-2/3 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr className="text-left text-slate-500 dark:text-slate-300">
                    <th className="py-3 px-4">Teacher Name</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Institute</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">DOB</th>
                    <th className="py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">{t.teacher_name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.designation}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs dark:text-slate-400">{t.institute_name}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{t.district}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{t.date_of_birth}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{t.first_joining_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.map((t: any, i: number) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-white">{t.teacher_name}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">{t.designation}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t.institute_name}</p>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>{t.district}</span>
                  <span>Joined: {t.first_joining_date}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-sm">Prev</button>
        <span className="text-sm text-slate-600 dark:text-slate-400">Page {page} of {Math.ceil(total / 25)}</span>
        <button onClick={() => setPage((p) => Math.min(Math.ceil(total / 25), p + 1))} disabled={page >= Math.ceil(total / 25)} className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-sm">Next</button>
      </div>
    </div>
  );
}