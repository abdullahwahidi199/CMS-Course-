import { FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { searchDocumentation } from "../../data/documentationContent";
import { classNames, highlightText, slugToPath } from "./documentationUtils";

export default function DocumentationSearch({ query, onQueryChange, darkMode = false }) {
  const results = searchDocumentation(query).slice(0, 8);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="relative w-full">
      <label
        className={classNames(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm",
          darkMode ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-white text-slate-500",
        )}
      >
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className={classNames("min-w-0 flex-1 bg-transparent outline-none", darkMode ? "text-slate-100 placeholder:text-slate-500" : "text-slate-900")}
          placeholder="Search documentation..."
        />
        {hasQuery ? (
          <button type="button" onClick={() => onQueryChange("")} className="rounded p-1 hover:bg-slate-100" aria-label="Clear documentation search">
            <X size={15} />
          </button>
        ) : null}
      </label>

      {hasQuery ? (
        <div
          className={classNames(
            "absolute left-0 right-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-lg border p-2 shadow-xl",
            darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white",
          )}
        >
          {results.length ? (
            results.map(({ article, matchType, excerpt }) => (
              <Link
                key={article.slug}
                to={slugToPath(article.slug)}
                onClick={() => onQueryChange("")}
                className={classNames("flex gap-3 rounded-md p-3 transition", darkMode ? "hover:bg-slate-900" : "hover:bg-slate-50")}
              >
                <FileText size={18} className={darkMode ? "mt-0.5 shrink-0 text-cyan-300" : "mt-0.5 shrink-0 text-cyan-700"} />
                <span className="min-w-0">
                  <span className={classNames("block text-sm font-semibold", darkMode ? "text-slate-100" : "text-slate-950")}>
                    {highlightText(article.title, query)}
                  </span>
                  <span className={classNames("mt-1 line-clamp-2 block text-xs leading-5", darkMode ? "text-slate-400" : "text-slate-500")}>
                    <span className="font-semibold">{matchType} match:</span> {highlightText(excerpt, query)}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <div className={classNames("rounded-md px-3 py-6 text-center text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
              No documentation results found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
