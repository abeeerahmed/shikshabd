import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL: API_BASE });

export const institutesApi = {
  list: (params: Record<string, any>) => api.get('/institutes', { params }),
  detail: (eiin: string) => api.get(`/institutes/detail/${eiin}`),
  divisions: () => api.get('/institutes/divisions'),
  districts: (division?: string) => api.get('/institutes/districts', { params: { division } }),
  types: () => api.get('/institutes/types'),
  mapData: (params: Record<string, any>) => api.get('/institutes/map-data', { params }),
  byDistrict: (params: Record<string, any>) => api.get('/institutes/by-district', { params }),
  random: () => api.get('/institutes/random'),
};

export const teachersApi = {
  list: (params: Record<string, any>) => api.get('/teachers', { params }),
  designations: () => api.get('/teachers/designations'),
};

export const statsApi = {
  overview: () => api.get('/stats/overview'),
  byType: () => api.get('/stats/by-type'),
  byDivision: () => api.get('/stats/by-division'),
  byLevel: () => api.get('/stats/by-level'),
  topDistricts: () => api.get('/stats/top-districts'),
  teacherDesignations: () => api.get('/stats/teacher-designations'),
  districts: () => api.get('/stats/districts'),
};

export const searchApi = {
  global: (q: string) => api.get('/search', { params: { q } }),
  suggest: (q: string) => api.get('/search/suggest', { params: { q } }),
  similar: (eiin: string) => api.get(`/search/similar/${eiin}`),
};