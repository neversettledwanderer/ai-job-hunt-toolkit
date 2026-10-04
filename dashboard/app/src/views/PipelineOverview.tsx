import { useApi } from "../hooks/useApi";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { StatTile } from "../components/StatTile";
import { Badge } from "../components/Badge";
import type { PipelineOverview as PipelineOverviewData } from "../api/types";

const STATUS_ORDER = [
  "draft", "ready", "applied", "screening", "interviewing",
  "offer", "accepted", "rejected", "withdrawn",
];

export function PipelineOverview() {
  const { status, data, error, refetch } = useApi<PipelineOverviewData>("/pipeline-overview");

  if (status === "loading") return <Spinner />;
  if (status === "error") return <ErrorBanner message={error} retry={refetch} />;

  const breakdown = data.status_breakdown ?? {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total applications" value={data.total_applications} />
        <StatTile label="Upcoming interviews" value={data.upcoming_interviews_count} />
        {STATUS_ORDER.filter((s) => breakdown[s] !== undefined).map((s) => (
          <StatTile key={s} label={s.replace(/_/g, " ")} value={breakdown[s]} />
        ))}
      </div>

      {data.upcoming_interviews.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            Next 7 days
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.upcoming_interviews.map((iv) => (
              <li key={iv.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {iv.applications?.job_postings?.title ?? "Untitled role"}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {iv.applications?.job_postings?.companies?.name ?? "Unknown company"}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  {iv.interview_type && <Badge value={iv.interview_type} />}
                  <span>{new Date(iv.scheduled_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
