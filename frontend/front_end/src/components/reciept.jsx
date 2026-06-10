import React, { forwardRef } from "react";

const Bill = forwardRef(({ student, tenant }, ref) => {
  baseURL: import.meta.env.VITE_API_URL;
  if (!student) return null;

  return (
    <div
      ref={ref}
      id="receipt"
      className="w-[168mm] h-[200mm] mx-auto bg-white shadow-xl rounded-none p-8 border border-gray-300 print:shadow-none print:border-0"
    >
      <div className="text-center border-b border-gray-400 pb-4 mb-4">
        {tenant?.logo && (
          <img
            src={`${baseURL}${settings.logo}`}
            alt={tenant.name}
            className="w-20 h-20 object-contain mx-auto mb-3"
          />
        )}

        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800">
          {tenant?.name || "School Name"}
        </h1>

        <p className="text-sm text-gray-600">Admission Fee Receipt</p>
      </div>

      <div className="space-y-2 text-gray-700">
        <p>
          <span className="font-semibold">Name:</span> {student.name}
        </p>
        <p>
          <span className="font-semibold">Father’s Name:</span> {student.f_name}
        </p>
        <p>
          <span className="font-semibold">Roll Number:</span>{" "}
          {student.role_number}
        </p>
        <p>
          <span className="font-semibold">Class:</span>{" "}
          {student.studentClass_details.name}
        </p>
        <p>
          <span className="font-semibold">Parent Mobile:</span>{" "}
          {student.parent_mobile_number}
        </p>
        <p>
          <span className="font-semibold">Address:</span> {student.address}
        </p>
      </div>

      <div className="mt-6 border-t border-gray-300 pt-4">
        <p>
          <span className="font-semibold">Total Fee:</span> Rs.{" "}
          {student.total_fee}
        </p>
        <p>
          <span className="font-semibold">Paid:</span> Rs. {student.amount_paid}
        </p>
        <p>
          <span className="font-semibold">Balance:</span> Rs.{" "}
          {student.total_fee - student.amount_paid}
        </p>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
        <p>Fees once paid are non-refundable.</p>
        <p>Keep this receipt safe for future reference.</p>
        <p className="mt-6 font-semibold text-gray-700">
          ______________________
          <br />
          Authorized Signature
        </p>
      </div>
    </div>
  );
});

export default Bill;
