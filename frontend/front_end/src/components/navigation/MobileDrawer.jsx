import { X } from "lucide-react";
import { useRef } from "react";
import Sidebar from "./Sidebar";

export default function MobileDrawer({ open, onClose }) {
  const touchStart = useRef(null);

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-slate-950/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute inset-y-0 left-0 w-80 max-w-[86vw] transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchStart.current !== null && touchStart.current - event.changedTouches[0].clientX > 70) onClose();
          touchStart.current = null;
        }}
      >
        <button className="absolute right-3 top-3 z-10 rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
        <Sidebar collapsed={false} onCollapsedChange={() => {}} onNavigate={onClose} />
      </div>
    </div>
  );
}
