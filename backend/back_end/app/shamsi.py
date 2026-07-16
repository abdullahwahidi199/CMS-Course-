from datetime import date, datetime, time, timedelta

from django.db import models
from django.utils import timezone
from rest_framework import serializers


CALENDAR_GREGORIAN = "gregorian"
CALENDAR_SHAMSI = "shamsi"
CALENDAR_INHERIT = "inherit"

CALENDAR_MODULES = [
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
    "library",
    "transportation",
    "hostel",
]

DEFAULT_CALENDAR_SETTINGS = {
    "default_calendar": CALENDAR_SHAMSI,
    **{f"{module}_calendar": CALENDAR_INHERIT for module in CALENDAR_MODULES},
}


DARI_MONTHS = [
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
]

PASHTO_MONTHS = [
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
]

ENGLISH_MONTHS = [
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
]

MONTHS = {"fa-AF": DARI_MONTHS, "ps-AF": PASHTO_MONTHS, "en": ENGLISH_MONTHS}

_GREGORIAN_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
_JALALI_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]


def _div(a, b):
    return a // b


def _mod(a, b):
    return a - _div(a, b) * b


def _jalali_cal(jy):
    bl = len(_JALALI_BREAKS)
    gy = jy + 621
    leap_j = -14
    jp = _JALALI_BREAKS[0]
    if jy < jp or jy >= _JALALI_BREAKS[bl - 1]:
        raise ValueError("Shamsi year is out of supported range.")
    jump = 0
    for i in range(1, bl):
        jm = _JALALI_BREAKS[i]
        jump = jm - jp
        if jy < jm:
            break
        leap_j += _div(jump, 33) * 8 + _div(_mod(jump, 33), 4)
        jp = jm
    n = jy - jp
    leap_j += _div(n, 33) * 8 + _div(_mod(n, 33) + 3, 4)
    if _mod(jump, 33) == 4 and jump - n == 4:
        leap_j += 1
    leap_g = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150
    march = 20 + leap_j - leap_g
    if jump - n < 6:
        n = n - jump + _div(jump + 4, 33) * 33
    leap = _mod(_mod(n + 1, 33) - 1, 4)
    if leap == -1:
        leap = 4
    return {"leap": leap, "gy": gy, "march": march}


def is_shamsi_leap_year(year):
    return _jalali_cal(int(year))["leap"] == 0


def shamsi_month_length(year, month):
    month = int(month)
    if month <= 6:
        return 31
    if month <= 11:
        return 30
    return 30 if is_shamsi_leap_year(year) else 29


def to_gregorian(shamsi_year, shamsi_month, shamsi_day):
    jy = int(shamsi_year)
    jm = int(shamsi_month)
    jd = int(shamsi_day)
    if jm < 1 or jm > 12 or jd < 1 or jd > shamsi_month_length(jy, jm):
        raise ValueError("Invalid Shamsi date.")
    r = _jalali_cal(jy)
    gy = r["gy"]
    day_no = (jm - 1) * 31 - _div(jm, 7) * (jm - 7) + jd - 1
    gregorian = date(gy, 3, r["march"]) + timedelta(days=day_no)
    return gregorian


def to_shamsi(value):
    if isinstance(value, datetime):
        value = timezone.localtime(value).date() if timezone.is_aware(value) else value.date()
    if not isinstance(value, date):
        value = parse_gregorian_date(value)
    gy = value.year
    jy = gy - 621
    r = _jalali_cal(jy)
    gregorian_farvardin_1 = date(gy, 3, r["march"])
    k = (value - gregorian_farvardin_1).days
    if k >= 0:
        if k <= 185:
            jm = 1 + _div(k, 31)
            jd = _mod(k, 31) + 1
            return jy, jm, jd
        k -= 186
    else:
        jy -= 1
        k += 179
        if r["leap"] == 1:
            k += 1
    jm = 7 + _div(k, 30)
    jd = _mod(k, 30) + 1
    return jy, jm, jd


def parse_gregorian_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if value in [None, ""]:
        return None
    return date.fromisoformat(str(value)[:10])


