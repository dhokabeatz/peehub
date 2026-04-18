export default function AdminOrderDetailLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-gray-100" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
      <div className="h-48 rounded-xl bg-gray-100" />
    </div>
  )
}
