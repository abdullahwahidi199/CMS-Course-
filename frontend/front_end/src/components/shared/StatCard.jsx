export default function StatCard({ title, value, accent = "border-sky-500", helper }) {
  return (
    <section className={`rounded-md border-l-4 ${accent} bg-white p-4 shadow-sm`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value ?? "0"}</p>
      {helper ? <p className="mt-1 text-xs text-gray-500">{helper}</p> : null}
    </section>
  );
}

