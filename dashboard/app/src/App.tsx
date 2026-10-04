import { useState } from "react";
import { PipelineOverview } from "./views/PipelineOverview";
import { PostingsBoard } from "./views/PostingsBoard";
import { NetworkingQueue } from "./views/NetworkingQueue";
import { UpcomingInterviews } from "./views/UpcomingInterviews";
import { Contacts } from "./views/Contacts";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "postings", label: "Postings" },
  { key: "networking", label: "Networking" },
  { key: "interviews", label: "Interviews" },
  { key: "contacts", label: "Contacts" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function App() {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold">Job Hunt Dashboard</h1>
        <nav className="mt-3 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-6">
        {tab === "overview" && <PipelineOverview />}
        {tab === "postings" && <PostingsBoard />}
        {tab === "networking" && <NetworkingQueue />}
        {tab === "interviews" && <UpcomingInterviews />}
        {tab === "contacts" && <Contacts />}
      </main>
    </div>
  );
}

export default App;
