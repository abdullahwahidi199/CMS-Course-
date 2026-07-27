import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategoryById } from "../../data/documentationContent";

export default function DocumentationBreadcrumb({ article, darkMode = false }) {
  const category = getCategoryById(article.category);
  const muted = darkMode ? "text-slate-400" : "text-slate-500";
  const active = darkMode ? "text-slate-100" : "text-slate-900";

  return (
    <nav className={`flex flex-wrap items-center gap-1 text-xs ${muted}`} aria-label="Documentation breadcrumb">
      <Link to="/admin/dashboard/documentation" className="inline-flex items-center gap-1 hover:text-cyan-600">
        <Home size={13} /> Documentation
      </Link>
      <ChevronRight size={13} />
      <span>{category?.title || "Documentation"}</span>
      <ChevronRight size={13} />
      <span className={`font-medium ${active}`}>{article.title}</span>
    </nav>
  );
}
