export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-[3px]' : 'w-7 h-7 border-2';
  return (
    <div className={`${dim} rounded-full border-orange-500 border-t-transparent animate-spin`} />
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[#E5E2DC] rounded-xl animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] p-5 space-y-3">
      <SkeletonBlock className="h-4 w-2/3" />
      <SkeletonBlock className="h-3 w-1/2" />
      <SkeletonBlock className="h-3 w-3/4" />
    </div>
  );
}
