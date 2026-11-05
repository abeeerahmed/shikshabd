// Approximate center coordinates for Bangladesh districts
export const districtCoords: Record<string, [number, number]> = {
  'Barguna': [22.16, 90.12], 'Barishal': [22.70, 90.37], 'Bhola': [22.69, 90.65],
  'Jhalokati': [22.64, 90.20], 'Patuakhali': [22.36, 90.33], 'Pirojpur': [22.58, 89.98],
  'Bandarban': [22.19, 92.22], 'Brahmanbaria': [23.96, 91.11], 'Chandpur': [23.23, 90.65],
  'Chattogram': [22.36, 91.78], 'Comilla': [23.46, 91.18], "Cox's Bazar": [21.43, 92.01],
  'Feni': [23.02, 91.40], 'Khagrachhari': [23.11, 91.98], 'Lakshmipur': [22.94, 90.83],
  'Noakhali': [22.87, 91.10], 'Rangamati': [22.73, 92.20],
  'Dhaka': [23.81, 90.41], 'Faridpur': [23.61, 89.84], 'Gazipur': [23.99, 90.42],
  'Gopalganj': [23.01, 89.83], 'Kishoreganj': [24.43, 90.78], 'Madaripur': [23.17, 90.20],
  'Manikganj': [23.86, 90.00], 'Munshiganj': [23.54, 90.53], 'Narayanganj': [23.62, 90.50],
  'Narsingdi': [23.92, 90.72], 'Rajbari': [23.76, 89.65], 'Shariatpur': [23.24, 90.42],
  'Tangail': [24.25, 89.92],
  'Bagerhat': [22.65, 89.79], 'Chuadanga': [23.64, 88.86], 'Jessore': [23.17, 89.21],
  'Jhenaidah': [23.54, 89.17], 'Khulna': [22.85, 89.54], 'Kushtia': [23.90, 89.12],
  'Magura': [23.49, 89.42], 'Meherpur': [23.76, 88.63], 'Narail': [23.17, 89.51],
  'Satkhira': [22.72, 89.07],
  'Jamalpur': [24.92, 89.95], 'Mymensingh': [24.75, 90.41], 'Netrokona': [24.88, 90.73],
  'Sherpur': [25.02, 90.02],
  'Bogura': [24.85, 89.37], 'Chapainawabganj': [24.59, 88.28], 'Joypurhat': [25.10, 89.02],
  'Naogaon': [24.81, 88.93], 'Natore': [24.41, 89.00], 'Pabna': [24.01, 89.24],
  'Rajshahi': [24.37, 88.60], 'Sirajganj': [24.45, 89.71],
  'Dinajpur': [25.63, 88.64], 'Gaibandha': [25.33, 89.54], 'Kurigram': [25.81, 89.64],
  'Lalmonirhat': [25.92, 89.45], 'Nilphamari': [25.93, 88.86], 'Panchagarh': [26.33, 88.56],
  'Rangpur': [25.74, 89.25], 'Thakurgaon': [26.03, 88.47],
  'Habiganj': [24.38, 91.42], 'Moulvibazar': [24.48, 91.77], 'Sunamganj': [25.07, 91.40],
  'Sylhet': [24.90, 91.87],
};

const _aliases: Record<string, string> = {
  'chittagong': 'Chattogram', 'cumilla': 'Comilla', 'comilla': 'Comilla',
  'jashore': 'Jessore', 'bogra': 'Bogura', 'barisal': 'Barishal',
  'coxs bazar': "Cox's Bazar", "cox's bazar": "Cox's Bazar",
  'sirajgonj': 'Sirajganj', 'netrakona': 'Netrokona', 'hobigonj': 'Habiganj',
  'brahmonbaria': 'Brahmanbaria', 'moulavibazar': 'Moulvibazar', 'mymensing': 'Mymensingh',
  'sunamgonj': 'Sunamganj', 'gopalgonj': 'Gopalganj', 'luxmipur': 'Lakshmipur',
  'chapai nawabgonj': 'Chapainawabganj', 'manikgonj': 'Manikganj', 'munshigonj': 'Munshiganj',
  'jhalokathi': 'Jhalokati', 'narayangonj': 'Narayanganj', 'brahamanbaria': 'Brahmanbaria',
  'kishorgonj': 'Kishoreganj', 'nawabganj': 'Chapainawabganj', 'jaipurhat': 'Joypurhat',
  'nawgaon': 'Naogaon', 'nator': 'Natore',
};

export function normalizeDistrict(name: string): string {
  if (!name) return name;
  const key = name.trim().toLowerCase();
  // case-insensitive match to canonical
  for (const c of Object.keys(districtCoords)) {
    if (c.toLowerCase() === key) return c;
  }
  if (_aliases[key]) return _aliases[key];
  return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
}

export function getCoords(district: string, _thana?: string): [number, number] {
  const nd = normalizeDistrict(district);
  const base = districtCoords[nd] || [23.685, 90.356];
  // Add small random offset to avoid all markers overlapping
  return [base[0] + (Math.random() - 0.5) * 0.05, base[1] + (Math.random() - 0.5) * 0.05];
}