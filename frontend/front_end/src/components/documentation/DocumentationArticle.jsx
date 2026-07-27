import { ArrowLeft, ArrowRight, Check, Clock, Copy, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getAdjacentArticles, getCategoryById } from "../../data/documentationContent";
import DocumentationBreadcrumb from "./DocumentationBreadcrumb";
import DocumentationSection from "./DocumentationSection";
import { classNames, slugToPath } from "./documentationUtils";

function ArticleNavCard({ article, direction, darkMode = false }) {
  if (!article) return <div />;
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;

  return (
    <Link
      to={slugToPath(article.slug)}
      className={classNames(
        "group rounded-lg border p-4 transition",
        darkMode ? "border-slate-800 bg-slate-900/70 hover:border-cyan-500/60" : "border-slate-200 bg-white hover:border-cyan-300 hover:shadow-sm",
      )}
    >
      <div className={classNames("mb-2 flex items-center gap-2 text-xs font-medium", darkMode ? "text-slate-500" : "text-slate-500")}>
        {direction === "previous" ? <Icon size={14} /> : null}
        {direction === "previous" ? "Previous" : "Next"}
        {direction === "next" ? <Icon size={14} className="transition group-hover:translate-x-0.5" /> : null}
      </div>
      <div className={classNames("text-sm font-semibold", darkMode ? "text-slate-100" : "text-slate-950")}>{article.title}</div>
      <div className={classNames("mt-1 text-xs leading-5", darkMode ? "text-slate-400" : "text-slate-500")}>{article.description}</div>
    </Link>
  );
}

export default function DocumentationArticle({ article, query = "", darkMode = false }) {
  const [copied, setCopied] = useState(false);
  const category = getCategoryById(article.category);
  const { previous, next } = getAdjacentArticles(article);

  const copyArticleLink = async () => {
    const url = `${window.location.origin}${slugToPath(article.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto w-full max-w-3xl">
      <DocumentationBreadcrumb article={article} darkMode={darkMode} />

      <header className="py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={classNames(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              darkMode ? "bg-cyan-400/10 text-cyan-200" : "bg-cyan-50 text-cyan-700",
            )}
          >
            {category?.title || "Documentation"}
          </span>
          <span className={classNames("inline-flex items-center gap-1 text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
            <Clock size={14} /> {article.readingTime} min read
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className={classNames("text-3xl font-semibold tracking-normal sm:text-4xl", darkMode ? "text-white" : "text-slate-950")}>
              {article.title}
            </h1>
            <p className={classNames("mt-3 text-base leading-7", darkMode ? "text-slate-300" : "text-slate-600")}>{article.description}</p>
          </div>

          <button
            onClick={copyArticleLink}
            className={classNames(
              "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
              darkMode ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300",
            )}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>

        <div className={classNames("mt-5 flex flex-wrap gap-2", darkMode ? "text-slate-300" : "text-slate-600")}>
          {article.keywords.slice(0, 6).map((keyword) => (
            <span key={keyword} className={classNames("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", darkMode ? "border-slate-800" : "border-slate-200")}>
              <LinkIcon size={12} /> {keyword}
            </span>
          ))}
        </div>
      </header>

      <div className="pb-8">
        {article.sections.map((section) => (
          <DocumentationSection key={section.id} section={section} query={query} darkMode={darkMode} />
        ))}
      </div>

      <footer className={classNames("grid gap-3 border-t pt-6 sm:grid-cols-2", darkMode ? "border-slate-800" : "border-slate-200")}>
        <ArticleNavCard article={previous} direction="previous" darkMode={darkMode} />
        <ArticleNavCard article={next} direction="next" darkMode={darkMode} />
      </footer>
    </article>
  );
}
