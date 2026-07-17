import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCalendar } from "../../hooks/useCalendar";

function valueFor(row, column) {
  return column.accessor ? column.accessor(row) : row[column.key];
}

function isDateColumn(column) {
  return column.type === "date" || /(^date$|_date$|Date$|created_at|updated_at|published_at|submitted_at|read_at|last_login|achieved_on|starts_at|ends_at)/.test(column.key || "");
}

function displayValue(row, column, calendar) {
  const value = valueFor(row, column);
  if (column.render) return column.render(row);
  if (!isDateColumn(column)) return value;
  if (row.calendar_type) return value || "";
  return calendar.formatDateTime(value);
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

function MobileRowCard({ row, columns, actions, bulkActions, selected, setSelected, calendar }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {displayValue(row, columns[0], calendar) || "Record"}
          </p>
          {columns[1] ? <p className="truncate text-xs text-slate-500">{displayValue(row, columns[1], calendar)}</p> : null}
        </div>
        {bulkActions ? (
          <input
            type="checkbox"
            className="mt-1"
            checked={selected.includes(row.id)}
            onChange={(event) => setSelected(event.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))}
            aria-label="Select row"
          />
        ) : null}
      </div>
      <dl className="grid grid-cols-1 gap-2">
        {columns.slice(2).map((column) => (
          <div key={column.key} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2 text-sm">
            <dt className="shrink-0 text-xs font-medium uppercase text-slate-400">{column.label}</dt>
            <dd className="min-w-0 text-right text-slate-700">{displayValue(row, column, calendar)}</dd>
          </div>
        ))}
      </dl>
      {actions ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {actions(row).map((action) => (
            <button key={action.label} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={action.onClick}>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-52 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-3 p-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
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
  calendarModule = "dashboard",
}) {
  const calendar = useCalendar(calendarModule);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: columns[0]?.key, direction: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = normalized
      ? rows.filter((row) => columns.some((column) => String(valueFor(row, column) ?? "").toLowerCase().includes(normalized)))
      : rows;
    return [...visible].sort((a, b) => {
      const sortColumn = columns.find((column) => column.key === sort.key) || columns[0];
      const aValue = valueFor(a, sortColumn);
      const bValue = valueFor(b, sortColumn);
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

  if (loading) return <TableSkeleton />;

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{filteredRows.length} records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-52 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
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
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              disabled={!selectedRows.length}
              onClick={() => action.onClick(selectedRows)}
            >
              {action.label}
            </button>
          ))}
          <button
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => exportCsv(columns, filteredRows, `${title.toLowerCase().replaceAll(" ", "-")}.csv`)}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {pagedRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{empty}</div>
        ) : (
          pagedRows.map((row) => (
            <MobileRowCard
              key={row.id || row.receipt_number || row.invoice_number}
              row={row}
              columns={columns}
              actions={actions}
              bulkActions={bulkActions}
              selected={selected}
              setSelected={setSelected}
              calendar={calendar}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
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
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-600"
                  onClick={() => toggleSort(column.key)}
                >
                  {column.label}
                  {sort.key === column.key ? <span className="ml-1 text-xs text-slate-400">{sort.direction === "asc" ? "Asc" : "Desc"}</span> : null}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedRows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length + (actions ? 1 : 0) + (bulkActions ? 1 : 0)}>
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
                    <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {displayValue(row, column, calendar)}
                    </td>
                  ))}
                  {actions ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {actions(row).map((action) => (
                          <button key={action.label} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={action.onClick}>
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

      <div className="flex items-center justify-between border-t border-slate-100 p-3 text-sm text-slate-600">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <button className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
