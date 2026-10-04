import { useApi } from "../hooks/useApi";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { Badge } from "../components/Badge";
import { StatTile } from "../components/StatTile";
import type { NetworkingQueueResponse } from "../api/types";

export function NetworkingQueue() {
  const { status, data, error, refetch } = useApi<NetworkingQueueResponse>("/networking-queue");

  if (status === "loading") return <Spinner />;
  if (status === "error") return <ErrorBanner message={error} retry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(data.by_status).map(([status, count]) => (
          <StatTile key={status} label={status.replace(/_/g, " ")} value={count} />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Posting</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Networking status</th>
              <th className="px-4 py-2 font-medium">Contacts</th>
              <th className="px-4 py-2 font-medium">Network conn.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.postings.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
                    {p.title ?? "Untitled role"}
                  </a>
                  <div className="text-slate-500 dark:text-slate-400">{p.companies?.name ?? "Unknown company"}</div>
                </td>
                <td className="px-4 py-3">{p.priority ? <Badge value={p.priority} /> : "—"}</td>
                <td className="px-4 py-3"><Badge value={p.networking_status} /></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.contact_count}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {p.has_network_connections === null ? "—" : p.has_network_connections ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
