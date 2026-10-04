import { useApi } from "../hooks/useApi";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { Badge } from "../components/Badge";
import type { JobPosting, PostingsResponse } from "../api/types";

const COLUMNS = [
  "no_application", "draft", "ready", "applied", "screening",
  "interviewing", "offer", "accepted", "rejected", "withdrawn",
];

function latestStatus(posting: JobPosting): string {
  return posting.applications?.[0]?.status ?? "no_application";
}

function formatSalary(posting: JobPosting): string | null {
  if (!posting.salary_min && !posting.salary_max) return null;
  const currency = posting.salary_currency ?? "";
  const min = posting.salary_min?.toLocaleString();
  const max = posting.salary_max?.toLocaleString();
  if (min && max) return `${currency} ${min}–${max}`;
  return `${currency} ${min ?? max}`;
}

function PostingCard({ posting }: { posting: JobPosting }) {
  const salary = formatSalary(posting);
  return (
    <a
      href={posting.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="font-medium text-slate-900 dark:text-slate-100">{posting.title ?? "Untitled role"}</div>
      <div className="text-slate-500 dark:text-slate-400">{posting.companies?.name ?? "Unknown company"}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {posting.priority && <Badge value={posting.priority} />}
        {posting.source && <Badge value={posting.source} label={posting.source} />}
      </div>
      {salary && <div className="mt-2 text-xs text-slate-400">{salary}</div>}
    </a>
  );
}

export function PostingsBoard() {
  const { status, data, error, refetch } = useApi<PostingsResponse>("/postings");

  if (status === "loading") return <Spinner />;
  if (status === "error") return <ErrorBanner message={error} retry={refetch} />;

  const byColumn = new Map<string, JobPosting[]>();
  for (const col of COLUMNS) byColumn.set(col, []);
  for (const posting of data.job_postings) {
    const col = latestStatus(posting);
    if (!byColumn.has(col)) byColumn.set(col, []);
    byColumn.get(col)!.push(posting);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.filter((col) => byColumn.get(col)!.length > 0).map((col) => (
        <div key={col} className="w-64 shrink-0">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {col.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400">{byColumn.get(col)!.length}</span>
          </div>
          <div className="space-y-2">
            {byColumn.get(col)!.map((posting) => (
              <PostingCard key={posting.id} posting={posting} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
