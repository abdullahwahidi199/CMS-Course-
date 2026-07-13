import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import { PanelShell, StatTile } from "./PanelShell";

const money = (value) => Number(value || 0).toFixed(2);

export default function FeesPanel() {
  const resource = useApiResource("/student/fees/");
  const data = resource.data || {};
  const summary = data.summary || {};
  return (
    <PanelShell title="Fees and Ledger" subtitle="Invoices, payments, and account balance." loading={resource.loading} error={resource.error}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Invoiced" value={money(summary.total_invoiced)} />
        <StatTile label="Discounts" value={money(summary.total_discounts)} />
        <StatTile label="Paid" value={money(summary.total_paid)} />
        <StatTile label="Outstanding" value={money(summary.outstanding)} detail={data.upcoming_due_date ? `Next due ${data.upcoming_due_date}` : ""} />
      </div>
      <DataTable
        title="Invoices"
        rows={data.invoices || []}
        pageSize={5}
        columns={[
          { key: "invoice_number", label: "Invoice" },
          { key: "course", label: "Course" },
          { key: "due_date", label: "Due" },
          { key: "discount", label: "Discount", render: (row) => money(row.discount) },
          { key: "final_amount", label: "Amount", render: (row) => money(row.final_amount) },
          { key: "paid_amount", label: "Paid", render: (row) => money(row.paid_amount) },
          { key: "balance", label: "Balance", render: (row) => money(row.balance) },
          { key: "status", label: "Status" },
        ]}
      />
    </PanelShell>
  );
}
