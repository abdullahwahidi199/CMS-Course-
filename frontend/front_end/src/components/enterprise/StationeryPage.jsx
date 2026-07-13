import { useContext, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit,
  LayoutDashboard,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageHeader from "../shared/PageHeader";
import StatCard from "../shared/StatCard";
import { AuthContext } from "../../AuthProvider";
import {
  apiCreate,
  apiDelete,
  apiPost,
  apiUpdate,
  useApiResource,
} from "../../hooks/useApiResource";
import ReceiptPrintModal from "./ReceiptPrintModal";

const categories = [
  "books",
  "notebooks",
  "pens",
  "pencils",
  "bags",
  "uniforms",
  "copies",
  "markers",
  "other",
];

const emptyItem = {
  item_name: "",
  sku: "",
  barcode: "",
  category: "books",
  cost_price: "0",
  selling_price: "0",
  quantity: "0",
  minimum_stock: "0",
  supplier: "",
};

const stationerNav = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Products", path: "products", icon: Boxes },
  { label: "Stock", path: "stock", icon: PackagePlus },
  { label: "POS", path: "pos", icon: ShoppingCart },
  { label: "Sales", path: "sales", icon: ReceiptText },
  { label: "Reports", path: "reports", icon: BarChart3 },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function inputClass() {
  return "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Toast({ toast, onClose }) {
  if (!toast?.text) return null;
  return (
    <div
      className={cx(
        "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-md border p-3 text-sm shadow-lg",
        toast.type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <span className="font-medium">{toast.text}</span>
      <button
        onClick={onClose}
        className="rounded p-1 hover:bg-white/60"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmModal({ state, onCancel, onConfirm }) {
  if (!state) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-red-50 p-2 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">{state.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{state.description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="space-y-3 rounded-md bg-white p-4 shadow-sm">
      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="h-24 animate-pulse rounded bg-slate-100" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function StationeryBreadcrumbs({ active }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500">
      <Link to="/admin/dashboard" className="hover:text-cyan-700">
        Dashboard
      </Link>
      <ChevronRight size={14} />
      <Link
        to="/admin/dashboard/stationery/dashboard"
        className="hover:text-cyan-700"
      >
        Stationery
      </Link>
      <ChevronRight size={14} />
      <span className="font-medium text-slate-700">{active}</span>
    </nav>
  );
}

function StationeryShell({ activePath, children }) {
  const active =
    stationerNav.find((item) => item.path === activePath) || stationerNav[0];

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-4">
        <StationeryBreadcrumbs active={active.label} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="sticky top-4 hidden self-start rounded-md border border-slate-200 bg-white p-2 shadow-sm lg:block">
          {stationerNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === activePath;
            return (
              <Link
                key={item.path}
                to={`/admin/dashboard/stationery/${item.path}`}
                className={cx(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold",
                  isActive
                    ? "bg-cyan-50 text-cyan-800"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white/95 px-1 py-2 shadow-lg backdrop-blur lg:hidden">
        {stationerNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === activePath;
          return (
            <Link
              key={item.path}
              to={`/admin/dashboard/stationery/${item.path}`}
              className={cx(
                "flex flex-col items-center gap-1 rounded-md px-1 py-1 text-[11px] font-semibold",
                isActive ? "text-cyan-700" : "text-slate-500",
              )}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function MiniList({ title, rows, empty }) {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.length ? rows : <p className="text-sm text-slate-500">{empty}</p>}
      </div>
    </section>
  );
}

function DashboardSection({ state }) {
  const {
    items,
    purchases,
    lowStockItems,
    stockValue,
    todaysSales,
    todaysRevenue,
    topItems,
  } = state;
  if (items.loading || purchases.loading) return <SkeletonPanel />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stationery Dashboard"
        description="A fast daily view of sales, revenue, inventory value, stock risk, and best sellers."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Today's Sales"
          value={todaysSales.length}
          accent="border-violet-500"
        />
        <StatCard
          title="Today's Revenue"
          value={money(todaysRevenue)}
          accent="border-emerald-500"
        />
        <StatCard
          title="Inventory Value"
          value={money(stockValue)}
          accent="border-cyan-600"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          accent="border-red-500"
        />
        <StatCard
          title="Products"
          value={items.count || items.results.length}
          accent="border-amber-500"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <MiniList
          title="Low Stock Alerts"
          empty="All items are above their reorder point."
          rows={lowStockItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.item_name}</p>
                <p className="text-xs text-slate-500">
                  Minimum {item.minimum_stock}
                </p>
              </div>
              <span className="font-semibold text-red-700">
                {item.quantity} left
              </span>
            </div>
          ))}
        />
        <MiniList
          title="Top Selling Items"
          empty="No sales yet."
          rows={topItems.map(([name, quantity]) => (
            <div
              key={name}
              className="flex items-center justify-between border-b border-slate-100 py-2 text-sm"
            >
              <span className="font-medium text-slate-800">{name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {quantity} sold
              </span>
            </div>
          ))}
        />
      </div>
    </div>
  );
}

function ItemDrawer({ open, form, editingId, setForm, onClose, onSubmit }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <form
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              {editingId ? "Edit Product" : "Add Product"}
            </h3>
            <p className="text-sm text-slate-500">
              Keep SKU, pricing, and reorder settings close to the product.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-200 p-2"
            onClick={onClose}
            aria-label="Close product form"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-auto p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Item Name">
              <input
                className={inputClass()}
                value={form.item_name}
                onChange={(event) =>
                  setForm({ ...form, item_name: event.target.value })
                }
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass()}
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="SKU">
              <input
                className={inputClass()}
                placeholder="Auto generated if empty"
                value={form.sku || ""}
                onChange={(event) =>
                  setForm({ ...form, sku: event.target.value })
                }
              />
            </Field>
            <Field label="Barcode">
              <input
                className={inputClass()}
                placeholder="Auto generated if empty"
                value={form.barcode || ""}
                onChange={(event) =>
                  setForm({ ...form, barcode: event.target.value })
                }
              />
            </Field>
            <Field label="Cost Price">
              <input
                type="number"
                min="0"
                className={inputClass()}
                value={form.cost_price}
                onChange={(event) =>
                  setForm({ ...form, cost_price: event.target.value })
                }
              />
            </Field>
            <Field label="Selling Price">
              <input
                type="number"
                min="0"
                className={inputClass()}
                value={form.selling_price}
                onChange={(event) =>
                  setForm({ ...form, selling_price: event.target.value })
                }
              />
            </Field>
            <Field label="Opening Stock">
              <input
                type="number"
                min="0"
                className={inputClass()}
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
              />
            </Field>
            <Field label="Minimum Stock">
              <input
                type="number"
                min="0"
                className={inputClass()}
                value={form.minimum_stock}
                onChange={(event) =>
                  setForm({ ...form, minimum_stock: event.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Supplier">
            <input
              className={inputClass()}
              value={form.supplier || ""}
              onChange={(event) =>
                setForm({ ...form, supplier: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white p-4">
          <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-3 text-sm font-semibold text-white">
            <Save size={16} /> Save Product
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ProductsSection({ state, actions }) {
  const {
    items,
    filteredProducts,
    productQuery,
    setProductQuery,
    categoryFilter,
    setCategoryFilter,
    productPage,
    setProductPage,
    selectedIds,
    setSelectedIds,
  } = state;
  const { openItemDrawer, editItem, requestDeleteItem, requestBulkDelete } =
    actions;
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paged = filteredProducts.slice(
    (productPage - 1) * pageSize,
    productPage * pageSize,
  );

  if (items.loading) return <SkeletonPanel />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Products"
          description="Searchable inventory with category filters, pagination, and bulk actions."
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => openItemDrawer()}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>
      <section className="rounded-md bg-white shadow-sm">
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full outline-none"
              value={productQuery}
              onChange={(event) => {
                setProductQuery(event.target.value);
                setProductPage(1);
              }}
              placeholder="Search products, SKU, barcode, supplier"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              className={inputClass()}
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setProductPage(1);
              }}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
              disabled={!selectedIds.length}
              onClick={requestBulkDelete}
            >
              Delete selected
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      paged.length > 0 &&
                      paged.every((item) => selectedIds.includes(item.id))
                    }
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked
                          ? [
                              ...new Set([
                                ...selectedIds,
                                ...paged.map((item) => item.id),
                              ]),
                            ]
                          : selectedIds.filter(
                              (id) => !paged.some((item) => item.id === id),
                            ),
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(event) =>
                        setSelectedIds(
                          event.target.checked
                            ? [...selectedIds, item.id]
                            : selectedIds.filter((id) => id !== item.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {item.item_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.sku || "No SKU"} | {item.barcode || "No barcode"}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">
                    {item.category}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.quantity} / min {item.minimum_stock}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {money(item.selling_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        item.status === "in_stock"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700",
                      )}
                    >
                      {item.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-md border border-slate-200 p-2 text-slate-600"
                        onClick={() => editItem(item)}
                        aria-label="Edit product"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="rounded-md border border-red-100 p-2 text-red-600"
                        onClick={() => requestDeleteItem(item)}
                        aria-label="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!paged.length ? (
          <EmptyState
            title="No products found"
            description="Adjust your search or create a product from the action above."
          />
        ) : null}
        <div className="flex items-center justify-between border-t border-slate-100 p-3 text-sm text-slate-600">
          <span>
            Page {productPage} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-200 p-2 disabled:opacity-40"
              disabled={productPage === 1}
              onClick={() => setProductPage((page) => page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="rounded-md border border-slate-200 p-2 disabled:opacity-40"
              disabled={productPage === pages}
              onClick={() => setProductPage((page) => page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StockForm({ type, title, items, stockMove, setStockMove, onSubmit }) {
  return (
    <form
      className="rounded-md bg-white p-4 shadow-sm"
      onSubmit={(event) => onSubmit(event, type)}
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Item">
          <select
            className={inputClass()}
            value={stockMove.item}
            onChange={(event) =>
              setStockMove({ ...stockMove, item: event.target.value })
            }
          >
            <option value="">Select item</option>
            {items.results.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name} ({item.quantity})
              </option>
            ))}
          </select>
        </Field>
        <Field label={type === "adjust" ? "Count" : "Quantity"}>
          <input
            type="number"
            min="1"
            className={inputClass()}
            value={stockMove.quantity}
            onChange={(event) =>
              setStockMove({ ...stockMove, quantity: event.target.value })
            }
          />
        </Field>
        <Field label="Unit Cost">
          <input
            type="number"
            min="0"
            className={inputClass()}
            value={stockMove.unit_price}
            onChange={(event) =>
              setStockMove({ ...stockMove, unit_price: event.target.value })
            }
          />
        </Field>
        <Field label="Notes">
          <input
            className={inputClass()}
            value={stockMove.notes}
            onChange={(event) =>
              setStockMove({ ...stockMove, notes: event.target.value })
            }
          />
        </Field>
      </div>
      <button className="mt-4 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
        Save {title}
      </button>
    </form>
  );
}

function StockSection({ state, actions }) {
  const {
    items,
    transactions,
    stockMove,
    setStockMove,
    transactionDate,
    setTransactionDate,
    filteredTransactions,
  } = state;
  const { moveStock } = actions;
  if (items.loading || transactions.loading) return <SkeletonPanel />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Management"
        description="Separate stock-in, stock-out, and adjustment workflows with recent movement history."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <StockForm
          type="stock-in"
          title="Stock In"
          items={items}
          stockMove={stockMove}
          setStockMove={setStockMove}
          onSubmit={moveStock}
        />
        <StockForm
          type="stock-out"
          title="Stock Out"
          items={items}
          stockMove={stockMove}
          setStockMove={setStockMove}
          onSubmit={moveStock}
        />
        <StockForm
          type="adjust"
          title="Adjustment"
          items={items}
          stockMove={stockMove}
          setStockMove={setStockMove}
          onSubmit={moveStock}
        />
      </div>
      <section className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-slate-900">
            Recent Transaction History
          </h3>
          <input
            type="date"
            className={inputClass()}
            value={transactionDate}
            onChange={(event) => setTransactionDate(event.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((row) => (
                <tr key={row.id || `${row.item_name}-${row.created_at}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.item_name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.transaction_type}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.quantity}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {money(row.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.reference || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredTransactions.length ? (
          <EmptyState
            title="No movements found"
            description="Stock movements will appear here after saving stock in, stock out, or adjustments."
          />
        ) : null}
      </section>
    </div>
  );
}

function PosSection({ state, actions }) {
  const {
    items,
    cart,
    setCart,
    sale,
    setSale,
    saleTotal,
    posQuery,
    setPosQuery,
  } = state;
  const { addToCart, completeSale, setShowReceipt, lastSale } = actions;

  const query = posQuery.trim().toLowerCase();

  const visibleItems = items.results.filter((item) =>
    `${item.item_name} ${item.sku} ${item.barcode}`
      .toLowerCase()
      .includes(query),
  );

  const totalUnits = cart.reduce(
    (total, line) => total + (Number(line.quantity) || 0),
    0,
  );

  const updateQuantity = (itemId, nextQuantity) => {
    setCart((current) =>
      current.map((line) => {
        if (line.item !== itemId) return line;

        const available = Number(line.available);
        const maxQuantity = Number.isFinite(available) ? available : Infinity;

        return {
          ...line,
          quantity: Math.max(1, Math.min(maxQuantity, nextQuantity)),
        };
      }),
    );
  };

  const removeFromCart = (itemId) => {
    setCart((current) => current.filter((line) => line.item !== itemId));
  };

  if (items.loading) return <SkeletonPanel />;

  return (
    <div className="flex min-h-0 flex-col gap-4 xl:h-[calc(100dvh-2rem)]">
      <PageHeader
        title="Sales / POS"
        description="Search products, build an order, and checkout without losing your cart or totals."
      />

      <form
        className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:overflow-hidden"
        onSubmit={completeSale}
      >
        {/* Products */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-md bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100">
              <Search size={16} className="text-slate-400" />
              <span className="sr-only">Search products</span>
              <input
                className="w-full outline-none"
                value={posQuery}
                onChange={(event) => setPosQuery(event.target.value)}
                placeholder="Scan barcode or search product"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:grid-cols-3">
            {!visibleItems.length ? (
              <div className="col-span-full rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No products match “{posQuery}”.
              </div>
            ) : (
              visibleItems.map((item) => {
                const outOfStock = Number(item.quantity) <= 0;

                return (
                  <button
                    type="button"
                    key={item.id}
                    disabled={outOfStock}
                    className="rounded-md border border-slate-200 p-3 text-left transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50"
                    onClick={() => addToCart(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {item.item_name}
                      </p>

                      {outOfStock && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                          Out
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.barcode || item.sku || "No barcode"} · Stock{" "}
                      {item.quantity}
                    </p>

                    <p className="mt-3 text-lg font-bold text-cyan-700">
                      {money(item.selling_price)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Cart */}
        <aside className="flex min-h-0 flex-col rounded-md bg-white shadow-sm xl:overflow-hidden">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Cart</h3>
                <p className="text-sm text-slate-500">
                  {cart.length} {cart.length === 1 ? "line" : "lines"} ·{" "}
                  {totalUnits} {totalUnits === 1 ? "item" : "items"}
                </p>
              </div>

              {cart.length > 0 && (
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                  {money(saleTotal)}
                </span>
              )}
            </div>
          </div>

          {/* This uses all remaining sidebar height on desktop */}
          <div className="p-3 sm:p-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {!cart.length ? (
              <p className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Tap products to build an order.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((line) => {
                  const quantity = Number(line.quantity) || 1;
                  const available = Number(line.available);
                  const atMinimum = quantity <= 1;
                  const atMaximum =
                    Number.isFinite(available) && quantity >= available;

                  return (
                    <div
                      key={line.item}
                      className="flex items-center gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-semibold text-slate-900"
                          title={line.item_name}
                        >
                          {line.item_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {money(line.price)} each
                        </p>
                      </div>

                      <div className="inline-flex shrink-0 items-center rounded-md border border-slate-200">
                        <button
                          type="button"
                          disabled={atMinimum}
                          aria-label={`Decrease ${line.item_name} quantity`}
                          className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                          onClick={() =>
                            updateQuantity(line.item, quantity - 1)
                          }
                        >
                          −
                        </button>

                        <span className="grid h-8 min-w-8 place-items-center border-x border-slate-200 px-1 text-sm font-semibold text-slate-800">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={atMaximum}
                          aria-label={`Increase ${line.item_name} quantity`}
                          className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                          onClick={() =>
                            updateQuantity(line.item, quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <p className="w-20 shrink-0 text-right text-sm font-bold text-slate-900">
                        {money(Number(line.price) * quantity)}
                      </p>

                      <button
                        type="button"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeFromCart(line.item)}
                        aria-label={`Remove ${line.item_name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Always visible on desktop */}
          <div className="shrink-0 space-y-3 border-t border-slate-100 bg-white p-4">
            <details className="rounded-md border border-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium text-slate-700">
                <span>Discount & tax</span>
                <span className="text-xs font-normal text-slate-400">
                  Order adjustments
                </span>
              </summary>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
                <Field label="Discount">
                  <input
                    className={inputClass()}
                    type="number"
                    min="0"
                    value={sale.discount}
                    onChange={(event) =>
                      setSale({ ...sale, discount: event.target.value })
                    }
                  />
                </Field>

                <Field label="Tax">
                  <input
                    className={inputClass()}
                    type="number"
                    min="0"
                    value={sale.tax}
                    onChange={(event) =>
                      setSale({ ...sale, tax: event.target.value })
                    }
                  />
                </Field>
              </div>
            </details>

            <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm font-medium text-slate-700">
              <span>Payment</span>
              <select
                className={inputClass()}
                value={sale.payment_status}
                onChange={(event) =>
                  setSale({ ...sale, payment_status: event.target.value })
                }
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </label>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{money(saleTotal)}</span>
            </div>

            <button
              type="submit"
              disabled={!cart.length}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-4 text-base font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart size={18} />
              Checkout
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              onClick={() => setShowReceipt(true)}
              disabled={!lastSale}
            >
              <Printer size={16} />
              Reprint Last Receipt
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
function SalesSection({ state, actions }) {
  const {
    purchases,
    salesDate,
    setSalesDate,
    paymentFilter,
    setPaymentFilter,
    filteredSales,
  } = state;
  const { reprintReceipt } = actions;
  if (purchases.loading) return <SkeletonPanel />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales History"
        description="Receipt lookup with date, payment status, and reprint actions."
      />
      <section className="rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-slate-900">Receipts</h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              className={inputClass()}
              value={salesDate}
              onChange={(event) => setSalesDate(event.target.value)}
            />
            <select
              className={inputClass()}
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id || sale.receipt_number}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {sale.receipt_number}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{sale.date}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {money(sale.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {sale.payment_status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => reprintReceipt(sale)}
                    >
                      <Printer size={15} /> Reprint
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredSales.length ? (
          <EmptyState
            title="No receipts found"
            description="Try a different date or payment status."
          />
        ) : null}
      </section>
    </div>
  );
}

function BarRows({ rows }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value || 0)));
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
            <span>{row.label}</span>
            <span>{row.display ?? row.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-cyan-600"
              style={{
                width: `${Math.max(6, (Number(row.value || 0) / max) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsSection({ state }) {
  const { lowStockItems, stockValue, topItems, purchases } = state;
  const revenueRows = purchases.results.slice(0, 7).map((sale) => ({
    label: sale.date || sale.receipt_number,
    value: Number(sale.total || 0),
    display: money(sale.total),
  }));
  const salesRows = purchases.results.slice(0, 7).map((sale) => ({
    label: sale.receipt_number || sale.date,
    value:
      sale.items?.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      ) || 1,
  }));
  const topRows = topItems.map(([label, value]) => ({ label, value }));

  if (purchases.loading) return <SkeletonPanel />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Revenue, sales volume, inventory valuation, top sellers, and low-stock reporting."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Revenue Chart</h3>
          <BarRows
            rows={
              revenueRows.length
                ? revenueRows
                : [{ label: "No revenue", value: 0, display: "0.00" }]
            }
          />
        </section>
        <section className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Sales Chart</h3>
          <BarRows
            rows={
              salesRows.length ? salesRows : [{ label: "No sales", value: 0 }]
            }
          />
        </section>
        <section className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">Inventory Valuation</h3>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {money(stockValue)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Retail value of current on-hand stock.
          </p>
        </section>
        <section className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">
            Top Selling Items Chart
          </h3>
          <BarRows
            rows={topRows.length ? topRows : [{ label: "No sales", value: 0 }]}
          />
        </section>
      </div>
      <MiniList
        title="Low Stock Report"
        empty="No low stock items."
        rows={lowStockItems.map((item) => (
          <div
            key={item.id}
            className="flex justify-between border-b border-slate-100 py-2 text-sm"
          >
            <span className="font-medium text-slate-800">{item.item_name}</span>
            <span className="text-red-700">
              {item.quantity} left, min {item.minimum_stock}
            </span>
          </div>
        ))}
      />
    </div>
  );
}

export default function StationeryPage() {
  const items = useApiResource("/v1/stationery-items/");
  const purchases = useApiResource("/v1/stationery-purchases/");
  const transactions = useApiResource("/v1/inventory-transactions/");
  const { tenant } = useContext(AuthContext);
  const location = useLocation();
  const activePath = location.pathname.split("/").filter(Boolean).at(-1);

  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [lastSale, setLastSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [stockMove, setStockMove] = useState({
    item: "",
    quantity: "1",
    unit_price: "0",
    notes: "",
  });
  const [sale, setSale] = useState({
    discount: "0",
    tax: "0",
    payment_status: "paid",
  });
  const [cart, setCart] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productPage, setProductPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [transactionDate, setTransactionDate] = useState("");
  const [salesDate, setSalesDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [posQuery, setPosQuery] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const lowStockItems = items.results.filter(
    (item) =>
      item.status !== "in_stock" ||
      Number(item.quantity || 0) <= Number(item.minimum_stock || 0),
  );
  const stockValue = items.results.reduce(
    (total, item) =>
      total + Number(item.quantity || 0) * Number(item.selling_price || 0),
    0,
  );
  const todaysSales = purchases.results.filter(
    (purchase) => purchase.date === today,
  );
  const todaysRevenue = todaysSales.reduce(
    (total, purchase) => total + Number(purchase.total || 0),
    0,
  );

  const topItems = useMemo(() => {
    const totals = {};
    purchases.results.forEach((purchase) => {
      purchase.items?.forEach((line) => {
        totals[line.item_name] =
          (totals[line.item_name] || 0) + Number(line.quantity || 0);
      });
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [purchases.results]);

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    return items.results.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesQuery =
        !query ||
        `${item.item_name} ${item.sku} ${item.barcode} ${item.supplier}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, items.results, productQuery]);

  const filteredTransactions = transactions.results.filter(
    (row) =>
      !transactionDate || row.created_at?.slice(0, 10) === transactionDate,
  );
  const filteredSales = purchases.results.filter((row) => {
    const dateOk = !salesDate || row.date === salesDate;
    const paymentOk =
      paymentFilter === "all" || row.payment_status === paymentFilter;
    return dateOk && paymentOk;
  });

  const saleTotal =
    cart.reduce(
      (total, line) =>
        total +
        Number(line.price) * Number(line.quantity) -
        Number(line.discount || 0) +
        Number(line.tax || 0),
      0,
    ) -
    Number(sale.discount || 0) +
    Number(sale.tax || 0);

  const notify = (text, type = "success") => setToast({ text, type });

  const validateItem = () => {
    if (!itemForm.item_name.trim()) return "Item name is required.";
    if (Number(itemForm.cost_price) < 0 || Number(itemForm.selling_price) < 0)
      return "Prices cannot be negative.";
    if (Number(itemForm.quantity) < 0 || Number(itemForm.minimum_stock) < 0)
      return "Stock values cannot be negative.";
    return "";
  };

  const openItemDrawer = (item = null) => {
    setEditingId(item?.id || null);
    setItemForm(item ? { ...emptyItem, ...item } : emptyItem);
    setDrawerOpen(true);
  };

  const saveItem = async (event) => {
    event.preventDefault();
    const validation = validateItem();
    if (validation) {
      notify(validation, "error");
      return;
    }
    try {
      if (editingId) {
        await apiUpdate(`/v1/stationery-items/${editingId}/`, itemForm);
        notify("Product updated.");
      } else {
        await apiCreate("/v1/stationery-items/", itemForm);
        notify("Product created.");
      }
      setDrawerOpen(false);
      setItemForm(emptyItem);
      setEditingId(null);
      await items.refetch();
    } catch (err) {
      notify(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not save product.",
        "error",
      );
    }
  };

  const requestDeleteItem = (item) => {
    setConfirmState({
      title: `Delete ${item.item_name}?`,
      description:
        "This removes the product from inventory. Existing sales history remains available.",
      onConfirm: async () => {
        await apiDelete(`/v1/stationery-items/${item.id}/`);
        notify("Product deleted.");
        await items.refetch();
      },
    });
  };

  const requestBulkDelete = () => {
    setConfirmState({
      title: `Delete ${selectedIds.length} products?`,
      description:
        "Bulk delete helps clean lists, but this action cannot be undone from the UI.",
      onConfirm: async () => {
        await Promise.all(
          selectedIds.map((id) => apiDelete(`/v1/stationery-items/${id}/`)),
        );
        setSelectedIds([]);
        notify("Selected products deleted.");
        await items.refetch();
      },
    });
  };

  const moveStock = async (event, type) => {
    event.preventDefault();
    if (!stockMove.item || Number(stockMove.quantity) <= 0) {
      notify("Select an item and enter a positive quantity.", "error");
      return;
    }
    try {
      await apiPost(`/v1/stationery-items/${type}/`, {
        item: stockMove.item,
        quantity: stockMove.quantity,
        unit_price: stockMove.unit_price,
        notes: stockMove.notes,
      });
      notify("Stock movement saved.");
      setStockMove({ item: "", quantity: "1", unit_price: "0", notes: "" });
      await Promise.all([items.refetch(), transactions.refetch()]);
    } catch (err) {
      notify(err.response?.data?.detail || "Could not move stock.", "error");
    }
  };

  const addToCart = (item) => {
    if (Number(item.quantity) <= 0) {
      notify("This item is out of stock.", "error");
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.item === item.id);
      if (existing) {
        return current.map((line) =>
          line.item === item.id
            ? {
                ...line,
                quantity: Math.min(line.quantity + 1, Number(item.quantity)),
              }
            : line,
        );
      }
      return [
        ...current,
        {
          item: item.id,
          item_name: item.item_name,
          quantity: 1,
          price: item.selling_price,
          discount: 0,
          tax: 0,
          available: Number(item.quantity),
        },
      ];
    });
  };

  const completeSale = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      notify("Add at least one item.", "error");
      return;
    }
    const insufficient = cart.find(
      (line) => Number(line.quantity) > Number(line.available),
    );
    if (insufficient) {
      notify(`${insufficient.item_name} has insufficient stock.`, "error");
      return;
    }
    try {
      const response = await apiCreate("/v1/stationery-purchases/", {
        ...sale,
        items: cart.map(({ item, quantity, price, discount, tax }) => ({
          item,
          quantity,
          price,
          discount,
          tax,
        })),
      });
      if (response) {
        notify("Sale completed and inventory decreased.");
        setLastSale(response);
        setShowReceipt(true);
        setCart([]);
        setSale({ discount: "0", tax: "0", payment_status: "paid" });
        await Promise.all([
          items.refetch(),
          purchases.refetch(),
          transactions.refetch(),
        ]);
      } else {
        notify("Sale completed but receipt data missing.", "error");
      }
    } catch (err) {
      notify(err.response?.data?.detail || "Could not complete sale.", "error");
    }
  };

  const sharedState = {
    items,
    purchases,
    transactions,
    lowStockItems,
    stockValue,
    todaysSales,
    todaysRevenue,
    topItems,
    filteredProducts,
    productQuery,
    setProductQuery,
    categoryFilter,
    setCategoryFilter,
    productPage,
    setProductPage,
    selectedIds,
    setSelectedIds,
    stockMove,
    setStockMove,
    transactionDate,
    setTransactionDate,
    filteredTransactions,
    cart,
    setCart,
    sale,
    setSale,
    saleTotal,
    posQuery,
    setPosQuery,
    salesDate,
    setSalesDate,
    paymentFilter,
    setPaymentFilter,
    filteredSales,
  };

  const sharedActions = {
    openItemDrawer,
    editItem: openItemDrawer,
    requestDeleteItem,
    requestBulkDelete,
    moveStock,
    addToCart,
    completeSale,
    setShowReceipt,
    lastSale,
    reprintReceipt: (receipt) => {
      setLastSale(receipt);
      setShowReceipt(true);
    },
  };

  const guardedActive = stationerNav.some((item) => item.path === activePath)
    ? activePath
    : "dashboard";

  return (
    <StationeryShell activePath={guardedActive}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={<DashboardSection state={sharedState} />}
        />
        <Route
          path="products"
          element={
            <ProductsSection state={sharedState} actions={sharedActions} />
          }
        />
        <Route
          path="stock"
          element={<StockSection state={sharedState} actions={sharedActions} />}
        />
        <Route
          path="pos"
          element={<PosSection state={sharedState} actions={sharedActions} />}
        />
        <Route
          path="sales"
          element={<SalesSection state={sharedState} actions={sharedActions} />}
        />
        <Route
          path="reports"
          element={<ReportsSection state={sharedState} />}
        />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>

      <ItemDrawer
        open={drawerOpen}
        form={itemForm}
        editingId={editingId}
        setForm={setItemForm}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
          setItemForm(emptyItem);
        }}
        onSubmit={saveItem}
      />
      <ConfirmModal
        state={confirmState}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          try {
            await action?.();
          } catch (err) {
            notify(err.response?.data?.detail || "Action failed.", "error");
          }
        }}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
      {showReceipt && lastSale ? (
        <ReceiptPrintModal
          receipt={lastSale}
          tenant={tenant}
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      ) : null}
    </StationeryShell>
  );
}
