import React, { useState } from "react";
import instance from "../../api/axiosInstance";

export default function CreateTenantModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    expiry_date: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await instance.post("/create-tenant/", form);

      console.log("Created:", response.data);

      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (err) {
      console.log(err);

      setError(
        err?.response?.data?.error ||
          "Something went wrong while creating tenant",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Create Tenant</h2>

        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Tenant Name"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.name}
          />

          <input
            name="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.email}
          />

          <input
            name="phone"
            placeholder="Phone"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.phone}
          />

          <input
            name="address"
            placeholder="Address"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.address}
          />

          <input
            type="date"
            name="expiry_date"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.expiry_date}
          />

          <hr />

          <input
            name="username"
            placeholder="Admin Username"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.username}
          />

          <input
            type="password"
            name="password"
            placeholder="Admin Password"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={form.password}
          />

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
