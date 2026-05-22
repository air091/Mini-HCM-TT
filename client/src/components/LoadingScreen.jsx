export default function LoadingScreen({ label = "Loading..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
      <div className="flex items-center gap-3 border bg-white px-4 py-3 text-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
        {label}
      </div>
    </div>
  );
}
