import DocumentationCallout from "./DocumentationCallout";
import DocumentationStepList from "./DocumentationStepList";
import { highlightText } from "./documentationUtils";

function TextList({ items = [], query = "", darkMode = false }) {
  return (
    <ul className="my-5 space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-7">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${darkMode ? "bg-cyan-300" : "bg-cyan-700"}`} />
          <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{highlightText(item, query)}</span>
        </li>
      ))}
    </ul>
  );
}

function FaqBlock({ items = [], query = "", darkMode = false }) {
  return (
    <div className={`my-5 divide-y rounded-lg border ${darkMode ? "divide-slate-800 border-slate-800 bg-slate-900" : "divide-slate-200 border-slate-200 bg-white"}`}>
      {items.map((item) => (
        <details key={item.question} className="group p-4" open>
          <summary className={`cursor-pointer text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
            {highlightText(item.question, query)}
          </summary>
          <p className={`mt-2 text-sm leading-7 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{highlightText(item.answer, query)}</p>
        </details>
      ))}
    </div>
  );
}

function renderBlock(block, query, darkMode) {
  if (block.type === "paragraph") {
    return (
      <p key={block.text} className={darkMode ? "my-4 text-sm leading-7 text-slate-300" : "my-4 text-sm leading-7 text-slate-700"}>
        {highlightText(block.text, query)}
      </p>
    );
  }

  if (block.type === "list") {
    return <TextList key={block.items.join("|")} items={block.items} query={query} darkMode={darkMode} />;
  }

  if (block.type === "steps") {
    return <DocumentationStepList key={block.items.join("|")} items={block.items} query={query} darkMode={darkMode} />;
  }

  if (block.type === "callout") {
    return (
      <DocumentationCallout key={`${block.variant}-${block.title}`} variant={block.variant} title={block.title} darkMode={darkMode} query={query}>
        {block.text}
      </DocumentationCallout>
    );
  }

  if (block.type === "faq") {
    return <FaqBlock key={block.items.map((item) => item.question).join("|")} items={block.items} query={query} darkMode={darkMode} />;
  }

  return null;
}

export default function DocumentationSection({ section, query = "", darkMode = false }) {
  return (
    <section id={section.id} className={`scroll-mt-24 border-t py-7 first:border-t-0 first:pt-0 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
      <h2 className={darkMode ? "text-xl font-semibold text-slate-50" : "text-xl font-semibold text-slate-950"}>
        {highlightText(section.title, query)}
      </h2>
      {section.blocks.map((block) => renderBlock(block, query, darkMode))}
    </section>
  );
}