def parse_shamsi_date(value):
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if value in [None, ""]:
        return None
    text = str(value).strip().split("T")[0].replace("/", "-")
    parts = text.split("-")
    if len(parts) != 3:
        raise ValueError("Use YYYY-MM-DD Shamsi date format.")
    year, month, day = (int(part) for part in parts)
    if year >= 1700:
        return date(year, month, day)
    return to_gregorian(year, month, day)


def parse_shamsi_datetime(value):
    if isinstance(value, datetime):
        return value
    if value in [None, ""]:
        return None
    text = str(value).strip()
    date_part, _, time_part = text.replace("T", " ").partition(" ")
    gregorian_date = parse_shamsi_date(date_part)
    if not time_part:
        return datetime.combine(gregorian_date, time.min)
    return datetime.combine(gregorian_date, time.fromisoformat(time_part[:8]))


def format_shamsi_date(value, locale="fa-AF", month_name=False):
    value = parse_gregorian_date(value)
    if not value:
        return None
    year, month, day = to_shamsi(value)
    if month_name:
        names = MONTHS.get(locale, DARI_MONTHS)
        return f"{day:02d} {names[month - 1]} {year:04d}"
    return f"{year:04d}-{month:02d}-{day:02d}"


def format_shamsi_datetime(value, locale="fa-AF", month_name=False):
    if not value:
        return None
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    local_value = timezone.localtime(value) if timezone.is_aware(value) else value
    return f"{format_shamsi_date(local_value.date(), locale, month_name)} {local_value:%H:%M}"


def normalize_calendar_settings(settings):
    if isinstance(settings, list):
        settings = settings[0] if settings else {}
    if isinstance(settings, str):
        import json

        try:
            settings = json.loads(settings)
        except json.JSONDecodeError:
            settings = {}
    if not isinstance(settings, dict):
        settings = {}
    settings = settings or {}
    normalized = {**DEFAULT_CALENDAR_SETTINGS, **settings}
    if normalized.get("default_calendar") not in [CALENDAR_SHAMSI, CALENDAR_GREGORIAN]:
        normalized["default_calendar"] = CALENDAR_SHAMSI
    for module in CALENDAR_MODULES:
        key = f"{module}_calendar"
        if normalized.get(key) not in [CALENDAR_INHERIT, CALENDAR_SHAMSI, CALENDAR_GREGORIAN]:
            normalized[key] = CALENDAR_INHERIT
    return normalized


def tenant_calendar_settings(tenant):
    raw = {}
    if tenant:
        raw = (getattr(tenant, "notification_settings", None) or {}).get("calendar_settings") or {}
    return normalize_calendar_settings(raw)


def get_module_calendar(tenant=None, module=None):
    settings = tenant_calendar_settings(tenant)
    module_key = f"{module}_calendar" if module else ""
    selected = settings.get(module_key, CALENDAR_INHERIT)
    if selected == CALENDAR_INHERIT:
        return settings["default_calendar"]
    return selected


def format_gregorian_date(value):
    value = parse_gregorian_date(value)
    return value.isoformat() if value else None


def format_gregorian_datetime(value):
    if not value:
        return None
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    local_value = timezone.localtime(value) if timezone.is_aware(value) else value
    return local_value.strftime("%Y-%m-%d %H:%M")


def format_calendar_date(value, calendar_type=CALENDAR_SHAMSI, locale="fa-AF", month_name=False):
    if calendar_type == CALENDAR_GREGORIAN:
        return format_gregorian_date(value)
    return format_shamsi_date(value, locale=locale, month_name=month_name)


def format_calendar_datetime(value, calendar_type=CALENDAR_SHAMSI, locale="fa-AF", month_name=False):
    if calendar_type == CALENDAR_GREGORIAN:
        return format_gregorian_datetime(value)
    return format_shamsi_datetime(value, locale=locale, month_name=month_name)


def parse_calendar_date(value, calendar_type=CALENDAR_SHAMSI):
    if calendar_type == CALENDAR_GREGORIAN:
        return parse_gregorian_date(value)
    return parse_shamsi_date(value)


