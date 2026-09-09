export function PageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-bark-500">
        <div className="h-8 w-8 rounded-full border-4 border-sand-300 border-t-euc-500 animate-spin" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}
