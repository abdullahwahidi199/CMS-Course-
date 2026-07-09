const fieldLabels = {
  password: "Password",
  username: "Username",
  email: "Email",
  email_address: "Email",
  detail: "Error",
  non_field_errors: "Error",
};

function labelFor(key) {
  return fieldLabels[key] || key.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function flattenError(value, prefix = "") {
  if (!value) return [];
  if (typeof value === "string") return [prefix ? `${prefix}: ${value}` : value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenError(item, prefix));
  }
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => flattenError(child, labelFor(key)));
  }
  return [String(value)];
}

export function formatApiError(error, fallback = "Request failed.") {
  const data = error?.response?.data || error;
  const messages = flattenError(data);
  return messages.length ? messages.join(" ") : fallback;
}
