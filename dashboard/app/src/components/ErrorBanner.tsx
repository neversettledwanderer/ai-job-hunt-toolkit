export function ErrorBanner({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <span>{message}</span>
      <button
        onClick={retry}
        className="shrink-0 rounded-md border border-red-300 px-3 py-1 font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900"
      >
        Retry
      </button>
    </div>
  );
}
