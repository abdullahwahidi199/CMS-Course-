import React, { useEffect } from "react";
import {
  Printer,
  X,
  Building2,
  User,
  Hash,
  Calendar,
  CreditCard,
} from "lucide-react";
import { mediaUrl } from "../utils/mediaUrl";

const ReceiptPrintModal = ({ receipt, tenant, isOpen, onClose }) => {
  useEffect(() => {
    // Prevent background scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: tenant?.currency || "AFN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (!isOpen || !receipt) return null;
  const logo = mediaUrl(tenant?.logo);

  return (
    <>
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          html, body {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #receipt-print-area, 
          #receipt-print-area * {
            visibility: visible !important;
          }

          #receipt-print-area {
            position: fixed !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 148mm !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 6mm !important;
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

          .no-print {
            display: none !important;
          }

          @page {
            size: auto;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Modal Backdrop - REMOVED 'no-print' from here */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:bg-transparent">
        {/* Modal Container */}
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-100 rounded-xl shadow-2xl m-4 print:m-0 print:shadow-none print:max-h-none print:overflow-visible">
          {/* Modal Action Bar (Hidden on Print via 'no-print' class) */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl no-print">
            <h2 className="text-lg font-semibold text-gray-800">
              Payment Receipt
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors shadow-sm"
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Printable Receipt Area */}
          <div id="receipt-print-area" className="bg-white p-8 md:p-12">
            <div id="receipt-print-card" className="max-w-md mx-auto border-2 border-dashed border-gray-200 p-8 rounded-lg bg-white print:border-none print:p-0">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-6 mb-6">
                {logo ? (
                  <img
                    src={logo}
                    alt={tenant.name}
                    className="w-16 h-16 object-contain mx-auto mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="text-cyan-600" size={32} />
                  </div>
                )}
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  {tenant?.name || "Institution Name"}
                </h1>
                {tenant?.address && (
                  <p className="text-xs text-gray-500 mt-1">{tenant.address}</p>
                )}
                <div className="mt-4 inline-block bg-cyan-50 text-cyan-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Payment Receipt
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">
                      Receipt No
                    </p>
                    <p className="font-medium text-gray-900">
                      {receipt.receipt_number || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">
                      Date
                    </p>
                    <p className="font-medium text-gray-900">
                      {receipt.payment_date
                        ? new Date(receipt.payment_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                  <User size={12} /> Student Details
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <p className="text-gray-600">Name:</p>
                  <p className="font-medium text-gray-900 text-right">
                    {receipt.student_name}
                  </p>

                  <p className="text-gray-600">Roll No:</p>
                  <p className="font-medium text-gray-900 text-right">
                    {receipt.roll_number || "N/A"}
                  </p>

                  <p className="text-gray-600">Class/Batch:</p>
                  <p className="font-medium text-gray-900 text-right">
                    {receipt.course_name || receipt.batch_name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                  <CreditCard size={12} /> Payment Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Invoice Ref</span>
                    <span className="font-medium text-gray-900">
                      {receipt.invoice_number || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {receipt.payment_method?.replace("_", " ") || "N/A"}
                    </span>
                  </div>
                  {receipt.reference_number && (
                    <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Transaction Ref</span>
                      <span className="font-medium text-gray-900">
                        {receipt.reference_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-cyan-600 text-white rounded-lg p-4 flex justify-between items-center mb-8 shadow-md print:shadow-none print:border print:border-gray-200">
                <span className="text-sm font-medium uppercase tracking-wide">
                  Total Paid
                </span>
                <span className="text-2xl font-bold">
                  {formatCurrency(receipt.amount_paid)}
                </span>
              </div>

              {/* Footer */}
              <div className="text-center space-y-6">
                <p className="text-xs text-gray-500 italic">
                  This is a computer-generated receipt and does not require a
                  physical signature.
                  <br />
                  Fees once paid are non-refundable.
                </p>

                <div className="pt-8 border-t border-gray-200">
                  <div className="w-48 mx-auto border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-600 font-medium">
                    Authorized Signature
                  </p>
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
