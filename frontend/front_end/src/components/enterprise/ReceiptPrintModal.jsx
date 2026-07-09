import { useEffect } from "react";
import { Printer, X } from "lucide-react";

const ReceiptPrintModal = ({ receipt, tenant, isOpen, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePrint = () => window.print();

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: tenant?.currency || "AFN",
      minimumFractionDigits: 2,
    }).format(amount || 0);

  if (!isOpen || !receipt) return null;

  const subtotal = (receipt.items || []).reduce(
    (total, line) =>
      total +
      Number(line.total ?? Number(line.price || 0) * Number(line.quantity || 0)),
    0,
  );

  return (
    <>
      <style>{`
        @media print {
          html, body {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden !important; }
          #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
          #receipt-print-area {
            position: fixed !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 80mm !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
          }
          #receipt-print-card {
            width: 100% !important;
            max-width: none !important;
            box-sizing: border-box !important;
            border: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { size: auto; margin: 8mm; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:static print:block print:bg-white print:backdrop-blur-none">
        <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-gray-100 rounded-xl shadow-2xl m-4 print:m-0 print:shadow-none print:max-h-none print:overflow-visible">
          {/* Action Bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl no-print">
            <h2 className="text-lg font-semibold text-gray-800">
              Sale Receipt
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors shadow-sm"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div
            id="receipt-print-area"
            className="bg-white p-4 md:p-6 print:p-0"
          >
            <div id="receipt-print-card" className="max-w-xs mx-auto border border-gray-200 p-4 rounded bg-white print:border-none print:p-0">
              <div className="text-center border-b border-gray-300 pb-3 mb-3">
                <h1 className="text-base font-bold text-gray-900 uppercase">
                  {tenant?.name || "Institution Name"}
                </h1>
                {tenant?.address ? (
                  <p className="mt-1 text-[11px] text-gray-600">
                    {tenant.address}
                  </p>
                ) : null}
                {tenant?.phone ? (
                  <p className="text-[11px] text-gray-600">{tenant.phone}</p>
                ) : null}
              </div>

              <div className="mb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-gray-500">
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items?.map((line, i) => (
                      <tr key={i} className="border-b border-gray-100 align-top">
                        <td className="py-1 pr-1">{line.item_name}</td>
                        <td className="py-1 text-center">{line.quantity}</td>
                        <td className="py-1 text-right">
                          {formatCurrency(line.price)}
                        </td>
                        <td className="py-1 text-right">
                          {formatCurrency(
                            line.total ??
                              Number(line.price) * Number(line.quantity),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 border-t border-gray-300 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(receipt.subtotal ?? subtotal)}
                  </span>
                </div>
                {Number(receipt.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(receipt.discount)}
                    </span>
                  </div>
                )}
                {Number(receipt.tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      +{formatCurrency(receipt.tax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(receipt.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptPrintModal;
