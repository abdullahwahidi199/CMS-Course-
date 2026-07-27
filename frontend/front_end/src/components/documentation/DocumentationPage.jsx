import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { documentationArticles, getArticleBySlug } from "../../data/documentationContent";
import DocumentationArticle from "./DocumentationArticle";
import DocumentationLayout from "./DocumentationLayout";
import { slugToPath } from "./documentationUtils";

export default function DocumentationPage() {
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("ems-docs-theme") === "dark");

  useEffect(() => {
    localStorage.setItem("ems-docs-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  if (!slug) {
    return <Navigate to={slugToPath(documentationArticles[0].slug)} replace />;
  }

  const article = getArticleBySlug(slug);

  return (
    <DocumentationLayout
      activeSlug={article.slug}
      article={article}
      query={query}
      onQueryChange={setQuery}
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      darkMode={darkMode}
      onDarkModeToggle={() => setDarkMode((value) => !value)}
    >
      <DocumentationArticle article={article} query={query} darkMode={darkMode} />
    </DocumentationLayout>
  );
}
