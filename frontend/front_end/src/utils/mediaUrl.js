export function mediaUrl(path) {
  if (!path || path instanceof File) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const apiBase = import.meta.env.VITE_API_URL || "";
  const origin = apiBase.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${origin}${normalizedPath}`;
}
