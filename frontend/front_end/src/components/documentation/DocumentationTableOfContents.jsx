import { ListTree } from "lucide-react";
import { classNames } from "./documentationUtils";

export default function DocumentationTableOfContents({ headings = [], darkMode = false }) {
  if (!headings.length) return null;

  return (
    <aside className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-24">
        <div className={classNames("mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", darkMode ? "text-slate-500" : "text-slate-500")}>
          <ListTree size={14} /> On This Page
        </div>
        <nav className={classNames("border-l pl-4", darkMode ? "border-slate-800" : "border-slate-200")}>
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={classNames(
                "block py-1.5 text-sm leading-5 transition",
                darkMode ? "text-slate-400 hover:text-cyan-200" : "text-slate-500 hover:text-cyan-700",
              )}
            >
              {heading.title}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
