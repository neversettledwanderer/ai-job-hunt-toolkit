export interface PipelineOverview {
  total_applications: number;
  status_breakdown: Record<string, number>;
  upcoming_interviews_count: number;
  upcoming_interviews: UpcomingInterview[];
}

export interface Application {
  id: string;
  status: string;
  applied_date: string | null;
  resume_path: string | null;
  cover_letter_path: string | null;
  created_by: string;
}

export interface JobPosting {
  id: string;
  title: string | null;
  url: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  source: string | null;
  priority: string | null;
  status: string;
  companies: { name: string } | null;
  applications: Application[];
}

export interface PostingsResponse {
  count: number;
  job_postings: JobPosting[];
}

export interface NetworkingPosting {
  id: string;
  title: string | null;
  url: string;
  location: string | null;
  priority: string | null;
  triage_rank: number | null;
  networking_status: string;
  has_network_connections: boolean | null;
  contact_count: number;
  companies: { name: string } | null;
  applications: { id: string; status: string }[];
}

export interface NetworkingQueueResponse {
  total: number;
  by_status: Record<string, number>;
  postings: NetworkingPosting[];
}

export interface UpcomingInterview {
  id: string;
  interview_type: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  interviewer_name: string | null;
  interviewer_title: string | null;
  applications: {
    job_postings: {
      title: string | null;
      companies: { name: string } | null;
    };
  };
}

export interface InterviewsResponse {
  count: number;
  interviews: UpcomingInterview[];
}

export interface JobContact {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  role_in_process: string | null;
  notes: string | null;
  last_contacted: string | null;
  companies: { name: string } | null;
}

export interface ContactsResponse {
  count: number;
  contacts: JobContact[];
}
