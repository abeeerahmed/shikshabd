import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { institutesApi } from '../api/client';
import { districtCoords, normalizeDistrict } from '../data/districtCoords';
import { Layers, Search, Maximize2, Minimize2 } from 'lucide-react';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const typeColors: Record<string, string> = {
  'School': '#047857', 'College': '#2563eb', 'Madrasah': '#7c3aed',
  'School & College': '#0891b2', 'Technical Institute': '#d97706',
  'Government Technical Institute': '#b45309', 'Polytechnic Institute': '#92400e',
  'Technical School & College': '#78350f', 'Public University': '#dc2626',
};

function makeIcon(color: string, label?: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4);${label ? 'display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:bold;' : ''}">${label || ''}</div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Component that renders clustered markers for a list of institutes
function ClusteredMarkers({ institutes }: { institutes: any[] }) {
  const map = useMap();
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });
      map.addLayer(clusterRef.current);
    }
    const group = clusterRef.current;
    group.clearLayers();

    const markers = institutes.map((inst: any) => {
      const coords = districtCoords[normalizeDistrict(inst.district)] || [23.685, 90.356];
      // small jitter
      const lat = coords[0] + (Math.random() - 0.5) * 0.04;
      const lng = coords[1] + (Math.random() - 0.5) * 0.04;
      const color = typeColors[inst.institute_type] || '#6b7280';
      const marker = L.marker([lat, lng], { icon: makeIcon(color) });
      marker.bindPopup(
        `<div style="min-width:180px">
          <strong style="font-size:13px">${inst.institute_name}</strong><br/>
          <span style="font-size:11px;color:#666">${inst.institute_type} · ${inst.district}, ${inst.division}</span><br/>
          <a href="/institutes/${inst.eiin_or_code}" style="font-size:11px;color:#047857;font-weight:600">View details →</a>
        </div>`
      );
      return marker;
    });
    group.addLayers(markers);

    return () => {
      // cleanup on unmount
    };
  }, [institutes, map]);

  useEffect(() => {
    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// Heat map layer
function HeatmapLayer({ districts }: { districts: { district: string; division: string; count: number }[] }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = (L as any).heatLayer([], {
        radius: 40,
        blur: 25,
        maxZoom: 10,
        max: 1.0,
        gradient: { 0.2: '#10b981', 0.4: '#059669', 0.6: '#047857', 0.8: '#065f46', 1.0: '#022c22' },
      }).addTo(map);
    }
    const layer = layerRef.current;
    layer.setLatLngs(
      districts.map((d) => {
        const coords = districtCoords[normalizeDistrict(d.district)];
        if (!coords) return null;
        return [coords[0], coords[1], Math.min(d.count / 5000, 1)];
      }).filter(Boolean)
    );
    return () => {};
  }, [districts, map]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// District aggregation markers
function DistrictMarkers({ districts }: { districts: { district: string; division: string; count: number }[] }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const group = layerRef.current;
    group.clearLayers();

    districts.forEach((d) => {
      const coords = districtCoords[normalizeDistrict(d.district)];
      if (!coords) return;
      const label = d.count >= 1000 ? (Math.round(d.count / 1000) + 'k') : d.count.toLocaleString();
      const size = d.count >= 1000 ? 34 : 28;
      const marker = L.marker(coords, {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:#047857;color:white;font-size:${d.count >= 1000 ? 9 : 10}px;font-weight:700;width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;line-height:1;">${label}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
      });
      marker.bindPopup(
        `<div style="min-width:160px">
          <strong>${d.district}</strong> <span style="font-size:11px;color:#666">(${d.division})</span><br/>
          <span style="font-size:12px">${d.count.toLocaleString()} institutes</span><br/>
          <a href="/institutes?district=${encodeURIComponent(d.district)}" style="font-size:11px;color:#047857;font-weight:600">View all institutes →</a>
        </div>`
      );
      group.addLayer(marker);
    });

    return () => {};
  }, [districts, map]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

export function Map() {
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [districtAgg, setDistrictAgg] = useState<{ district: string; division: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [layer, setLayer] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showLegend, setShowLegend] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mode, setMode] = useState<'districts' | 'institutes'>('districts');

  useEffect(() => {
    institutesApi.divisions().then(() => {}).catch(() => {});
  }, []);

  useEffect(() => {
    if (division) {
      institutesApi.districts(division).then((r) => setDistricts(r.data));
    } else {
      setDistricts([]);
      setDistrict('');
    }
  }, [division]);

  // Fetch data whenever filters change
  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (division) params.division = division;
    if (district) params.district = district;
    if (typeFilter) params.type = typeFilter;

    // Decide mode: if a district is selected, show individual institutes; else aggregate by district
    if (district) {
      setMode('institutes');
      institutesApi.mapData({ ...params, limit: 5000 }).then((r) => {
        setInstitutes(r.data.data || []);
        setTotal(r.data.total || 0);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setMode('districts');
      institutesApi.byDistrict(params).then((r) => {
        setDistrictAgg(r.data || []);
        // total count
        const t = (r.data || []).reduce((s: number, d: any) => s + d.count, 0);
        setTotal(t);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [division, district, typeFilter]);

  const filteredInstitutes = useMemo(() => {
    if (!search) return institutes;
    const q = search.toLowerCase();
    return institutes.filter((i: any) => i.institute_name?.toLowerCase().includes(q));
  }, [institutes, search]);

  const filteredDistricts = useMemo(() => {
    if (!search) return districtAgg;
    const q = search.toLowerCase();
    return districtAgg.filter((d) => d.district.toLowerCase().includes(q));
  }, [districtAgg, search]);

  const divisionCenters: Record<string, [number, number]> = {
    'Barishal': [22.70, 90.37], 'Chattogram': [22.50, 91.80], 'Dhaka': [23.81, 90.41],
    'Khulna': [22.85, 89.54], 'Mymensingh': [24.75, 90.41], 'Rajshahi': [24.37, 88.60],
    'Rangpur': [25.74, 89.25], 'Sylhet': [24.90, 91.87],
  };
  const center: [number, number] = district
    ? (districtCoords[normalizeDistrict(district)] || [23.685, 90.356])
    : division
    ? (divisionCenters[division] || [23.685, 90.356])
    : [23.685, 90.356];
  const zoom = district ? 11 : division ? 8 : 7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Map View</h1>
        <p className="text-[var(--color-muted)] mt-1">
          {mode === 'districts'
            ? `All ${total.toLocaleString()} institutes grouped by district. Click a district to drill down.`
            : `${filteredInstitutes.length.toLocaleString()} of ${total.toLocaleString()} institutes in ${district}`}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institute/district..."
            className="pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:border-emerald-500 outline-none w-48"
          />
        </div>
        <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(''); setSearch(''); }} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)]">
          <option value="">All Divisions</option>
          {['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={district} onChange={(e) => { setDistrict(e.target.value); setSearch(''); }} disabled={!division} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-50">
          <option value="">All Districts (aggregate)</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)]">
          <option value="">All Types</option>
          {Object.keys(typeColors).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {mode === 'institutes' && (
          <button
            onClick={() => { setDistrict(''); }}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            ← All districts
          </button>
        )}
        <button
          onClick={() => setLayer(layer === 'roadmap' ? 'satellite' : 'roadmap')}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <Layers size={14} className="inline mr-1" />
          {layer === 'roadmap' ? 'Satellite' : 'Roadmap'}
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          {showLegend ? 'Hide' : 'Show'} Legend
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3 py-2 rounded-lg border text-sm transition ${showHeatmap ? 'bg-red-600 text-white border-red-600' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          🔥 Heat Map
        </button>
        <span className="text-sm text-[var(--color-muted)] ml-auto">
          {mode === 'districts' ? `${filteredDistricts.length} districts` : `${filteredInstitutes.length} institutes`}
        </span>
      </div>

      <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 p-4' : ''}`}>
        {loading ? (
          <div className="h-[600px] bg-slate-100 rounded-xl animate-pulse dark:bg-slate-700" />
        ) : (
          <div className="h-[600px] rounded-xl overflow-hidden border border-[var(--color-border)] relative">
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url={layer === 'roadmap'
                  ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'}
                attribution={layer === 'roadmap' ? '&copy; OpenStreetMap contributors' : 'Tiles &copy; Esri'}
              />
              {mode === 'districts' && showHeatmap && <HeatmapLayer districts={filteredDistricts} />}
              {mode === 'districts' && !showHeatmap && <DistrictMarkers districts={filteredDistricts} />}
              {mode === 'institutes' && <ClusteredMarkers institutes={filteredInstitutes} />}
            </MapContainer>
            {/* Legend overlay */}
            {showLegend && (
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur p-3 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs max-h-60 overflow-y-auto">
                <p className="font-semibold mb-2 text-slate-800 dark:text-white">
                  {mode === 'districts' ? 'Districts (count)' : 'Institute Types'}
                </p>
                {mode === 'districts' ? (
                  <div className="flex items-center gap-2">
                    <div style={{ background: '#047857', width: 12, height: 12, borderRadius: '50%' }} />
                    <span className="text-slate-600 dark:text-slate-300">Number = institutes in district</span>
                  </div>
                ) : (
                  Object.entries(typeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2 mb-1">
                      <div style={{ background: color, width: 10, height: 10, borderRadius: '50%' }} />
                      <span className="text-slate-600 dark:text-slate-300">{type}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {/* Fullscreen toggle */}
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="absolute top-2 right-2 z-[1000] bg-white/95 dark:bg-slate-800/95 p-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              title="Toggle fullscreen"
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Institute list for selected district */}
      {mode === 'institutes' && filteredInstitutes.length > 0 && filteredInstitutes.length <= 100 && (
        <div className="card p-4">
          <h3 className="font-semibold text-[var(--color-text)] mb-3">Institutes in view ({filteredInstitutes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {filteredInstitutes.map((inst: any) => (
              <a
                key={inst.eiin_or_code}
                href={`/institutes/${inst.eiin_or_code}`}
                className="text-sm text-emerald-700 hover:underline truncate"
              >
                {inst.institute_name}
              </a>
            ))}
          </div>
        </div>
      )}

      {mode === 'institutes' && total > filteredInstitutes.length && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Showing {filteredInstitutes.length.toLocaleString()} of {total.toLocaleString()} institutes. Narrow filters (division/type) to see all.
        </p>
      )}

      <p className="text-xs text-[var(--color-muted)]">
        📍 {mode === 'districts' ? 'Each marker shows the number of institutes in that district. Click a marker for details.' : 'Markers are placed at district centers with clustering. Click a cluster to zoom in.'}
      </p>
    </div>
  );
}