export default function AdminOrdersLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-40 rounded bg-gray-100" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}
