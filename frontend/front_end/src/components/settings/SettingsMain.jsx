import React, { useEffect, useState } from "react";
import instance from "../../api/axiosInstance";

export default function SettingsMain() {
  const [settings, setSettings] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    logo: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const baseURL = import.meta.env.VITE_API_URL;

  const fetchTenant = async () => {
    try {
      const response = await instance.get("/get-tenant/");
      setSettings(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogo = (e) => {
    setSettings((prev) => ({
      ...prev,
      logo: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", settings.name);
      formData.append("phone", settings.phone);
      formData.append("email", settings.email);
      formData.append("address", settings.address);

      if (settings.logo instanceof File) {
        formData.append("logo", settings.logo);
      }

      await instance.patch("/update-tenant/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Settings updated successfully.");
      fetchTenant();
    } catch (error) {
      console.log(error);
      setMessage("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Course Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={settings.name}
          onChange={handleChange}
          placeholder="School Name"
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="phone"
          value={settings.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          name="email"
          value={settings.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />

        <textarea
          name="address"
          value={settings.address}
          onChange={handleChange}
          placeholder="Address"
          rows={4}
          className="w-full border p-2 rounded"
        />

        <div>
          <label className="block mb-2 font-medium">Logo</label>

          {settings.logo && !(settings.logo instanceof File) && (
            <img
              src={`${baseURL}${settings.logo}`}
              alt="logo"
              className="w-24 h-24 object-contain mb-3 border"
            />
          )}

          <input type="file" accept="image/*" onChange={handleLogo} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {message && <p className="mt-2 text-green-600">{message}</p>}
      </form>
    </div>
  );
}
