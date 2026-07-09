import FeesPanel from "../panel/FeesPanel";
import StudentPageShell from "./StudentPageShell";

export default function FeesPage() {
  return (
    <StudentPageShell title="Fees & Payments" description="Invoices, payments, due dates, and account balance.">
      <FeesPanel />
    </StudentPageShell>
  );
}
