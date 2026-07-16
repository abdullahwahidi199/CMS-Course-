import { useContext, useMemo } from "react";
import { AuthContext } from "../AuthProvider";
import {
  formatByModule,
  formatDate,
  formatDateTime,
  getModuleCalendar,
  normalizeCalendarSettings,
  parseDate,
} from "../utils/calendar";

export function useCalendar(module = "dashboard") {
  const { tenant } = useContext(AuthContext) || {};
  const settings = useMemo(
    () => normalizeCalendarSettings(tenant?.calendar_settings || tenant?.notification_settings?.calendar_settings || {}),
    [tenant],
  );
  const calendar = getModuleCalendar(settings, module);

  return {
    calendar,
    settings,
    getModuleCalendar: (nextModule) => getModuleCalendar(settings, nextModule),
    formatDate: (date, options = {}) => formatDate(date, { ...options, calendar }),
    formatDateTime: (date, options = {}) => formatDateTime(date, { ...options, calendar }),
    formatByModule: (nextModule, date, options = {}) => formatByModule(nextModule, date, settings, options),
    parseDate: (date) => parseDate(date, calendar),
  };
}
