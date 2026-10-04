import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { Badge } from "../components/Badge";
import type { ContactsResponse } from "../api/types";

const ROLES = ["recruiter", "hiring_manager", "referral", "interviewer", "other"];

export function Contacts() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const { status, data, error, refetch } = useApi<ContactsResponse>("/contacts", {
    query: query || undefined,
    role_in_process: role,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={() => setRole(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !role
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          All roles
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              role === r
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {r.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorBanner message={error} retry={refetch} />}
      {status === "success" && data.contacts.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No contacts match this search.</p>
      )}
      {status === "success" && data.contacts.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {data.contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{c.name}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  {[c.title, c.companies?.name].filter(Boolean).join(" · ") || "—"}
                </div>
                {c.last_contacted && (
                  <div className="text-xs text-slate-400">
                    Last contacted {new Date(c.last_contacted).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {c.role_in_process && <Badge value={c.role_in_process} />}
                {c.linkedin_url && (
                  <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                    LinkedIn
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
