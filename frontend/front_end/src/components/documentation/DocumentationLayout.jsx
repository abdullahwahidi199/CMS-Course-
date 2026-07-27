import { Menu, Moon, Sun } from "lucide-react";
import DocumentationSearch from "./DocumentationSearch";
import DocumentationSidebar from "./DocumentationSidebar";
import DocumentationTableOfContents from "./DocumentationTableOfContents";
import { classNames } from "./documentationUtils";

export default function DocumentationLayout({
  activeSlug,
  article,
  children,
  query,
  onQueryChange,
  sidebarOpen,
  onSidebarOpen,
  onSidebarClose,
  darkMode,
  onDarkModeToggle,
}) {
  return (
    <div className={classNames("min-h-[calc(100vh-7rem)] overflow-hidden rounded-lg border shadow-sm", darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
      <div className={classNames("border-b px-4 py-4 lg:px-5", darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className={classNames("rounded-md border p-2 lg:hidden", darkMode ? "border-slate-800 text-slate-200" : "border-slate-200 text-slate-700")}
              onClick={onSidebarOpen}
              aria-label="Open documentation menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className={classNames("truncate text-xl font-semibold", darkMode ? "text-white" : "text-slate-950")}>Documentation</h1>
              <p className={classNames("mt-0.5 text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>Official in-app product manual for daily school workflows.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:min-w-[32rem]">
            <DocumentationSearch query={query} onQueryChange={onQueryChange} darkMode={darkMode} />
            <button
              type="button"
              onClick={onDarkModeToggle}
              className={classNames(
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-700",
              )}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span className="sm:hidden">{darkMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-12rem)]">
        <DocumentationSidebar activeSlug={activeSlug} open={sidebarOpen} onClose={onSidebarClose} darkMode={darkMode} />
        <main className={classNames("min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8", darkMode ? "bg-slate-950" : "bg-white")}>
          <div className="flex gap-10">
            <div className="min-w-0 flex-1">{children}</div>
            <DocumentationTableOfContents headings={article.headings} darkMode={darkMode} />
          </div>
        </main>
      </div>
    </div>
  );
}
