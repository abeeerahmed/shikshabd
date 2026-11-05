import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { institutesApi } from '../api/client';
import { ArrowLeft } from 'lucide-react';

export function Compare() {
  const [searchParams] = useSearchParams();
  const eiins = (searchParams.get('eiins') || '').split(',').filter(Boolean);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eiins.length === 0) { setLoading(false); return; }
    Promise.all(eiins.map((e) => institutesApi.detail(e).then((r) => r.data.institute).catch(() => null)))
      .then((results) => { setInstitutes(results.filter(Boolean)); setLoading(false); });
  }, [eiins.join(',')]);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;

  const fields = [
    { key: 'institute_name', label: 'Name' },
    { key: 'eiin_or_code', label: 'ID' },
    { key: 'level', label: 'Level' },
    { key: 'division', label: 'Division' },
    { key: 'district', label: 'District' },
    { key: 'upazila', label: 'Upazila' },
    { key: 'institute_type', label: 'Type' },
    { key: 'management', label: 'Management' },
    { key: 'is_mpo', label: 'MPO' },
    { key: 'email', label: 'Email' },
    { key: 'education_level', label: 'Education Level' },
    { key: 'area_status', label: 'Area' },
    { key: 'total_teacher', label: 'Teachers (IPEMIS)' },
    { key: 'total_student', label: 'Students (IPEMIS)' },
  ];

  return (
    <div className="space-y-6">
      <Link to="/institutes" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium">
        <ArrowLeft size={18} /> Back to Institutes
      </Link>
      <h1 className="text-3xl font-bold text-slate-800">Compare Institutes</h1>

      {institutes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500">No institutes selected for comparison.</p>
          <p className="text-slate-400 text-sm mt-2">Add institutes from the institutes page using the compare button.</p>
          <Link to="/institutes" className="inline-block mt-4 text-emerald-700 font-medium hover:underline">Browse Institutes →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-left text-slate-500 font-medium bg-slate-50 w-40">Field</th>
                {institutes.map((inst) => (
                  <th key={inst.eiin_or_code} className="py-3 px-4 text-left text-slate-800 font-semibold min-w-[200px]">
                    {inst.institute_name}
                    <div className="text-xs text-slate-400 font-normal mt-1">{inst.eiin_or_code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map(({ key, label }) => (
                <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-600 bg-slate-50">{label}</td>
                  {institutes.map((inst) => (
                    <td key={inst.eiin_or_code} className="py-3 px-4 text-slate-800">
                      {inst[key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 font-medium text-slate-600 bg-slate-50">Teachers</td>
                {institutes.map((inst) => (
                  <td key={inst.eiin_or_code} className="py-3 px-4">
                    <span className="text-blue-700 font-medium">{inst.teacher_count ?? 0} scraped</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}