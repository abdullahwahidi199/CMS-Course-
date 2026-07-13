import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  Eye,
  EyeOff,
  Globe2,
  Mail,
  MessageCircle,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import instance from "../../api/axiosInstance";
import { useApiResource } from "../../hooks/useApiResource";
import PageHeader from "../shared/PageHeader";
import { mediaUrl } from "../../utils/mediaUrl";

const tabs = [
  { id: "settings", label: "Site Setup", icon: Globe2 },
  { id: "courses", label: "Courses", icon: Globe2 },
  { id: "announcements", label: "News", icon: Newspaper },
  { id: "comments", label: "Comments", icon: MessageCircle },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "inquiries", label: "Messages", icon: MessageCircle },
];

const settingsImageFields = ["brand_logo", "banner_image", "hero_image", "about_image", "social_image"];

const settingsFields = [
  "is_published",
  "center_name",
  "tagline",
  "brand_logo",
  "banner_image",
  "primary_color",
  "accent_color",
  "hero_kicker",
  "hero_title",
  "hero_subtitle",
  "hero_image",
  "hero_primary_label",
  "hero_primary_url",
  "hero_secondary_label",
  "hero_secondary_url",
  "about_title",
  "about_body",
  "about_highlights",
  "about_image",
  "contact_title",
  "contact_body",
  "contact_email",
  "contact_phone",
  "contact_address",
  "office_hours",
  "map_url",
  "chat_enabled",
  "chat_title",
  "chat_welcome_message",
  "whatsapp_number",
  "telegram_url",
  "messenger_url",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "social_image",
  "footer_note",
];

const contentConfigs = {
  courses: {
    title: "Courses and Programs",
    endpoint: "/v1/online-page/courses/",
    imageFields: ["image"],
    empty: {
      title: "",
      slug: "",
      summary: "",
      description: "",
      image: null,
      duration: "",
      price_label: "",
      level: "",
      mode: "",
      button_label: "",
      button_url: "",
      seo_title: "",
      seo_description: "",
      order: 0,
      is_published: false,
    },
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "summary", label: "Short Description", type: "textarea" },
      { key: "description", label: "Full Description", type: "textarea" },
      { key: "image", label: "Image", type: "file" },
      { key: "duration", label: "Duration" },
      { key: "price_label", label: "Fee Label" },
      { key: "level", label: "Level" },
      { key: "mode", label: "Mode" },
      { key: "button_label", label: "Button Label" },
      { key: "button_url", label: "Button Link" },
      { key: "seo_title", label: "SEO Title" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
      { key: "is_published", label: "Published", type: "checkbox" },
    ],
  },
  announcements: {
    title: "Announcements and News",
    endpoint: "/v1/online-page/announcements/",
    imageFields: ["image"],
    empty: {
      title: "",
      slug: "",
      summary: "",
      body: "",
      category: "",
      image: null,
      is_featured: false,
      is_published: false,
      published_at: "",
      seo_title: "",
      seo_description: "",
    },
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "category", label: "Category" },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "body", label: "Post Body", type: "textarea", required: true },
      { key: "image", label: "Image", type: "file" },
      { key: "published_at", label: "Publish Date", type: "datetime" },
      { key: "seo_title", label: "SEO Title" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "is_featured", label: "Featured", type: "checkbox" },
      { key: "is_published", label: "Published", type: "checkbox" },
    ],
  },
  events: {
    title: "Events",
    endpoint: "/v1/online-page/events/",
    imageFields: ["image"],
    empty: {
      title: "",
      slug: "",
      summary: "",
      description: "",
      image: null,
      location: "",
      starts_at: "",
      ends_at: "",
      is_published: false,
      is_featured: false,
      seo_title: "",
      seo_description: "",
      order: 0,
    },
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Image", type: "file" },
      { key: "location", label: "Location" },
      { key: "starts_at", label: "Starts At", type: "datetime", required: true },
      { key: "ends_at", label: "Ends At", type: "datetime" },
      { key: "seo_title", label: "SEO Title" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
      { key: "is_featured", label: "Featured", type: "checkbox" },
      { key: "is_published", label: "Published", type: "checkbox" },
    ],
  },
  achievements: {
    title: "Achievements",
    endpoint: "/v1/online-page/achievements/",
    imageFields: ["image"],
    empty: {
      title: "",
      slug: "",
      summary: "",
      description: "",
      image: null,
      metric_value: "",
      metric_label: "",
      achieved_on: "",
      seo_title: "",
      seo_description: "",
      order: 0,
      is_published: false,
    },
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "summary", label: "Short Description", type: "textarea" },
      { key: "description", label: "Full Description", type: "textarea" },
      { key: "image", label: "Image", type: "file" },
      { key: "metric_value", label: "Metric Value" },
      { key: "metric_label", label: "Metric Label" },
      { key: "achieved_on", label: "Date", type: "date" },
      { key: "seo_title", label: "SEO Title" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
      { key: "is_published", label: "Published", type: "checkbox" },
    ],
  },
};

