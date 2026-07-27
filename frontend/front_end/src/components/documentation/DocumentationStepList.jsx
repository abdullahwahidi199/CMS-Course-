import { highlightText } from "./documentationUtils";

export default function DocumentationStepList({ items = [], query = "", darkMode = false }) {
  return (
    <ol className="my-5 space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              darkMode ? "bg-cyan-400 text-slate-950" : "bg-cyan-700 text-white"
            }`}
          >
            {index + 1}
          </span>
          <span className={darkMode ? "pt-0.5 text-sm leading-7 text-slate-200" : "pt-0.5 text-sm leading-7 text-slate-700"}>
            {highlightText(item, query)}
          </span>
        </li>
      ))}
    </ol>
  );
}
