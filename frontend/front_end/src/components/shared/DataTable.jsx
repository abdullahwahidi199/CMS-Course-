import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";

function valueFor(row, column) {
  return column.accessor ? column.accessor(row) : row[column.key];
}

function exportCsv(columns, rows, filename) {
  const headers = columns.map((column) => column.label);
  const lines = rows.map((row) =>
    columns
      .map((column) => `"${String(valueFor(row, column) ?? "").replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DataTable({
  columns,
  rows,
  loading,
  error,
  empty = "No records found",
  title = "Records",
  actions,
  bulkActions,
  pageSize = 10,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: columns[0]?.key, direction: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = normalized
      ? rows.filter((row) =>
          columns.some((column) => String(valueFor(row, column) ?? "").toLowerCase().includes(normalized)),
        )
      : rows;
    return [...visible].sort((a, b) => {
      const aValue = valueFor(a, columns.find((column) => column.key === sort.key) || columns[0]);
      const bValue = valueFor(b, columns.find((column) => column.key === sort.key) || columns[0]);
      return String(aValue ?? "").localeCompare(String(bValue ?? ""), undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
    });
  }, [columns, query, rows, sort]);

  const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const selectedRows = rows.filter((row) => selected.includes(row.id));

  const toggleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (loading) {
    return <div className="rounded-md bg-white p-6 text-sm text-gray-500 shadow-sm">Loading...</div>;
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="overflow-hidden rounded-md bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{filteredRows.length} records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-52 items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
            <Search size={16} className="text-gray-400" />
            <input
              className="w-full outline-none"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search"
            />
          </label>
          {bulkActions?.map((action) => (
            <button
              key={action.label}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
              disabled={!selectedRows.length}
              onClick={() => action.onClick(selectedRows)}
            >
              {action.label}
            </button>
          ))}
          <button
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
            onClick={() => exportCsv(columns, filteredRows, `${title.toLowerCase().replaceAll(" ", "-")}.csv`)}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {bulkActions ? (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={pagedRows.length > 0 && pagedRows.every((row) => selected.includes(row.id))}
                    onChange={(event) =>
                      setSelected(event.target.checked ? [...new Set([...selected, ...pagedRows.map((row) => row.id)])] : selected.filter((id) => !pagedRows.some((row) => row.id === id)))
                    }
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-gray-600"
                  onClick={() => toggleSort(column.key)}
                >
                  {column.label}
                  {sort.key === column.key ? <span className="ml-1 text-gray-400">{sort.direction === "asc" ? "↑" : "↓"}</span> : null}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedRows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length + (actions ? 1 : 0) + (bulkActions ? 1 : 0)}>
                  {empty}
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.id || row.receipt_number || row.invoice_number}>
                  {bulkActions ? (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={(event) => setSelected(event.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {column.render ? column.render(row) : valueFor(row, column)}
                    </td>
                  ))}
                  {actions ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {actions(row).map((action) => (
                          <button key={action.label} className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700" onClick={action.onClick}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 p-3 text-sm text-gray-600">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <button className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
