import { Fragment } from "react";

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function slugToPath(slug) {
  return `/admin/dashboard/documentation/${slug}`;
}

export function highlightText(text, query, highlightClass = "rounded bg-amber-100 px-0.5 text-amber-900") {
  const value = query.trim();
  if (!value || !text) return text;

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));

  return parts.map((part, index) => {
    const key = `${part}-${index}`;
    if (part.toLowerCase() === value.toLowerCase()) {
      return (
        <mark key={key} className={highlightClass}>
          {part}
        </mark>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}
