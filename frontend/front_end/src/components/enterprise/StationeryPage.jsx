import { useMemo, useState } from "react";
import { Printer, Save, ShoppingCart } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import StatCard from "../shared/StatCard";
import { apiCreate, apiDelete, apiPost, apiUpdate, useApiResource } from "../../hooks/useApiResource";

const categories = ["books", "notebooks", "pens", "pencils", "bags", "uniforms", "copies", "markers", "other"];

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

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

export default function StationeryPage() {
  const items = useApiResource("/v1/stationery-items/");
  const purchases = useApiResource("/v1/stationery-purchases/");
  const transactions = useApiResource("/v1/inventory-transactions/");
  const students = useApiResource("/students/");
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [stockMove, setStockMove] = useState({ item: "", quantity: "1", unit_price: "0", notes: "", type: "stock-in" });
  const [sale, setSale] = useState({ student: "", discount: "0", tax: "0", payment_status: "paid" });
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lowStock = items.results.filter((item) => item.status !== "in_stock").length;
  const stockValue = items.results.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.selling_price || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todaysSales = purchases.results.filter((purchase) => purchase.date === today);
  const todaysRevenue = todaysSales.reduce((total, purchase) => total + Number(purchase.total || 0), 0);

  const topItems = useMemo(() => {
    const totals = {};
    purchases.results.forEach((purchase) => {
      purchase.items?.forEach((line) => {
        totals[line.item_name] = (totals[line.item_name] || 0) + Number(line.quantity || 0);
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [purchases.results]);

  const validateItem = () => {
    if (!itemForm.item_name.trim()) return "Item name is required.";
    if (Number(itemForm.cost_price) < 0 || Number(itemForm.selling_price) < 0) return "Prices cannot be negative.";
    if (Number(itemForm.quantity) < 0 || Number(itemForm.minimum_stock) < 0) return "Stock values cannot be negative.";
    return "";
  };

  const saveItem = async (event) => {
    event.preventDefault();
    const validation = validateItem();
    if (validation) {
      setError(validation);
      return;
    }
    try {
      if (editingId) {
        await apiUpdate(`/v1/stationery-items/${editingId}/`, itemForm);
        setMessage("Item updated.");
      } else {
        await apiCreate("/v1/stationery-items/", itemForm);
        setMessage("Item created with SKU and barcode.");
      }
      setItemForm(emptyItem);
      setEditingId(null);
      setError("");
      await items.refetch();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save item.");
    }
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setItemForm({ ...emptyItem, ...item });
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.item_name}?`)) return;
    await apiDelete(`/v1/stationery-items/${item.id}/`);
    setMessage("Item deleted.");
    await items.refetch();
  };

  const moveStock = async (event) => {
    event.preventDefault();
    if (!stockMove.item || Number(stockMove.quantity) <= 0) {
      setError("Select an item and enter a positive quantity.");
      return;
    }
    try {
      await apiPost(`/v1/stationery-items/${stockMove.type}/`, {
        item: stockMove.item,
        quantity: stockMove.quantity,
        unit_price: stockMove.unit_price,
        notes: stockMove.notes,
      });
      setMessage("Stock movement saved.");
      setStockMove({ item: "", quantity: "1", unit_price: "0", notes: "", type: "stock-in" });
      await Promise.all([items.refetch(), transactions.refetch()]);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not move stock.");
    }
  };

  const addToCart = (item) => {
    if (Number(item.quantity) <= 0) {
      setError("This item is out of stock.");
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.item === item.id);
      if (existing) {
        return current.map((line) => (line.item === item.id ? { ...line, quantity: Math.min(line.quantity + 1, Number(item.quantity)) } : line));
      }
      return [...current, { item: item.id, item_name: item.item_name, quantity: 1, price: item.selling_price, discount: 0, tax: 0, available: Number(item.quantity) }];
    });
  };

  const saleTotal = cart.reduce((total, line) => total + Number(line.price) * Number(line.quantity) - Number(line.discount || 0) + Number(line.tax || 0), 0) - Number(sale.discount || 0) + Number(sale.tax || 0);

  const completeSale = async (event) => {
    event.preventDefault();
    if (!sale.student || !cart.length) {
      setError("Select a student and add at least one item.");
      return;
    }
    const insufficient = cart.find((line) => Number(line.quantity) > Number(line.available));
    if (insufficient) {
      setError(`${insufficient.item_name} has insufficient stock.`);
      return;
    }
    try {
      await apiCreate("/v1/stationery-purchases/", {
        ...sale,
        items: cart.map(({ item, quantity, price, discount, tax }) => ({ item, quantity, price, discount, tax })),
      });
      setMessage("Sale completed and inventory decreased.");
      setCart([]);
      setSale({ student: "", discount: "0", tax: "0", payment_status: "paid" });
      await Promise.all([items.refetch(), purchases.refetch(), transactions.refetch()]);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not complete sale.");
    }
  };

  const itemColumns = [
    { key: "item_name", label: "Item" },
    { key: "sku", label: "SKU" },
    { key: "barcode", label: "Barcode" },
    { key: "category", label: "Category" },
    { key: "quantity", label: "Current" },
    { key: "minimum_stock", label: "Min" },
    { key: "selling_price", label: "Price" },
    { key: "status", label: "Status" },
  ];

  const purchaseColumns = [
    { key: "receipt_number", label: "Receipt" },
    { key: "student_name", label: "Student" },
    { key: "date", label: "Date" },
    { key: "total", label: "Total" },
    { key: "payment_status", label: "Payment" },
  ];

  const transactionColumns = [
    { key: "item_name", label: "Item" },
    { key: "transaction_type", label: "Type" },
    { key: "quantity", label: "Qty" },
    { key: "unit_price", label: "Unit Price" },
    { key: "reference", label: "Reference" },
    { key: "created_at", label: "Date", render: (row) => new Date(row.created_at).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Stationery Inventory" description="Stock levels, sales, receipts, low-stock alerts, and purchase history." />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard title="Items" value={items.count || items.results.length} accent="border-cyan-600" />
        <StatCard title="Low Stock Alerts" value={lowStock} accent="border-red-500" />
        <StatCard title="Inventory Value" value={stockValue.toFixed(2)} accent="border-emerald-500" />
        <StatCard title="Today's Sales" value={todaysSales.length} accent="border-violet-500" />
        <StatCard title="Today's Revenue" value={todaysRevenue.toFixed(2)} accent="border-amber-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form className="rounded-md bg-white p-4 shadow-sm" onSubmit={saveItem}>
          <h3 className="mb-4 font-semibold text-gray-900">{editingId ? "Edit Item" : "Create Item"}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Item Name"><input className={inputClass()} value={itemForm.item_name} onChange={(event) => setItemForm({ ...itemForm, item_name: event.target.value })} /></Field>
            <Field label="Category">
              <select className={inputClass()} value={itemForm.category} onChange={(event) => setItemForm({ ...itemForm, category: event.target.value })}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="SKU"><input className={inputClass()} placeholder="Auto generated if empty" value={itemForm.sku || ""} onChange={(event) => setItemForm({ ...itemForm, sku: event.target.value })} /></Field>
            <Field label="Barcode"><input className={inputClass()} placeholder="Auto generated if empty" value={itemForm.barcode || ""} onChange={(event) => setItemForm({ ...itemForm, barcode: event.target.value })} /></Field>
            <Field label="Cost Price"><input type="number" min="0" className={inputClass()} value={itemForm.cost_price} onChange={(event) => setItemForm({ ...itemForm, cost_price: event.target.value })} /></Field>
            <Field label="Selling Price"><input type="number" min="0" className={inputClass()} value={itemForm.selling_price} onChange={(event) => setItemForm({ ...itemForm, selling_price: event.target.value })} /></Field>
            <Field label="Opening Stock"><input type="number" min="0" className={inputClass()} value={itemForm.quantity} onChange={(event) => setItemForm({ ...itemForm, quantity: event.target.value })} /></Field>
            <Field label="Minimum Stock"><input type="number" min="0" className={inputClass()} value={itemForm.minimum_stock} onChange={(event) => setItemForm({ ...itemForm, minimum_stock: event.target.value })} /></Field>
          </div>
          <Field label="Supplier"><input className={inputClass()} value={itemForm.supplier || ""} onChange={(event) => setItemForm({ ...itemForm, supplier: event.target.value })} /></Field>
          <div className="mt-4 flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"><Save size={16} /> Save Item</button>
            <button type="button" className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700" onClick={() => { setItemForm(emptyItem); setEditingId(null); }}>Reset</button>
          </div>
        </form>

        <form className="rounded-md bg-white p-4 shadow-sm" onSubmit={moveStock}>
          <h3 className="mb-4 font-semibold text-gray-900">Stock Management</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Action">
              <select className={inputClass()} value={stockMove.type} onChange={(event) => setStockMove({ ...stockMove, type: event.target.value })}>
                <option value="stock-in">Stock In</option>
                <option value="stock-out">Stock Out</option>
                <option value="adjust">Adjustment Count</option>
              </select>
            </Field>
            <Field label="Item">
              <select className={inputClass()} value={stockMove.item} onChange={(event) => setStockMove({ ...stockMove, item: event.target.value })}>
                <option value="">Select item</option>
                {items.results.map((item) => <option key={item.id} value={item.id}>{item.item_name} ({item.quantity})</option>)}
              </select>
            </Field>
            <Field label="Quantity"><input type="number" min="1" className={inputClass()} value={stockMove.quantity} onChange={(event) => setStockMove({ ...stockMove, quantity: event.target.value })} /></Field>
            <Field label="Unit Cost"><input type="number" min="0" className={inputClass()} value={stockMove.unit_price} onChange={(event) => setStockMove({ ...stockMove, unit_price: event.target.value })} /></Field>
          </div>
          <Field label="Notes"><textarea className={`${inputClass()} mt-1`} rows="3" value={stockMove.notes} onChange={(event) => setStockMove({ ...stockMove, notes: event.target.value })} /></Field>
          <button className="mt-4 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">Save Movement</button>
        </form>
      </div>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Sales Counter</h3>
          <div className="text-sm font-semibold text-gray-700">Total {saleTotal.toFixed(2)}</div>
        </div>
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr]" onSubmit={completeSale}>
          <div>
            <Field label="Student">
              <select className={inputClass()} value={sale.student} onChange={(event) => setSale({ ...sale, student: event.target.value })}>
                <option value="">Search/select student</option>
                {students.results.map((student) => <option key={student.id} value={student.id}>{student.name} - {student.role_number}</option>)}
              </select>
            </Field>
            <div className="mt-3 grid max-h-64 gap-2 overflow-auto md:grid-cols-2">
              {items.results.map((item) => (
                <button type="button" key={item.id} className="rounded-md border border-gray-200 p-3 text-left text-sm hover:border-cyan-600" onClick={() => addToCart(item)}>
                  <div className="font-semibold text-gray-900">{item.item_name}</div>
                  <div className="text-gray-500">{item.barcode || item.sku} - stock {item.quantity}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="max-h-64 overflow-auto rounded-md border border-gray-100">
              {cart.length === 0 ? <div className="p-4 text-sm text-gray-500">No sale items selected.</div> : cart.map((line, index) => (
                <div key={line.item} className="grid grid-cols-[1fr_80px_90px_40px] items-center gap-2 border-b border-gray-100 p-2 text-sm">
                  <span>{line.item_name}</span>
                  <input className={inputClass()} type="number" min="1" max={line.available} value={line.quantity} onChange={(event) => setCart((current) => current.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} />
                  <input className={inputClass()} type="number" min="0" value={line.discount} onChange={(event) => setCart((current) => current.map((item, i) => i === index ? { ...item, discount: event.target.value } : item))} />
                  <button type="button" className="rounded-md border border-gray-200 py-2" onClick={() => setCart((current) => current.filter((item) => item.item !== line.item))}>x</button>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Field label="Discount"><input className={inputClass()} type="number" min="0" value={sale.discount} onChange={(event) => setSale({ ...sale, discount: event.target.value })} /></Field>
              <Field label="Tax"><input className={inputClass()} type="number" min="0" value={sale.tax} onChange={(event) => setSale({ ...sale, tax: event.target.value })} /></Field>
              <Field label="Payment">
                <select className={inputClass()} value={sale.payment_status} onChange={(event) => setSale({ ...sale, payment_status: event.target.value })}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"><ShoppingCart size={16} /> Complete Sale</button>
              <button type="button" className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700" onClick={() => window.print()}><Printer size={16} /> Print Receipt</button>
            </div>
          </div>
        </form>
      </section>

      <DataTable
        title="Inventory Items"
        columns={itemColumns}
        rows={items.results}
        loading={items.loading}
        error={items.error}
        bulkActions={[{ label: "Delete", onClick: (rows) => window.confirm(`Delete ${rows.length} items?`) && Promise.all(rows.map(deleteItem)) }]}
        actions={(row) => [
          { label: "Sell", onClick: () => addToCart(row) },
          { label: "Edit", onClick: () => editItem(row) },
          { label: "Barcode", onClick: () => setMessage(`Barcode: ${row.barcode || row.sku}`) },
          { label: "Delete", onClick: () => deleteItem(row) },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DataTable title="Sales Receipts" columns={purchaseColumns} rows={purchases.results} loading={purchases.loading} error={purchases.error} />
        <div className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Top Selling Items</h3>
          {topItems.length ? topItems.map(([name, quantity]) => <div key={name} className="flex justify-between border-b border-gray-100 py-2 text-sm"><span>{name}</span><span>{quantity}</span></div>) : <p className="text-sm text-gray-500">No sales yet.</p>}
        </div>
      </div>
      <DataTable title="Inventory History" columns={transactionColumns} rows={transactions.results} loading={transactions.loading} error={transactions.error} />
    </div>
  );
}
