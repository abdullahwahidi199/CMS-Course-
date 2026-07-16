export const CALENDAR_TYPES = {
  gregorian: "gregorian",
  shamsi: "shamsi",
  inherit: "inherit",
};

export const CALENDAR_MODULES = [
  "admissions",
  "students",
  "attendance",
  "teachers",
  "classes",
  "exams",
  "assessments",
  "fees",
  "expenses",
  "invoices",
  "payroll",
  "schedules",
  "reports",
  "certificates",
  "notifications",
  "dashboard",
  "inventory",
];

export const DARI_MONTHS = [
  "حمل",
  "ثور",
  "جوزا",
  "سرطان",
  "اسد",
  "سنبله",
  "میزان",
  "عقرب",
  "قوس",
  "جدی",
  "دلو",
  "حوت",
];
export const PASHTO_MONTHS = [
  "وری",
  "غویی",
  "غبرګولی",
  "چنګاښ",
  "زمری",
  "وږی",
  "تله",
  "لړم",
  "لیندۍ",
  "مرغومی",
  "سلواغه",
  "کب",
];
export const ENGLISH_SHAMSI_MONTHS = [
  "Hamal",
  "Sawr",
  "Jawza",
  "Saratan",
  "Asad",
  "Sunbula",
  "Mizan",
  "Aqrab",
  "Qaws",
  "Jadi",
  "Dalwa",
  "Hut",
];

export const defaultCalendarSettings = {
  default_calendar: CALENDAR_TYPES.shamsi,
  ...Object.fromEntries(
    CALENDAR_MODULES.map((module) => [
      `${module}_calendar`,
      CALENDAR_TYPES.inherit,
    ]),
  ),
};

const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];
const div = (a, b) => Math.floor(a / b);
const mod = (a, b) => a - Math.floor(a / b) * b;
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDateInput(value) {
  return String(value || "")
    .trim()
    .replace(/[۰-۹]/g, (digit) => PERSIAN_DIGITS.indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => ARABIC_DIGITS.indexOf(digit))
    .replace(/[./\s]+/g, "-")
    .replace(/-+/g, "-");
}

function jalaliCal(jy) {
  let gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function dateFromIso(value) {
  if (!value) return null;
  if (value instanceof Date)
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isoFromDate(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toShamsi(value) {
  const date = dateFromIso(value);
  if (!date) return null;
  const gy = date.getFullYear();
  let jy = gy - 621;
  const r = jalaliCal(jy);
  const farvardin = new Date(gy, 2, r.march);
  let k = Math.round((date - farvardin) / 86400000);
  if (k >= 0) {
    if (k <= 185)
      return { year: jy, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { year: jy, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
}

export function isShamsiLeapYear(year) {
  return jalaliCal(Number(year)).leap === 0;
}

export function shamsiMonthLength(year, month) {
  const numericMonth = Number(month);
  if (numericMonth <= 6) return 31;
  if (numericMonth <= 11) return 30;
  return isShamsiLeapYear(year) ? 30 : 29;
}

export function toGregorian(yearOrValue, month, day) {
  let year = yearOrValue;
  if (typeof yearOrValue === "string") {
    [year, month, day] = normalizeDateInput(yearOrValue).split("-").map(Number);
  }
  if (!year || !month || !day) return "";
  if (
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(day) < 1 ||
    Number(day) > 31
  )
    return "";
  if (Number(month) > 6 && Number(day) > 30) return "";
  if (Number(year) < 1700 && Number(day) > shamsiMonthLength(year, month))
    return "";
  if (Number(year) >= 1700)
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const r = jalaliCal(Number(year));
  const dayNo =
    (Number(month) - 1) * 31 -
    div(Number(month), 7) * (Number(month) - 7) +
    Number(day) -
    1;
  const date = new Date(r.gy, 2, r.march + dayNo);
  return isoFromDate(date);
}

export function parseDate(value, calendar = CALENDAR_TYPES.shamsi) {
  if (!value) return "";
  if (calendar === CALENDAR_TYPES.gregorian)
    return normalizeDateInput(value).slice(0, 10);
  return toGregorian(String(value));
}

function shamsiMonthNames(locale = "fa-AF") {
  if (locale === "ps-AF") return PASHTO_MONTHS;
  if (locale === "en") return ENGLISH_SHAMSI_MONTHS;
  return DARI_MONTHS;
}

export function formatDate(value, options = {}) {
  const {
    calendar = CALENDAR_TYPES.shamsi,
    locale = "fa-AF",
    monthName = false,
  } = options;
  if (!value) return "";
  if (calendar === CALENDAR_TYPES.gregorian) return String(value).slice(0, 10);
  const shamsi = toShamsi(value);
  if (!shamsi) return "";
  if (monthName)
    return `${String(shamsi.day).padStart(2, "0")} ${shamsiMonthNames(locale)[shamsi.month - 1]} ${shamsi.year}`;
  return `${shamsi.year}-${String(shamsi.month).padStart(2, "0")}-${String(shamsi.day).padStart(2, "0")}`;
}

export function formatDateTime(value, options = {}) {
  if (!value) return "";
  const time = String(value).includes("T")
    ? String(value).slice(11, 16)
    : String(value).slice(11, 16);
  return `${formatDate(value, options)}${time ? ` ${time}` : ""}`;
}

export function normalizeCalendarSettings(settings = {}) {
  const normalized = { ...defaultCalendarSettings, ...settings };
  if (
    ![CALENDAR_TYPES.shamsi, CALENDAR_TYPES.gregorian].includes(
      normalized.default_calendar,
    )
  ) {
    normalized.default_calendar = CALENDAR_TYPES.shamsi;
  }
  CALENDAR_MODULES.forEach((module) => {
    const key = `${module}_calendar`;
    if (
      ![
        CALENDAR_TYPES.inherit,
        CALENDAR_TYPES.shamsi,
        CALENDAR_TYPES.gregorian,
      ].includes(normalized[key])
    ) {
      normalized[key] = CALENDAR_TYPES.inherit;
    }
  });
  return normalized;
}

export function getModuleCalendar(settings, module) {
  const normalized = normalizeCalendarSettings(settings);
  const selected = normalized[`${module}_calendar`];
  return selected && selected !== CALENDAR_TYPES.inherit
    ? selected
    : normalized.default_calendar;
}

export function formatByModule(module, date, settings, options = {}) {
  return formatDate(date, {
    ...options,
    calendar: getModuleCalendar(settings, module),
  });
}
