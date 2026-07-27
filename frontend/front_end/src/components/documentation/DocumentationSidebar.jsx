import { BookOpen, X } from "lucide-react";
import { documentationCategories } from "../../data/documentationContent";
import DocumentationCategory from "./DocumentationCategory";
import { classNames } from "./documentationUtils";

export default function DocumentationSidebar({ activeSlug, open, onClose, darkMode = false }) {
  const content = (
    <div className="flex h-full flex-col">
      <div className={classNames("flex items-center gap-2 border-b px-4 py-4", darkMode ? "border-slate-800" : "border-slate-200")}>
        <div className={classNames("rounded-md p-2", darkMode ? "bg-cyan-400/10 text-cyan-200" : "bg-cyan-50 text-cyan-700")}>
          <BookOpen size={18} />
        </div>
        <div className="min-w-0">
          <div className={classNames("text-sm font-semibold", darkMode ? "text-white" : "text-slate-950")}>Help Center</div>
          <div className={classNames("text-xs", darkMode ? "text-slate-500" : "text-slate-500")}>Product manual</div>
        </div>
        <button className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close documentation menu">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {documentationCategories.map((category) => (
          <DocumentationCategory key={category.id} category={category} activeSlug={activeSlug} onNavigate={onClose} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className={classNames("hidden h-full w-72 shrink-0 border-r lg:block", darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
        {content}
      </aside>
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-slate-950/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
        <aside
          className={classNames(
            "absolute inset-y-0 left-0 w-80 max-w-[86vw] transform shadow-2xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
            darkMode ? "bg-slate-950" : "bg-white",
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
