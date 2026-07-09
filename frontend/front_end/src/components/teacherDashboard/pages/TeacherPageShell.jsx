export default function TeacherPageShell({ title, description, children }) {
  return (
    <div className="space-y-5">
      <div>
        <nav className="mb-1 text-sm text-slate-500">Teacher Portal / {title}</nav>
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