def parse_calendar_datetime(value, calendar_type=CALENDAR_SHAMSI):
    if calendar_type == CALENDAR_GREGORIAN:
        if isinstance(value, datetime):
            return value
        if value in [None, ""]:
            return None
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return parse_shamsi_datetime(value)


def shamsi_period_label(month, year, locale="fa-AF"):
    if not month or not year:
        return ""
    names = MONTHS.get(locale, DARI_MONTHS)
    return f"{names[int(month) - 1]} {int(year)}"


class ShamsiDateField(serializers.DateField):
    def to_internal_value(self, value):
        try:
            value = parse_shamsi_date(value)
        except (TypeError, ValueError) as exc:
            raise serializers.ValidationError(str(exc))
        return super().to_internal_value(value)

    def to_representation(self, value):
        return format_shamsi_date(value)


class ShamsiDateTimeField(serializers.DateTimeField):
    def to_internal_value(self, value):
        try:
            value = parse_shamsi_datetime(value)
        except (TypeError, ValueError) as exc:
            raise serializers.ValidationError(str(exc))
        return super().to_internal_value(value)

    def to_representation(self, value):
        return format_shamsi_datetime(value)


class ShamsiModelSerializer(serializers.ModelSerializer):
    calendar_module = None

    def _calendar_type(self):
        module = getattr(getattr(self, "Meta", None), "calendar_module", None) or self.calendar_module
        request = self.context.get("request") if hasattr(self, "context") else None
        tenant = getattr(getattr(request, "user", None), "tenant", None)
        return get_module_calendar(tenant, module)

    def _date_fields(self):
        model = getattr(getattr(self, "Meta", None), "model", None)
        if not model:
            return {}
        return {
            field.name: field
            for field in model._meta.get_fields()
            if isinstance(field, (models.DateField, models.DateTimeField))
        }

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            data = data.copy()
        else:
            data = dict(data)
        for name, field in self._date_fields().items():
            if name in data and data[name] not in [None, ""]:
                try:
                    calendar_type = self._calendar_type()
                    parser = (
                        lambda value: parse_calendar_datetime(value, calendar_type)
                        if isinstance(field, models.DateTimeField)
                        else parse_calendar_date(value, calendar_type)
                    )
                    parsed = parser(data[name])
                    data[name] = parsed.isoformat() if parsed else parsed
                except (TypeError, ValueError) as exc:
                    raise serializers.ValidationError({name: str(exc)})
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for name, field in self._date_fields().items():
            if name in data and data[name] not in [None, ""]:
                value = getattr(instance, name, None)
                calendar_type = self._calendar_type()
                formatter = (
                    lambda input_value: format_calendar_datetime(input_value, calendar_type)
                    if isinstance(field, models.DateTimeField)
                    else format_calendar_date(input_value, calendar_type)
                )
                formatted = formatter(value)
                data[name] = formatted
                data[f"formatted_{name}"] = formatted
        data.setdefault("calendar_type", self._calendar_type())
        return data


CalendarModelSerializer = ShamsiModelSerializer


def convert_query_date(value, tenant=None, module=None):
    calendar_type = get_module_calendar(tenant, module)
    return parse_calendar_date(value, calendar_type) if value not in [None, ""] else value


def convert_row_dates(row, calendar_type=CALENDAR_SHAMSI):
    converted = {}
    for key, value in row.items():
        if isinstance(value, datetime):
            converted[key] = format_calendar_datetime(value, calendar_type)
        elif isinstance(value, date):
            converted[key] = format_calendar_date(value, calendar_type)
        else:
            converted[key] = value
    converted.setdefault("calendar_type", calendar_type)
    return converted


def convert_rows_dates(rows, tenant=None, module=None):
    calendar_type = get_module_calendar(tenant, module)
    return [convert_row_dates(row, calendar_type) for row in rows]


GregorianToShamsi = to_shamsi
ShamsiToGregorian = to_gregorian
