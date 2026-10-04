import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { Badge } from "../components/Badge";
import type { InterviewsResponse } from "../api/types";

const RANGE_OPTIONS = [7, 14, 30];

export function UpcomingInterviews() {
  const [daysAhead, setDaysAhead] = useState(14);
  const { status, data, error, refetch } = useApi<InterviewsResponse>("/interviews", {
    days_ahead: String(daysAhead),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Next</span>
        {RANGE_OPTIONS.map((days) => (
          <button
            key={days}
            onClick={() => setDaysAhead(days)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              daysAhead === days
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {days} days
          </button>
        ))}
      </div>

      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorBanner message={error} retry={refetch} />}
      {status === "success" && data.interviews.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No interviews scheduled in this window.</p>
      )}
      {status === "success" && data.interviews.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {data.interviews.map((iv) => (
            <li key={iv.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {iv.applications?.job_postings?.title ?? "Untitled role"}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {iv.applications?.job_postings?.companies?.name ?? "Unknown company"}
                  {iv.interviewer_name && ` · ${iv.interviewer_name}`}
                  {iv.interviewer_title && ` (${iv.interviewer_title})`}
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                {iv.interview_type && <Badge value={iv.interview_type} />}
                <span>{new Date(iv.scheduled_at).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
