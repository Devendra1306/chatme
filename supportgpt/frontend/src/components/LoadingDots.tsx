export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '0.8s' }}
      />
      <span
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '160ms', animationDuration: '0.8s' }}
      />
      <span
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: '320ms', animationDuration: '0.8s' }}
      />
    </div>
  )
}
