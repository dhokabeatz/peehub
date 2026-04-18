export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-100" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}
