import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getArticlesByCategory } from "../../data/documentationContent";
import { classNames, slugToPath } from "./documentationUtils";

export default function DocumentationCategory({ category, activeSlug, onNavigate, darkMode = false }) {
  const articles = getArticlesByCategory(category.id);

  return (
    <section>
      <div className={classNames("mb-2 px-3 text-xs font-semibold uppercase tracking-wide", darkMode ? "text-slate-500" : "text-slate-500")}>
        {category.title}
      </div>
      <div className="space-y-1">
        {articles.map((article) => {
          const active = article.slug === activeSlug;
          return (
            <Link
              key={article.slug}
              to={slugToPath(article.slug)}
              onClick={onNavigate}
              className={classNames(
                "group flex items-center justify-between rounded-md px-3 py-2 text-sm transition",
                active
                  ? darkMode
                    ? "bg-cyan-400/10 text-cyan-200"
                    : "bg-cyan-50 text-cyan-800"
                  : darkMode
                    ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <span className="min-w-0 truncate">{article.title}</span>
              {active ? <ChevronRight size={15} /> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
