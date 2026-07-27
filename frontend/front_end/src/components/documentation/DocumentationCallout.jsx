import { AlertTriangle, CheckCircle2, Info, Lightbulb, MessageSquareText, ShieldAlert, Sparkles } from "lucide-react";
import { classNames, highlightText } from "./documentationUtils";

const calloutStyles = {
  note: {
    icon: Info,
    light: "border-sky-200 bg-sky-50 text-sky-900",
    dark: "border-sky-500/30 bg-sky-950/40 text-sky-100",
    label: "Note",
  },
  tip: {
    icon: Lightbulb,
    light: "border-emerald-200 bg-emerald-50 text-emerald-900",
    dark: "border-emerald-500/30 bg-emerald-950/40 text-emerald-100",
    label: "Tip",
  },
  warning: {
    icon: AlertTriangle,
    light: "border-amber-200 bg-amber-50 text-amber-900",
    dark: "border-amber-500/30 bg-amber-950/40 text-amber-100",
    label: "Warning",
  },
  important: {
    icon: ShieldAlert,
    light: "border-rose-200 bg-rose-50 text-rose-900",
    dark: "border-rose-500/30 bg-rose-950/40 text-rose-100",
    label: "Important",
  },
  success: {
    icon: CheckCircle2,
    light: "border-teal-200 bg-teal-50 text-teal-900",
    dark: "border-teal-500/30 bg-teal-950/40 text-teal-100",
    label: "Success",
  },
  example: {
    icon: MessageSquareText,
    light: "border-violet-200 bg-violet-50 text-violet-900",
    dark: "border-violet-500/30 bg-violet-950/40 text-violet-100",
    label: "Example",
  },
};

export default function DocumentationCallout({ variant = "note", title, children, darkMode = false, query = "" }) {
  const style = calloutStyles[variant] || calloutStyles.note;
  const Icon = style.icon || Sparkles;

  return (
    <aside className={classNames("my-5 rounded-lg border p-4", darkMode ? style.dark : style.light)}>
      <div className="flex gap-3">
        <Icon size={18} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title || style.label}</div>
          <div className="mt-1 text-sm leading-6 opacity-90">{typeof children === "string" ? highlightText(children, query) : children}</div>
        </div>
      </div>
    </aside>
  );
}
