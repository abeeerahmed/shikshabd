import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { institutesApi } from '../api/client';
import { ArrowLeft, MapPin, Mail, Phone, Building2, Users, Award, X } from 'lucide-react';

export function Compare() {
  const [params] = useSearchParams();
  const eiins = (params.get('eiins') || '').split(',').filter(Boolean);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eiins.length === 0) { setLoading(false); return; }
    Promise.all(eiins.map((e) => institutesApi.detail(e).then((r) => r.data.institute).catch(() => null)))
      .then((results) => { setInstitutes(results.filter(Boolean)); setLoading(false); });
  }, [eiins.join(',')]);

  const remove = (eiin: string) => {
    setInstitutes((prev) => prev.filter((i) => i.eiin_or_code !== eiin));
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;
  if (institutes.length === 0) return (
    <div className="text-center py-20">
      <p className="text-[var(--color-muted)]">No institutes selected for comparison.</p>
      <Link to="/institutes" className="text-emerald-700 hover:underline mt-2 inline-block">Browse Institutes →</Link>
    </div>
  );

  const rows = [
    { label: 'Name', key: 'institute_name' },
    { label: 'ID', key: 'eiin_or_code' },
    { label: 'Level', key: 'level' },
    { label: 'Division', key: 'division' },
    { label: 'District', key: 'district' },
    { label: 'Upazila', key: 'upazila' },
    { label: 'Type', key: 'institute_type' },
    { label: 'Management', key: 'management' },
    { label: 'Email', key: 'email' },
    { label: 'Mobile', key: 'mobile' },
    { label: 'MPO Status', key: 'is_mpo' },
    { label: 'Education Level', key: 'education_level' },
    { label: 'Area', key: 'area_status' },
    { label: 'Student Type', key: 'student_type' },
    { label: 'Affiliation', key: 'affiliation' },
    { label: 'Teachers', key: 'teacher_count' },
    { label: 'Primary Teachers', key: 'total_teacher' },
    { label: 'Primary Students', key: 'total_student' },
    { label: 'Geo Status', key: 'geo_status' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">Compare Institutes</h1>
        <Link to="/institutes" className="text-sm text-emerald-700 hover:underline">← Back to Institutes</Link>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)]">
              <th className="py-3 px-4 text-left text-[var(--color-muted)] font-medium w-32 sticky left-0 bg-[var(--color-surface)]">Field</th>
              {institutes.map((inst) => (
                <th key={inst.eiin_or_code} className="py-3 px-4 text-left min-w-[200px]">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/institutes/${inst.eiin_or_code}`} className="font-semibold text-[var(--color-text)] hover:text-emerald-700 transition-colors">
                      {inst.institute_name}
                    </Link>
                    <button onClick={() => remove(inst.eiin_or_code)} className="text-slate-400 hover:text-red-500 shrink-0" title="Remove">
                      <X size={14} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, key }) => (
              <tr key={key} className="border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/20 transition">
                <td className="py-2.5 px-4 font-medium text-[var(--color-muted)] text-xs sticky left-0 bg-[var(--color-surface)]">{label}</td>
                {institutes.map((inst) => (
                  <td key={inst.eiin_or_code} className="py-2.5 px-4 text-[var(--color-text)] text-xs">
                    {inst[key] != null && inst[key] !== '' ? String(inst[key]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {institutes.length < 3 && (
        <p className="text-sm text-[var(--color-muted)] text-center">
          You can compare up to 3 institutes. <Link to="/institutes" className="text-emerald-700 hover:underline">Add more →</Link>
        </p>
      )}
    </div>
  );
}