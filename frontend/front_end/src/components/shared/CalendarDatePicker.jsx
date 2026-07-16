import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CALENDAR_TYPES,
  ENGLISH_SHAMSI_MONTHS,
  formatDate,
  normalizeDateInput,
  parseDate,
  shamsiMonthLength,
  toGregorian,
  toShamsi,
} from "../../utils/calendar";
import { useCalendar } from "../../hooks/useCalendar";

function inputClass(className = "") {
  return `w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600 ${className}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthOffset({ year, month }, offset) {
  const monthIndex = year * 12 + (month - 1) + offset;
  return {
    year: Math.floor(monthIndex / 12),
    month: (monthIndex % 12) + 1,
  };
}

function ShamsiCalendarPopover({ value, locale, onSelect, onClear, onClose }) {
  const selected = toShamsi(value) || toShamsi(todayIso());
  const today = toShamsi(todayIso());
  const [view, setView] = useState({ year: selected.year, month: selected.month });
  const daysInMonth = shamsiMonthLength(view.year, view.month);
  const firstGregorian = toGregorian(view.year, view.month, 1);
  const firstWeekday = firstGregorian ? (new Date(firstGregorian).getDay() + 1) % 7 : 0;
  const monthLabel = locale === "en" ? ENGLISH_SHAMSI_MONTHS[view.month - 1] : ENGLISH_SHAMSI_MONTHS[view.month - 1];
  const weekDays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const selectDay = (day) => {
    const iso = toGregorian(view.year, view.month, day);
    if (iso) onSelect(iso);
  };

  return (
    <div
      className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white p-3 shadow-xl"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
          onClick={() => setView((current) => monthOffset(current, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-semibold text-gray-900">
          {monthLabel} {view.year}
        </div>
        <button
          type="button"
          className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
          onClick={() => setView((current) => monthOffset(current, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400">
        {weekDays.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isSelected = selected?.year === view.year && selected?.month === view.month && selected?.day === day;
          const isToday = today?.year === view.year && today?.month === view.month && today?.day === day;
          return (
            <button
              type="button"
              key={day}
              className={`h-8 rounded-md text-sm ${
                isSelected
                  ? "bg-cyan-700 font-semibold text-white"
                  : isToday
                    ? "border border-cyan-200 bg-cyan-50 font-semibold text-cyan-800"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => selectDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <button type="button" className="text-xs font-medium text-gray-500 hover:text-gray-800" onClick={onClear}>
          Clear
        </button>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700" onClick={() => onSelect(todayIso())}>
            Today
          </button>
          <button type="button" className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarDatePicker({
  module = "dashboard",
  value,
  onChange,
  locale = "fa-AF",
  className = "",
  ...props
}) {
  const { calendar } = useCalendar(module);
  const displayValue = useMemo(() => formatDate(value, { calendar, locale }), [calendar, locale, value]);
  const [draftValue, setDraftValue] = useState(displayValue);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const suppressOpenUntilRef = useRef(0);

  useEffect(() => {
    setDraftValue(displayValue);
  }, [displayValue]);

  const commitShamsiValue = (nextValue) => {
    const normalized = normalizeDateInput(nextValue);
    setDraftValue(normalized);

    if (!normalized) {
      onChange?.("");
      return;
    }

    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(normalized)) return;

    const parsed = parseDate(normalized, calendar);
    if (parsed) onChange?.(parsed);
  };

  const closePicker = () => {
    suppressOpenUntilRef.current = Date.now() + 250;
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const openPicker = () => {
    if (Date.now() < suppressOpenUntilRef.current) return;
    setIsOpen(true);
  };

  const selectShamsiValue = (nextValue) => {
    onChange?.(nextValue);
    setDraftValue(formatDate(nextValue, { calendar, locale }));
    closePicker();
  };

  const clearShamsiValue = () => {
    onChange?.("");
    setDraftValue("");
    closePicker();
  };

  if (calendar === CALENDAR_TYPES.gregorian) {
    return (
      <input
        {...props}
        type="date"
        className={inputClass(className)}
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  return (
    <div className="relative block">
      <button
        type="button"
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (isOpen) {
            closePicker();
          } else {
            openPicker();
          }
        }}
        aria-label="Open calendar"
      >
        <CalendarDays size={16} />
      </button>
      <input
        {...props}
        ref={inputRef}
        dir={locale === "en" ? "ltr" : "rtl"}
        className={`${inputClass(className)} pl-9`}
        placeholder="1405-01-01"
        value={draftValue}
        onFocus={openPicker}
        onChange={(event) => commitShamsiValue(event.target.value)}
        onBlur={() => {
          setDraftValue(formatDate(value, { calendar, locale }));
          setIsOpen(false);
        }}
        inputMode="numeric"
      />
      {isOpen ? (
        <ShamsiCalendarPopover
          value={value}
          locale={locale}
          onSelect={selectShamsiValue}
          onClear={clearShamsiValue}
          onClose={closePicker}
        />
      ) : null}
    </div>
  );
}

export function CalendarDateRangePicker({
  module = "reports",
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  locale = "fa-AF",
  startLabel = "Start date",
  endLabel = "End date",
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-medium text-gray-700">{startLabel}</span>
        <CalendarDatePicker module={module} locale={locale} value={startValue || ""} onChange={onStartChange} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-gray-700">{endLabel}</span>
        <CalendarDatePicker module={module} locale={locale} value={endValue || ""} onChange={onEndChange} />
      </label>
    </div>
  );
}
