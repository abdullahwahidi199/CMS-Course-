import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Download, FileSpreadsheet, FileText, Printer, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import instance from "../../../api/axiosInstance";
import DataTable from "../../shared/DataTable";
import PageHeader from "../../shared/PageHeader";
import StatCard from "../../shared/StatCard";
import { useApiResource } from "../../../hooks/useApiResource";
import { useCalendar } from "../../../hooks/useCalendar";
import { CalendarDateRangePicker } from "../../shared/CalendarDatePicker";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Field({ label, children }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return <input {...props} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600" />;
}

function Select(props) {
  return <select {...props} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600" />;
}

async function downloadFile(endpoint, filename) {
  const response = await instance.get(endpoint, { responseType: "blob" });
  const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function chartData(series, label) {
  return {
    labels: (series || []).map((row) => row.label || row.department || row.category || row.payment_date__year || "Unknown"),
    datasets: [
      {
        label,
        data: (series || []).map((row) => Number(row.value || 0)),
        borderColor: "#0e7490",
        backgroundColor: "#67e8f9",
      },
    ],
  };
}

export default function ReportDashboard({ config }) {
  const calendar = useCalendar(config.calendarModule || config.slug || "reports");
  const [filters, setFilters] = useState(config.initialFilters || {});
  const [applied, setApplied] = useState(config.initialFilters || {});
  const params = useMemo(() => ({
    page_size: 100,
    ...Object.fromEntries(Object.entries(applied).filter(([, value]) => value !== "" && value !== null && value !== undefined)),
  }), [applied]);
  const report = useApiResource(config.endpoint, { params });

  const rows = report.results;
  const summary = report.data?.summary || {};
  const charts = report.data?.charts || {};
  const primaryChart = charts[config.chartKey] || Object.values(charts)[0] || [];

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const exportEndpoint = (format) => `${config.endpoint}?${new URLSearchParams({ ...params, export: format }).toString()}`;

  const actions = (
    <>
      <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700" onClick={() => report.refetch()}>
        <RefreshCcw size={16} /> Refresh
      </button>
      <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700" onClick={() => downloadFile(exportEndpoint("csv"), `${config.slug}.csv`)}>
        <Download size={16} /> CSV
      </button>
      <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700" onClick={() => downloadFile(exportEndpoint("excel"), `${config.slug}.xls`)}>
        <FileSpreadsheet size={16} /> Excel
      </button>
      <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700" onClick={() => downloadFile(exportEndpoint("pdf"), `${config.slug}.pdf`)}>
        <FileText size={16} /> PDF
      </button>
      <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white" onClick={() => window.print()}>
        <Printer size={16} /> Print
      </button>
    </>
  );

  return (
    <div className="report-print space-y-6">
      <PageHeader title={config.title} description={config.description} actions={actions} />

      <div className="text-sm text-gray-500">
        Reports / {config.title}
        {report.data?.last_generated ? <span className="ml-3">Last generated: {calendar.formatDateTime(report.data.last_generated)}</span> : null}
      </div>

      <section className="rounded-md bg-white p-4 shadow-sm print:hidden">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <SlidersHorizontal size={16} /> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {config.dateFilter !== false ? (
            <div className="md:col-span-2">
              <CalendarDateRangePicker
                module={config.calendarModule || config.slug || "reports"}
                startLabel={config.startLabel || "Start date"}
                endLabel={config.endLabel || "End date"}
                startValue={filters.start_date || ""}
                endValue={filters.end_date || ""}
                onStartChange={(value) => setFilter("start_date", value)}
                onEndChange={(value) => setFilter("end_date", value)}
              />
            </div>
          ) : null}
          {config.filters.map((filter) => (
            <Field key={filter.key} label={filter.label}>
              {filter.type === "select" ? (
                <Select value={filters[filter.key] || ""} onChange={(event) => setFilter(filter.key, event.target.value)}>
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              ) : (
                <Input value={filters[filter.key] || ""} onChange={(event) => setFilter(filter.key, event.target.value)} placeholder={filter.placeholder || filter.label} />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => setApplied(filters)}>Apply filters</button>
          <button className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700" onClick={() => { setFilters(config.initialFilters || {}); setApplied(config.initialFilters || {}); }}>Reset</button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {config.stats.map((stat) => (
          <StatCard key={stat.key} title={stat.label} value={stat.format === "money" ? money(summary[stat.key]) : summary[stat.key]} accent={stat.accent} />
        ))}
      </div>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">{config.chartTitle}</h2>
        {primaryChart.length ? (
          config.chartType === "line" ? <Line data={chartData(primaryChart, config.chartTitle)} /> : <Bar data={chartData(primaryChart, config.chartTitle)} />
        ) : (
          <p className="py-10 text-center text-sm text-gray-500">No analytics data for the selected filters.</p>
        )}
      </section>

      <DataTable title={config.tableTitle || config.title} columns={config.columns} rows={rows} loading={report.loading} error={report.error} empty="No report data found." pageSize={Number(report.data?.page_size || 25)} calendarModule={config.calendarModule || config.slug || "reports"} />
    </div>
  );
}
