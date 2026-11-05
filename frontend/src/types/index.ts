export interface Institute {
  id?: number;
  institute_name: string;
  institute_name_local?: string;
  eiin_or_code: string;
  id_type?: string;
  level?: string;
  division?: string;
  district?: string;
  upazila?: string;
  union_name?: string;
  institute_type?: string;
  management?: string;
  email?: string;
  is_mpo?: string;
  total_teacher?: number;
  total_student?: number;
  education_level?: string;
  area_status?: string;
  source?: string;
  teacher_count?: number;
}

export interface Teacher {
  id?: number;
  year?: string;
  district?: string;
  upazila?: string;
  eiin: string;
  institute_name?: string;
  institute_type?: string;
  teacher_name: string;
  designation?: string;
  date_of_birth?: string;
  first_joining_date?: string;
  thana?: string;
}

export interface StatsOverview {
  total_institutes: number;
  primary: number;
  post_primary: number;
  teachers_scraped: number;
  schools_with_teacher_data: number;
  primary_teachers_total: number;
  primary_students_total: number;
}

export interface ByType { type: string; count: number; }
export interface ByDivision { division: string; count: number; }
export interface ByLevel { level: string; count: number; }