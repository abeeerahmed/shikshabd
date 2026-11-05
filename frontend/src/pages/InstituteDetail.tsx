import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { institutesApi, searchApi } from '../api/client';
import { ArrowLeft, MapPin, Mail, Building2, Users, Award, BookOpen, Share2, Check, Printer, Phone, Star } from 'lucide-react';
import { ReviewSection } from '../components/ReviewSection';

function serviceYears(dateStr: string): string {
  if (!dateStr) return '—';
  const m = String(dateStr).match(/(\d{4})/);
  if (!m) return '—';
  const yr = parseInt(m[1], 10);
  const now = new Date().getFullYear();
  if (yr < 1900 || yr > now) return '—';
  return String(now - yr);
}

export function InstituteDetail() {
  const { eiin } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'teachers' | 'location' | 'reviews'>('overview');
  const [copied, setCopied] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [similar, setSimilar] = useState<any[]>([]);

  useEffect(() => {
    if (eiin) {
      institutesApi.detail(eiin).then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
      // Fetch similar institutes
      searchApi.similar(eiin).then((r) => setSimilar(r.data)).catch(() => {});
    }
  }, [eiin]);

  const share = async () => {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: data?.institute?.institute_name, url: window.location.href });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;
  if (!data || data.error) return <div className="text-center py-20 text-red-500">Institute not found</div>;

  const inst = data.institute;
  const teachers = data.teachers || [];
  const byDesignation = data.by_designation || [];
  const filteredTeachers = teacherSearch
    ? teachers.filter((t: any) => t.teacher_name?.toLowerCase().includes(teacherSearch.toLowerCase()) || t.designation?.toLowerCase().includes(teacherSearch.toLowerCase()))
    : teachers;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link to="/" className="hover:text-emerald-700">Home</Link>
        <span>/</span>
        <Link to="/institutes" className="hover:text-emerald-700">Institutes</Link>
        <span>/</span>
        <span className="text-[var(--color-text)] truncate max-w-[200px]">{inst.institute_name}</span>
      </nav>

      <Link to="/institutes" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium">
        <ArrowLeft size={18} /> Back to Institutes
      </Link>

      <div className="card p-6 md:p-8">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg md:text-2xl font-bold text-[var(--color-text)] leading-tight flex-1 min-w-0">{inst.institute_name}</h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={share} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] transition text-[var(--color-muted)]" title="Share">
                {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
              </button>
              <button onClick={() => window.print()} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] transition text-[var(--color-muted)]" title="Print">
                <Printer size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-muted)]">ID: {inst.eiin_or_code}</span>
            <span className="text-xs text-[var(--color-muted)]">·</span>
            <span className="text-xs text-[var(--color-muted)]">{inst.id_type}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${inst.level === 'Primary' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {inst.level}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-6 border-b border-[var(--color-border)] overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${tab === 'overview' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('teachers')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${tab === 'teachers' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            <Users size={16} /> Teachers {teachers.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full dark:bg-emerald-900/30">{teachers.length}</span>}
          </button>
          <button
            onClick={() => setTab('location')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${tab === 'location' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            <MapPin size={16} /> Location
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${tab === 'reviews' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            <Star size={16} /> Reviews
          </button>
        </div>
      </div>

      {tab === 'overview' && (
        <div className="card p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow icon={MapPin} label="Location" value={`${inst.upazila || ''}, ${inst.district || ''}, ${inst.division || ''}`} />
            <InfoRow icon={Building2} label="Type" value={inst.institute_type} />
            <InfoRow icon={Users} label="Management" value={inst.management} />
            <InfoRow icon={Mail} label="Email" value={inst.email} />
            {inst.mobile && <InfoRow icon={Phone} label="Mobile" value={inst.mobile} />}
            {inst.address && <InfoRow icon={MapPin} label="Address" value={inst.address} />}
            {inst.geo_status && <InfoRow icon={MapPin} label="Geo Status" value={inst.geo_status} />}
            {inst.student_type && <InfoRow icon={Users} label="Student Type" value={inst.student_type} />}
            {inst.affiliation && <InfoRow icon={Award} label="Affiliation" value={inst.affiliation} />}
            <InfoRow icon={Award} label="MPO Status" value={inst.is_mpo} />
            <InfoRow icon={BookOpen} label="Education Level" value={inst.education_level} />
            {inst.total_teacher != null && <InfoRow icon={Users} label="Teachers (Primary)" value={String(inst.total_teacher)} />}
            {inst.total_student != null && <InfoRow icon={Users} label="Students (Primary)" value={String(inst.total_student)} />}
            {inst.area_status && <InfoRow icon={MapPin} label="Area" value={inst.area_status} />}
            {inst.union_name && <InfoRow icon={MapPin} label="Union" value={inst.union_name} />}
          </div>
          {teachers.length === 0 && inst.level === 'Post-Primary' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
              No teacher records found for this institute. Teacher data is available for {(28691).toLocaleString()} MPO-registered institutes.
            </div>
          )}

          {/* Similar Institutes */}
          {similar.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-3">Similar Institutes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {similar.map((s: any) => (
                  <Link key={s.eiin_or_code} to={`/institutes/${s.eiin_or_code}`} className="p-3 rounded-lg border border-[var(--color-border)] hover:border-emerald-500 transition text-sm">
                    <p className="font-medium text-[var(--color-text)] truncate">{s.institute_name}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">{s.district}, {s.division} · {s.institute_type}</p>
                    {s.teacher_count > 0 && <p className="text-xs text-blue-600 mt-1">{s.teacher_count} teachers</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="card p-6 md:p-8">
          <ReviewSection eiin={inst.eiin_or_code} />
        </div>
      )}

      {tab === 'location' && (
        <div className="card p-6 md:p-8 space-y-4">
          <div className="h-[400px] rounded-xl overflow-hidden border border-[var(--color-border)]">
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(inst.upazila + ', ' + inst.district + ', ' + inst.division + ', Bangladesh')}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inst.upazila + ', ' + inst.district + ', ' + inst.division + ', Bangladesh')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 transition"
            >
              📍 Open in Google Maps
            </a>
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(inst.upazila + ', ' + inst.district + ', ' + inst.division + ', Bangladesh')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition"
            >
              📷 Street View
            </a>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            Location is approximate (based on address). Google Maps provides satellite and street views.
          </p>
        </div>
      )}

      {tab === 'teachers' && (
        <div className="card p-6 md:p-8">
          {teachers.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-muted)]">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p>No teacher records available for this institute.</p>
            </div>
          ) : (
            <>
              {/* Designation summary */}
              {byDesignation.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {byDesignation.map((d: any) => (
                    <span key={d.designation} className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {d.designation}: {d.count}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <input
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Search teachers by name or designation..."
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:border-emerald-500 outline-none bg-[var(--color-surface)] text-[var(--color-text)]"
                />
                <span className="text-sm text-[var(--color-muted)] whitespace-nowrap">{filteredTeachers.length} of {teachers.length}</span>
              </div>
              <div className="overflow-x-auto -mx-6 md:mx-0">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Date of Birth</th>
                      <th className="py-3 px-4">First Joining</th>
<th className="py-3 px-4">Service (yrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t: any, i: number) => (
                      <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/30 transition">
                        <td className="py-3 px-4 text-[var(--color-muted)]">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-[var(--color-text)]">{t.teacher_name}</td>
                        <td className="py-3 px-4 text-[var(--color-muted)]">{t.designation}</td>
                        <td className="py-3 px-4 text-[var(--color-muted)] text-xs">{t.date_of_birth}</td>
                        <td className="py-3 px-4 text-[var(--color-muted)] text-xs">{t.first_joining_date}</td>
<td className="py-3 px-4 text-[var(--color-muted)] text-xs">{serviceYears(t.first_joining_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--color-text)]">{String(value)}</p>
      </div>
    </div>
  );
}