function inputClass() {
  return "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-700";
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDateTime(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function toDateValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function appendValue(formData, key, value) {
  if (value === undefined) return;
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }
  if (typeof value === "boolean") {
    formData.append(key, String(value));
    return;
  }
  if (value !== null && value !== undefined) {
    formData.append(key, value);
  }
}

function buildFormData(payload, imageFields = [], allowedFields = null) {
  const formData = new FormData();
  const keys = allowedFields || Object.keys(payload);
  keys.forEach((key) => {
    const value = payload[key];
    if (imageFields.includes(key) && !(value instanceof File)) return;
    appendValue(formData, key, value);
  });
  return formData;
}

function normalizePayloadForFields(payload, fields) {
  const next = { ...payload };
  fields.forEach((field) => {
    if (field.type === "datetime") {
      next[field.key] = toApiDateTime(next[field.key]);
    }
  });
  return next;
}

function Field({ label, children, wide = false }) {
  return (
    <label className={`block text-sm ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function StatusMessage({ message, error }) {
  if (!message && !error) return null;
  return (
    <div className={`rounded-md border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      {error || message}
    </div>
  );
}

function ImagePreview({ src, label }) {
  if (!src || src instanceof File) return null;
  return <img className="mt-2 h-20 w-28 rounded-md object-cover" src={mediaUrl(src)} alt={label} />;
}

function TabButton({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${active ? "bg-cyan-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
      onClick={onClick}
    >
      <Icon size={16} />
      {tab.label}
    </button>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await instance.get("/v1/online-page/settings/current/");
      const next = response.data;
      setSettings(next);
      setForm({
        ...next,
        about_highlights_text: (next.about_highlights || []).join("\n"),
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load public site settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!form.center_name?.trim()) {
      setError("Center name is required.");
      return;
    }
    const payload = {
      ...form,
      about_highlights: (form.about_highlights_text || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    const formData = buildFormData(payload, settingsImageFields, settingsFields);
    formData.set("about_highlights", JSON.stringify(payload.about_highlights));
    try {
      const response = await instance.patch("/v1/online-page/settings/current/", formData);
      setSettings(response.data);
      setForm({
        ...response.data,
        about_highlights_text: (response.data.about_highlights || []).join("\n"),
      });
      setMessage("Public site settings saved.");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save settings.");
    }
  };

  const publishToggle = async (action) => {
    setMessage("");
    setError("");
    try {
      const response = await instance.post(`/v1/online-page/settings/${action}/`);
      setSettings(response.data);
      setForm({
        ...response.data,
        about_highlights_text: (response.data.about_highlights || []).join("\n"),
      });
      setMessage(action === "publish" ? "Public site published." : "Public site unpublished.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update publish status.");
    }
  };

  if (loading) return <div className="rounded-md bg-white p-5 text-sm text-slate-500 shadow-sm">Loading settings...</div>;
  if (!form) return <StatusMessage error={error || "Settings unavailable."} />;

  return (
    <form className="space-y-6" onSubmit={save}>
      <StatusMessage message={message} error={error} />
      <div className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Public Website</h2>
            <p className="mt-1 text-sm text-slate-500">
              {settings?.public_path ? `Visitor URL: ${settings.public_path}` : "Visitor URL appears after tenant slug is available."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => publishToggle(form.is_published ? "unpublish" : "publish")}>
              {form.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
              {form.is_published ? "Unpublish Site" : "Publish Site"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Center Name">
            <input className={inputClass()} value={form.center_name || ""} onChange={(event) => update("center_name", event.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className={inputClass()} value={form.tagline || ""} onChange={(event) => update("tagline", event.target.value)} />
          </Field>
          <Field label="Primary Color">
            <input className={inputClass()} type="color" value={form.primary_color || "#0f766e"} onChange={(event) => update("primary_color", event.target.value)} />
          </Field>
          <Field label="Accent Color">
            <input className={inputClass()} type="color" value={form.accent_color || "#f59e0b"} onChange={(event) => update("accent_color", event.target.value)} />
          </Field>
          <Field label="Logo">
            <input className={inputClass()} type="file" accept="image/*" onChange={(event) => update("brand_logo", event.target.files?.[0] || null)} />
            <ImagePreview src={settings.brand_logo || settings.tenant_logo} label="Logo" />
          </Field>
          <Field label="Banner Image">
            <input className={inputClass()} type="file" accept="image/*" onChange={(event) => update("banner_image", event.target.files?.[0] || null)} />
            <ImagePreview src={settings.banner_image} label="Banner" />
          </Field>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Hero Section</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Kicker">
              <input className={inputClass()} value={form.hero_kicker || ""} onChange={(event) => update("hero_kicker", event.target.value)} />
            </Field>
            <Field label="Hero Title">
              <input className={inputClass()} value={form.hero_title || ""} onChange={(event) => update("hero_title", event.target.value)} />
            </Field>
            <Field label="Hero Subtitle" wide>
              <textarea className={inputClass()} rows="4" value={form.hero_subtitle || ""} onChange={(event) => update("hero_subtitle", event.target.value)} />
            </Field>
            <Field label="Primary Button">
              <input className={inputClass()} value={form.hero_primary_label || ""} onChange={(event) => update("hero_primary_label", event.target.value)} />
            </Field>
            <Field label="Primary Link">
              <input className={inputClass()} value={form.hero_primary_url || ""} onChange={(event) => update("hero_primary_url", event.target.value)} />
            </Field>
            <Field label="Secondary Button">
              <input className={inputClass()} value={form.hero_secondary_label || ""} onChange={(event) => update("hero_secondary_label", event.target.value)} />
            </Field>
            <Field label="Secondary Link">
              <input className={inputClass()} value={form.hero_secondary_url || ""} onChange={(event) => update("hero_secondary_url", event.target.value)} />
            </Field>
            <Field label="Hero Image" wide>
              <input className={inputClass()} type="file" accept="image/*" onChange={(event) => update("hero_image", event.target.files?.[0] || null)} />
              <ImagePreview src={settings.hero_image} label="Hero" />
            </Field>
          </div>
        </div>

        <div className="rounded-md bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">About Page</h2>
          <div className="grid gap-4">
            <Field label="About Title">
              <input className={inputClass()} value={form.about_title || ""} onChange={(event) => update("about_title", event.target.value)} />
            </Field>
            <Field label="About Body">
              <textarea className={inputClass()} rows="6" value={form.about_body || ""} onChange={(event) => update("about_body", event.target.value)} />
            </Field>
            <Field label="Highlights">
              <textarea className={inputClass()} rows="4" value={form.about_highlights_text || ""} onChange={(event) => update("about_highlights_text", event.target.value)} />
            </Field>
            <Field label="About Image">
              <input className={inputClass()} type="file" accept="image/*" onChange={(event) => update("about_image", event.target.files?.[0] || null)} />
              <ImagePreview src={settings.about_image} label="About" />
            </Field>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Contact Page</h2>
          <div className="grid gap-4">
            <Field label="Contact Title">
              <input className={inputClass()} value={form.contact_title || ""} onChange={(event) => update("contact_title", event.target.value)} />
            </Field>
            <Field label="Contact Body">
              <textarea className={inputClass()} rows="4" value={form.contact_body || ""} onChange={(event) => update("contact_body", event.target.value)} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <input className={inputClass()} value={form.contact_email || ""} onChange={(event) => update("contact_email", event.target.value)} />
              </Field>
              <Field label="Phone">
                <input className={inputClass()} value={form.contact_phone || ""} onChange={(event) => update("contact_phone", event.target.value)} />
              </Field>
            </div>
            <Field label="Address">
              <textarea className={inputClass()} rows="3" value={form.contact_address || ""} onChange={(event) => update("contact_address", event.target.value)} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Office Hours">
                <input className={inputClass()} value={form.office_hours || ""} onChange={(event) => update("office_hours", event.target.value)} />
              </Field>
              <Field label="Map Link">
                <input className={inputClass()} value={form.map_url || ""} onChange={(event) => update("map_url", event.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Chat, Communication, SEO</h2>
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={Boolean(form.chat_enabled)} onChange={(event) => update("chat_enabled", event.target.checked)} />
              Enable public chat form
            </label>
            <Field label="Chat Title">
              <input className={inputClass()} value={form.chat_title || ""} onChange={(event) => update("chat_title", event.target.value)} />
            </Field>
            <Field label="Chat Welcome Message">
              <input className={inputClass()} value={form.chat_welcome_message || ""} onChange={(event) => update("chat_welcome_message", event.target.value)} />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="WhatsApp">
                <input className={inputClass()} value={form.whatsapp_number || ""} onChange={(event) => update("whatsapp_number", event.target.value)} />
              </Field>
              <Field label="Telegram URL">
                <input className={inputClass()} value={form.telegram_url || ""} onChange={(event) => update("telegram_url", event.target.value)} />
              </Field>
              <Field label="Messenger URL">
                <input className={inputClass()} value={form.messenger_url || ""} onChange={(event) => update("messenger_url", event.target.value)} />
              </Field>
            </div>
            <Field label="SEO Title">
              <input className={inputClass()} value={form.seo_title || ""} onChange={(event) => update("seo_title", event.target.value)} />
            </Field>
            <Field label="SEO Description">
              <textarea className={inputClass()} rows="3" value={form.seo_description || ""} onChange={(event) => update("seo_description", event.target.value)} />
            </Field>
            <Field label="SEO Keywords">
              <input className={inputClass()} value={form.seo_keywords || ""} onChange={(event) => update("seo_keywords", event.target.value)} />
            </Field>
            <Field label="Social Image">
              <input className={inputClass()} type="file" accept="image/*" onChange={(event) => update("social_image", event.target.files?.[0] || null)} />
              <ImagePreview src={settings.social_image} label="Social" />
            </Field>
            <Field label="Footer Note">
              <input className={inputClass()} value={form.footer_note || ""} onChange={(event) => update("footer_note", event.target.value)} />
            </Field>
          </div>
        </div>
      </div>
    </form>
  );
}

function ContentManager({ config, resource }) {
  const [form, setForm] = useState(config.empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setForm(config.empty);
    setEditingId(null);
    setError("");
  };

  const edit = (row) => {
    const next = { ...config.empty, ...row };
    config.fields.forEach((field) => {
      if (field.type === "datetime") next[field.key] = toDateTimeLocal(row[field.key]);
      if (field.type === "date") next[field.key] = toDateValue(row[field.key]);
    });
    setForm(next);
    setEditingId(row.id);
    setError("");
  };

  const validate = () => {
    const missing = config.fields.find((field) => field.required && !String(form[field.key] || "").trim());
    if (missing) return `${missing.label} is required.`;
    return "";
  };

  const save = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setMessage("");
    setError("");
    try {
      const payload = normalizePayloadForFields(form, config.fields);
      const formData = buildFormData(payload, config.imageFields);
      if (editingId) {
        await instance.patch(`${config.endpoint}${editingId}/`, formData);
        setMessage(`${config.title} item updated.`);
      } else {
        await instance.post(config.endpoint, formData);
        setMessage(`${config.title} item created.`);
      }
      reset();
      await resource.refetch();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save item.");
    }
  };

  const deleteItem = async (row) => {
    if (!window.confirm(`Delete ${row.title}?`)) return;
    await instance.delete(`${config.endpoint}${row.id}/`);
    setMessage("Item deleted.");
    await resource.refetch();
  };

  const togglePublish = async (row) => {
    const action = row.is_published ? "unpublish" : "publish";
    await instance.post(`${config.endpoint}${row.id}/${action}/`);
    setMessage(row.is_published ? "Item unpublished." : "Item published.");
    await resource.refetch();
  };

  return (
    <div className="space-y-6">
      <StatusMessage message={message} error={error || resource.error} />
      <form className="rounded-md bg-white p-4 shadow-sm" onSubmit={save}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">{editingId ? `Edit ${config.title}` : `Create ${config.title}`}</h2>
          <button type="button" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={reset}>
            <Plus size={16} />
            New
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => (
            <Field key={field.key} label={field.label} wide={field.type === "textarea" || field.type === "file"}>
              {field.type === "textarea" ? (
                <textarea className={inputClass()} rows="4" value={form[field.key] || ""} onChange={(event) => update(field.key, event.target.value)} />
              ) : field.type === "file" ? (
                <>
                  <input className={inputClass()} type="file" accept="image/*" onChange={(event) => update(field.key, event.target.files?.[0] || null)} />
                  <ImagePreview src={form[field.key]} label={field.label} />
                </>
              ) : field.type === "checkbox" ? (
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                  <input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => update(field.key, event.target.checked)} />
                  {field.label}
                </label>
              ) : (
                <input
                  className={inputClass()}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                  value={form[field.key] ?? ""}
                  onChange={(event) => update(field.key, event.target.value)}
                />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
            <Save size={16} />
            Save
          </button>
          <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" onClick={reset}>
            Reset
          </button>
        </div>
      </form>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">{config.title} List</h2>
        {resource.loading ? <div className="text-sm text-slate-500">Loading...</div> : null}
        <div className="grid gap-3">
          {resource.results.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[80px_1fr_auto] md:items-center">
              <img className="h-20 w-20 rounded-md object-cover" src={mediaUrl(row.image) || "/school-image.png"} alt={row.title} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{row.title}</h3>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${row.is_published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {row.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{row.summary || row.description || row.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => edit(row)}>
                  <Pencil size={15} />
                  Edit
                </button>
                <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => togglePublish(row)}>
                  {row.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                  {row.is_published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => deleteItem(row)}>
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!resource.loading && resource.results.length === 0 ? <div className="rounded-md border border-slate-200 p-6 text-center text-sm text-slate-500">No items yet.</div> : null}
        </div>
      </section>
    </div>
  );
}

function CommentModerationManager({ resource }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pendingCount = useMemo(() => resource.results.filter((item) => item.status === "pending").length, [resource.results]);

  const moderate = async (row, action) => {
    setMessage("");
    setError("");
    try {
      await instance.post(`/v1/online-page/comments/${row.id}/${action}/`);
      setMessage(action === "approve" ? "Comment approved." : action === "hide" ? "Comment hidden." : "Comment marked as spam.");
      await resource.refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update comment.");
    }
  };

  const deleteComment = async (row) => {
    if (!window.confirm(`Delete comment from ${row.visitor_name}?`)) return;
    await instance.delete(`/v1/online-page/comments/${row.id}/`);
    setMessage("Comment deleted.");
    await resource.refetch();
  };

  return (
    <div className="space-y-6">
      <StatusMessage message={message} error={error || resource.error} />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Comments</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{resource.results.length}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending Review</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-700">{pendingCount}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{resource.results.filter((item) => item.status === "approved").length}</p>
        </div>
      </div>
      <section className="rounded-md bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Post Comments</h2>
        <div className="grid gap-3">
          {resource.results.map((row) => (
            <article key={row.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{row.visitor_name}</h3>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{row.status}</span>
                    {row.is_spam ? <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Spam</span> : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{row.post_title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700" onClick={() => moderate(row, "approve")}>Approve</button>
                  <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => moderate(row, "hide")}>Hide</button>
                  <button type="button" className="rounded-md border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700" onClick={() => moderate(row, "spam")}>Spam</button>
                  <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => deleteComment(row)}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{row.body}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                {row.visitor_email ? <span>{row.visitor_email}</span> : null}
                {row.created_at ? <span>{new Date(row.created_at).toLocaleString()}</span> : null}
              </div>
            </article>
          ))}
          {!resource.loading && resource.results.length === 0 ? <div className="rounded-md border border-slate-200 p-6 text-center text-sm text-slate-500">No comments yet.</div> : null}
        </div>
      </section>
    </div>
  );
}

function InquiryManager({ resource }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const unreadCount = useMemo(() => resource.results.filter((item) => item.status === "new").length, [resource.results]);

  const updateStatus = async (row, status) => {
    setMessage("");
    setError("");
    try {
      await instance.patch(`/v1/online-page/inquiries/${row.id}/`, { status });
      setMessage("Message status updated.");
      await resource.refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update message.");
    }
  };

  const deleteMessage = async (row) => {
    if (!window.confirm(`Delete message from ${row.visitor_name}?`)) return;
    await instance.delete(`/v1/online-page/inquiries/${row.id}/`);
    setMessage("Message deleted.");
    await resource.refetch();
  };

  return (
    <div className="space-y-6">
      <StatusMessage message={message} error={error || resource.error} />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Messages</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{resource.results.length}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">New</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-700">{unreadCount}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Sources</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{new Set(resource.results.map((item) => item.source)).size}</p>
        </div>
      </div>
      <section className="rounded-md bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Contact and Chat Messages</h2>
        <div className="grid gap-3">
          {resource.results.map((row) => (
            <article key={row.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{row.visitor_name}</h3>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{row.source}</span>
                    <span className="rounded bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">{row.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{row.subject || "No subject"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select className={inputClass()} value={row.status} onChange={(event) => updateStatus(row, event.target.value)}>
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => deleteMessage(row)}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{row.source === "chat" ? "Visitor question" : "Contact message"}</p>
                <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{row.message}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                {row.visitor_email ? <span className="inline-flex items-center gap-1"><Mail size={15} /> {row.visitor_email}</span> : null}
                {row.visitor_phone ? <span>{row.visitor_phone}</span> : null}
              </div>
            </article>
          ))}
          {!resource.loading && resource.results.length === 0 ? <div className="rounded-md border border-slate-200 p-6 text-center text-sm text-slate-500">No public messages yet.</div> : null}
        </div>
      </section>
    </div>
  );
}

export default function OnlinePageManager() {
  const [activeTab, setActiveTab] = useState("settings");
  const courses = useApiResource("/v1/online-page/courses/");
  const announcements = useApiResource("/v1/online-page/announcements/");
  const comments = useApiResource("/v1/online-page/comments/");
  const events = useApiResource("/v1/online-page/events/");
  const achievements = useApiResource("/v1/online-page/achievements/");
  const inquiries = useApiResource("/v1/online-page/inquiries/");

  const resources = {
    courses,
    announcements,
    comments,
    events,
    achievements,
    inquiries,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online Page Manager"
        description="Manage the public website content for this education center."
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />)}
      </div>
      {activeTab === "settings" ? <SettingsManager /> : null}
      {["courses", "announcements", "events", "achievements"].includes(activeTab) ? (
        <ContentManager config={contentConfigs[activeTab]} resource={resources[activeTab]} />
      ) : null}
      {activeTab === "comments" ? <CommentModerationManager resource={comments} /> : null}
      {activeTab === "inquiries" ? <InquiryManager resource={inquiries} /> : null}
    </div>
  );
}
