import { CalendarClock, Loader2, Printer, Save } from "lucide-react";
import { useMemo, useState } from "react";
import instance from "../../api/axiosInstance";
import { addMonths, formatSubscriptionPrice, getRemainingDays, getSubscriptionStatus, statusLabel, toDateInputValue } from "./subscriptionUtils";
import { ConfirmDialog, Modal, SubscriptionBadge } from "./SuperAdminUi";

const quickExtensions = [
  { label: "Extend 1 Month", months: 1 },
  { label: "Extend 3 Months", months: 3 },
  { label: "Extend 6 Months", months: 6 },
  { label: "Extend 1 Year", months: 12 },
];

export default function SubscriptionModal({ tenant, onClose, onSaved }) {
  const [form, setForm] = useState({
    subscription_expiry: toDateInputValue(tenant?.subscription_expiry),
    subscription_price: tenant?.subscription_price ?? "",
    status: getSubscriptionStatus(tenant?.subscription_expiry) === "expired" ? "expired" : "active",
    subscription_notes: tenant?.subscription_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const computedStatus = useMemo(() => getSubscriptionStatus(form.subscription_expiry), [form.subscription_expiry]);
  const remainingDays = useMemo(() => getRemainingDays(form.subscription_expiry), [form.subscription_expiry]);

  const updateExpiry = (value) => {
    const status = getSubscriptionStatus(value);
    setForm((current) => ({ ...current, subscription_expiry: value, status: status === "expired" ? "expired" : "active" }));
  };

  const printBill = () => {
    const billWindow = window.open("", "_blank", "width=900,height=1100");
    if (!billWindow) return;
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const now = new Date();
    const today = now.toLocaleDateString();
    const compactDate = now.toISOString().slice(0, 10).replace(/-/g, "");
    const agreementNumber = `AGR-${compactDate}-${String(tenant?.id || "000").padStart(4, "0")}`;
    const subscriptionId = `SUB-${String(tenant?.id || "000").padStart(4, "0")}`;
    const status = statusLabel(computedStatus);
    const price = formatSubscriptionPrice(form.subscription_price);
    const numericPrice = Number(form.subscription_price || 0);
    const totalPaid = Number.isNaN(numericPrice) ? "0.00" : formatSubscriptionPrice(numericPrice);
    const expiryLabel = form.subscription_expiry || "No expiry set";
    const durationLabel = remainingDays === null ? "Unlimited" : `${Math.max(remainingDays, 0)} days`;
    const ownerName = tenant?.owner_name || tenant?.admin_name || tenant?.administrator_name || tenant?.primary_admin || "-";
    const companyName = "Education Management System";
    const companyEmail = tenant?.company_email || "support@example.com";
    const companyPhone = tenant?.company_phone || "+00 000 000 0000";
    const companyWebsite = tenant?.company_website || "www.example.com";
    const year = now.getFullYear();
    billWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Subscription Agreement & Payment Receipt - ${escapeHtml(tenant?.name || "")}</title>
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #e5e7eb;
              color: #111827;
              font-family: "Segoe UI", Arial, sans-serif;
              font-size: 12px;
              line-height: 1.45;
            }
            .actions {
              display: flex;
              justify-content: center;
              gap: 10px;
              padding: 14px;
            }
            .actions button {
              border: 1px solid #0f766e;
              background: #0f766e;
              color: white;
              border-radius: 4px;
              cursor: pointer;
              font: inherit;
              font-weight: 700;
              padding: 9px 16px;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto 18px;
              background: white;
              padding: 16mm;
              border: 1px solid #d1d5db;
              box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
            }
            .topbar {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 20px;
              border-bottom: 3px solid #0f766e;
              padding-bottom: 16px;
            }
            .brand {
              display: flex;
              gap: 14px;
              align-items: center;
            }
            .logo {
              display: grid;
              place-items: center;
              width: 58px;
              height: 58px;
              border: 2px solid #0f766e;
              color: #0f766e;
              font-size: 22px;
              font-weight: 800;
            }
            .company { margin: 0; font-size: 21px; font-weight: 800; color: #0f172a; }
            .system { margin-top: 3px; color: #475569; font-weight: 700; }
            .document-title {
              margin-top: 13px;
              color: #0f766e;
              font-size: 17px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .meta {
              min-width: 220px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
            }
            .meta div {
              display: grid;
              grid-template-columns: 112px 1fr;
              border-bottom: 1px solid #e2e8f0;
            }
            .meta div:last-child { border-bottom: 0; }
            .meta span { padding: 7px 9px; }
            .meta span:first-child { background: #f8fafc; color: #475569; font-weight: 700; }
            .meta span:last-child { color: #111827; font-weight: 700; }
            .section {
              margin-top: 16px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .section-title {
              background: #f1f5f9;
              border-bottom: 1px solid #cbd5e1;
              color: #0f172a;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.04em;
              padding: 9px 12px;
              text-transform: uppercase;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .item {
              min-height: 44px;
              padding: 10px 12px;
              border-right: 1px solid #e2e8f0;
              border-bottom: 1px solid #e2e8f0;
            }
            .item:nth-child(2n) { border-right: 0; }
            .item:nth-last-child(-n + 2) { border-bottom: 0; }
            .label { color: #64748b; display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; }
            .value { color: #111827; display: block; font-weight: 700; margin-top: 3px; word-break: break-word; }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border-bottom: 1px solid #e2e8f0;
              padding: 9px 11px;
              text-align: left;
              vertical-align: top;
            }
            tr { break-inside: avoid; page-break-inside: avoid; }
            th {
              width: 34%;
              background: #fbfdff;
              color: #475569;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
            }
            td { color: #111827; font-weight: 650; }
            tr:last-child th, tr:last-child td { border-bottom: 0; }
            .terms {
              padding: 13px 14px;
              color: #334155;
              text-align: justify;
            }
            .terms p { margin: 0 0 9px; }
            .terms p:last-child { margin-bottom: 0; }
            .payment {
              display: grid;
              grid-template-columns: 1.1fr 0.9fr;
              gap: 16px;
              margin-top: 16px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .summary-box {
              border: 2px solid #0f766e;
              border-radius: 6px;
              overflow: hidden;
            }
            .summary-box .section-title { background: #ecfdf5; color: #0f766e; }
            .summary-line {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              padding: 8px 12px;
              border-bottom: 1px solid #d1fae5;
            }
            .summary-line:last-child { border-bottom: 0; }
            .summary-line.total {
              background: #0f766e;
              color: white;
              font-size: 19px;
              font-weight: 900;
              padding: 12px;
            }
            .period-card {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 13px;
              background: #f8fafc;
            }
            .period-card strong { display: block; color: #0f172a; font-size: 13px; margin-bottom: 8px; }
            .signature-wrap {
              display: grid;
              grid-template-columns: 1fr 1fr 118px;
              gap: 14px;
              margin-top: 18px;
              align-items: end;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .signature {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 12px;
              min-height: 150px;
            }
            .signature h3 {
              margin: 0 0 12px;
              color: #0f172a;
              font-size: 12px;
              text-transform: uppercase;
            }
            .sig-line {
              display: flex;
              gap: 8px;
              align-items: end;
              margin-top: 13px;
            }
            .sig-line span:first-child { min-width: 62px; color: #475569; font-weight: 700; }
            .sig-line span:last-child { flex: 1; border-bottom: 1px solid #94a3b8; height: 16px; }
            .stamp {
              display: grid;
              place-items: center;
              width: 118px;
              height: 118px;
              border: 2px dashed #94a3b8;
              color: #475569;
              font-size: 11px;
              font-weight: 800;
              text-align: center;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 18px;
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
              color: #475569;
              font-size: 10.5px;
              text-align: center;
            }
            .footer p { margin: 3px 0; }
            @media screen and (max-width: 820px) {
              .page { width: 100%; min-height: auto; padding: 18px; }
              .topbar, .payment, .signature-wrap, .grid { grid-template-columns: 1fr; }
              .item, .item:nth-child(2n), .item:nth-last-child(-n + 2) { border-right: 0; border-bottom: 1px solid #e2e8f0; }
              .stamp { width: 100%; }
            }
            @media print {
              body { background: white; }
              .actions { display: none; }
              .page {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 0;
                border: 0;
                box-shadow: none;
              }
              .section, .payment, .signature-wrap, tr { break-inside: avoid; page-break-inside: avoid; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body onload="setTimeout(() => window.print(), 350)">
          <div class="actions">
            <button type="button" onclick="window.print()">Print / Save PDF</button>
          </div>

          <main class="page">
            <header class="topbar">
              <div>
                <div class="brand">
                  <div class="logo">EMS</div>
                  <div>
                    <h1 class="company">${escapeHtml(companyName)}</h1>
                    <div class="system">Education Management System</div>
                  </div>
                </div>
                <div class="document-title">Software Subscription Agreement & Payment Receipt</div>
              </div>
              <div class="meta">
                <div><span>Agreement No.</span><span>${escapeHtml(agreementNumber)}</span></div>
                <div><span>Subscription ID</span><span>${escapeHtml(subscriptionId)}</span></div>
                <div><span>Print Date</span><span>${escapeHtml(today)}</span></div>
                <div><span>Invoice Date</span><span>${escapeHtml(today)}</span></div>
              </div>
            </header>

            <section class="section">
              <div class="section-title">Customer Information</div>
              <div class="grid">
                <div class="item"><span class="label">Institution Name</span><span class="value">${escapeHtml(tenant?.name || "-")}</span></div>
                <div class="item"><span class="label">Tenant ID</span><span class="value">${escapeHtml(tenant?.id || "-")}</span></div>
                <div class="item"><span class="label">Owner / Administrator</span><span class="value">${escapeHtml(ownerName)}</span></div>
                <div class="item"><span class="label">Phone</span><span class="value">${escapeHtml(tenant?.phone || "-")}</span></div>
                <div class="item"><span class="label">Email</span><span class="value">${escapeHtml(tenant?.email || "-")}</span></div>
                <div class="item"><span class="label">Address</span><span class="value">${escapeHtml(tenant?.address || "-")}</span></div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Subscription Information</div>
              <table>
                <tbody>
                  <tr><th>Subscription Plan</th><td>Education Management System Subscription</td></tr>
                  <tr><th>Subscription Status</th><td>${escapeHtml(status)}</td></tr>
                  <tr><th>Start Date</th><td>${escapeHtml(today)}</td></tr>
                  <tr><th>Expiry Date</th><td>${escapeHtml(expiryLabel)}</td></tr>
                  <tr><th>Remaining Days</th><td>${escapeHtml(remainingDays === null ? "Unlimited" : remainingDays)}</td></tr>
                  <tr><th>Subscription Duration</th><td>${escapeHtml(durationLabel)}</td></tr>
                  <tr><th>Amount Paid</th><td>${escapeHtml(totalPaid)}</td></tr>
                  <tr><th>Currency</th><td>Default system currency</td></tr>
                  <tr><th>Payment Status</th><td>Paid</td></tr>
                  <tr><th>Payment Method</th><td>Manual / Administrative Record</td></tr>
                  <tr><th>Notes</th><td>${escapeHtml(form.subscription_notes || "-")}</td></tr>
                </tbody>
              </table>
            </section>

            <div class="payment">
              <section class="summary-box">
                <div class="section-title">Payment Summary</div>
                <div class="summary-line"><span>Subscription Price</span><strong>${escapeHtml(price)}</strong></div>
                <div class="summary-line"><span>Taxes</span><strong>0.00</strong></div>
                <div class="summary-line"><span>Discount</span><strong>0.00</strong></div>
                <div class="summary-line"><span>Outstanding Balance</span><strong>0.00</strong></div>
                <div class="summary-line total"><span>Total Paid</span><span>${escapeHtml(totalPaid)}</span></div>
              </section>
              <aside class="period-card">
                <strong>Subscription Period</strong>
                <p>This receipt covers the institution subscription recorded on ${escapeHtml(today)} and remains valid until ${escapeHtml(expiryLabel)} unless amended by an authorized renewal or administrative update.</p>
              </aside>
            </div>

            <section class="section">
              <div class="section-title">Agreement / Terms</div>
              <div class="terms">
                <p>This document confirms that the institution named above has subscribed to the Education Management System for the subscription period stated in this agreement. While the subscription is active, the institution may access the software features included in the selected plan, together with applicable updates, security improvements, bug fixes, and technical support under the provider's operating policies.</p>
                <p>The subscription remains valid through the expiry date shown in this document. Once the subscription expires, access to protected services, administrative areas, hosted tools, or related support may be paused until the subscription is renewed or otherwise approved by the software provider.</p>
                <p>The customer agrees to use the software responsibly and in accordance with applicable laws, acceptable-use requirements, and company policies. Copying, redistribution, reverse engineering, resale, sublicensing, unauthorized modification, or any other unapproved transfer of the software or service access is prohibited unless written authorization is provided by the software provider.</p>
                <p>This agreement and payment receipt become effective when acknowledged and signed by both parties, and it should be retained as the official record of the subscription transaction.</p>
              </div>
            </section>

            <section class="signature-wrap">
              <div class="signature">
                <h3>Software Provider</h3>
                <div class="sig-line"><span>Name:</span><span></span></div>
                <div class="sig-line"><span>Position:</span><span></span></div>
                <div class="sig-line"><span>Signature:</span><span></span></div>
                <div class="sig-line"><span>Date:</span><span></span></div>
              </div>
              <div class="signature">
                <h3>Customer / Institution Representative</h3>
                <div class="sig-line"><span>Name:</span><span></span></div>
                <div class="sig-line"><span>Position:</span><span></span></div>
                <div class="sig-line"><span>Signature:</span><span></span></div>
                <div class="sig-line"><span>Date:</span><span></span></div>
              </div>
              <div class="stamp">Official<br />Company<br />Stamp</div>
            </section>

            <footer class="footer">
              <p>Thank you for choosing our Education Management System. This document serves as an official subscription agreement and payment receipt.</p>
              <p>For technical support or subscription renewal, please contact the system administrator.</p>
              <p>${escapeHtml(companyEmail)} | ${escapeHtml(companyPhone)} | ${escapeHtml(companyWebsite)}</p>
              <p>Copyright &copy; ${escapeHtml(year)} ${escapeHtml(companyName)}. All rights reserved.</p>
            </footer>
          </main>
        </body>
      </html>
    `);
    billWindow.document.close();
    billWindow.focus();
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await instance.patch(`/super-admin/tenants/${tenant.id}/`, form);
      onSaved(response.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.subscription_expiry || "Could not update subscription.");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
        Cancel
      </button>
      <button type="button" onClick={printBill} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
        <Printer size={16} />
        Print Bill
      </button>
      <button type="button" onClick={() => setConfirmOpen(true)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save
      </button>
    </div>
  );

  return (
    <>
      <Modal title="Manage Subscription" description={tenant?.name} onClose={onClose} footer={footer}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                <CalendarClock size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Subscription Status</p>
                <div className="mt-1"><SubscriptionBadge status={computedStatus} /></div>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Current Expiry Date</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{tenant?.subscription_expiry || "No expiry set"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">New Expiry Date</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{form.subscription_expiry || "No expiry set"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Remaining Days</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{remainingDays === null ? "Unlimited" : remainingDays}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Price</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-white">{formatSubscriptionPrice(form.subscription_price)}</dd>
              </div>
            </dl>
          </aside>

          <div className="space-y-4">
            {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</div> : null}
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Subscription Expiry Date</span>
              <input
                type="date"
                value={form.subscription_expiry}
                onChange={(event) => updateExpiry(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Subscription Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.subscription_price}
                onChange={(event) => setForm((current) => ({ ...current, subscription_price: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950"
                placeholder="0.00"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-slate-200 p-1 dark:border-slate-700">
                {["active", "expired"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, status }))}
                    className={`rounded px-3 py-2 text-sm font-semibold ${form.status === status ? "bg-cyan-700 text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                  >
                    {statusLabel(status)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Extensions</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {quickExtensions.map((item) => (
                  <button
                    key={item.months}
                    type="button"
                    onClick={() => updateExpiry(addMonths(form.subscription_expiry || tenant?.subscription_expiry, item.months))}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</span>
              <textarea
                value={form.subscription_notes}
                onChange={(event) => setForm((current) => ({ ...current, subscription_notes: event.target.value }))}
                rows={4}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950"
                placeholder="Optional internal notes"
              />
            </label>
          </div>
        </div>
      </Modal>
      {confirmOpen ? (
        <ConfirmDialog
          title="Save subscription changes?"
          message="The tenant access check uses this expiry date, so the change will affect access on the next protected route check."
          confirmLabel="Save"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={save}
          loading={saving}
        />
      ) : null}
    </>
  );
}
