export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-black/5" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-black/5" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-black/5" />
    </div>
  );
}
