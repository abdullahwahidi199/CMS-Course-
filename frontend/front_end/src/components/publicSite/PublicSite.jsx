import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import instance from "../../api/axiosInstance";
import { mediaUrl } from "../../utils/mediaUrl";

const fallbackImage = "/school-image.png";

const navItems = [
  { label: "Home", path: "" },
  { label: "About", path: "about" },
  { label: "Courses", path: "courses" },
  { label: "News", path: "news" },
  { label: "Events", path: "events" },
  { label: "Achievements", path: "achievements" },
  { label: "Contact", path: "contact" },
];

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--site-primary)] focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-slate-300/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20";

const outlineButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-100";

function updateMeta(name, content, attribute = "name") {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content || "");
}

function updateLink(rel, href) {
  if (!href) return;

  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function absoluteUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  return `${window.location.origin}${
    value.startsWith("/") ? value : `/${value}`
  }`;
}

function resolveActionUrl(tenantSlug, url) {
  if (!url) return `/site/${tenantSlug}/contact`;

  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("#")
  ) {
    return url;
  }

  if (url.startsWith("/site/")) {
    return url;
  }

  const clean = url.replace(/^\/+/, "");
  return `/site/${tenantSlug}/${clean}`;
}

function isExternal(url = "") {
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  );
}

function opensNewTab(url = "") {
  return /^https?:\/\//i.test(url);
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = {}) {
  const date = parseDate(value);
  if (!date) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

function formatTime(value) {
  const date = parseDate(value);
  if (!date) return "";

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(value) {
  const date = parseDate(value);
  if (!date) return "—";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
  });
}

function formatMonth(value) {
  const date = parseDate(value);
  if (!date) return "TBA";

  return date.toLocaleDateString(undefined, {
    month: "short",
  });
}

function sectionImage(...paths) {
  const selected = paths.find(Boolean);
  return selected ? mediaUrl(selected) : fallbackImage;
}

function getApiError(error, fallback) {
  const data = error?.response?.data;
  const value =
    data?.detail ||
    data?.message ||
    data?.body ||
    data?.visitor_email ||
    data?.visitor_name;

  if (Array.isArray(value)) {
    return value.join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  return fallback;
}

function normalizeSiteData(payload = {}) {
  return {
    ...payload,
    tenant: payload.tenant || {},
    settings: payload.settings || {},
    courses: Array.isArray(payload.courses) ? payload.courses : [],
    announcements: Array.isArray(payload.announcements)
      ? payload.announcements
      : [],
    events: Array.isArray(payload.events) ? payload.events : [],
    upcoming_events: Array.isArray(payload.upcoming_events)
      ? payload.upcoming_events
      : [],
    achievements: Array.isArray(payload.achievements)
      ? payload.achievements
      : [],
  };
}

function SiteImage({ src, alt = "", ...props }) {
  const handleError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackImage;
  };

  return (
    <img
      {...props}
      src={src || fallbackImage}
      alt={alt}
      onError={handleError}
    />
  );
}

function ActionLink({ tenantSlug, url, label, variant = "primary" }) {
  if (!label) return null;

  const href = resolveActionUrl(tenantSlug, url);
  const external = isExternal(href);
  const newTab = opensNewTab(href);

  const classes =
    variant === "primary" ? primaryButtonClasses : secondaryButtonClasses;

  const content = (
    <>
      <span>{label}</span>
      {newTab ? (
        <ExternalLink size={16} aria-hidden="true" />
      ) : (
        <ArrowRight size={16} aria-hidden="true" />
      )}
    </>
  );

  const style =
    variant === "primary"
      ? { backgroundColor: "var(--site-primary)" }
      : undefined;

  if (external || href.startsWith("#")) {
    return (
      <a
        className={classes}
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noreferrer" : undefined}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} to={href} style={style}>
      {content}
    </Link>
  );
}

function SectionHeading({ eyebrow, title, text, align = "center" }) {
  const alignment =
    align === "left" ? "max-w-2xl text-left" : "mx-auto max-w-3xl text-center";

  return (
    <div className={`mb-10 ${alignment}`}>
      {eyebrow ? (
        <div
          className={`mb-4 flex items-center gap-3 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span
            className="h-px w-8"
            style={{ backgroundColor: "var(--site-accent)" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--site-primary)" }}
          >
            {eyebrow}
          </p>
          {align === "center" ? (
            <span
              className="h-px w-8"
              style={{ backgroundColor: "var(--site-accent)" }}
            />
          ) : null}
        </div>
      ) : null}

      <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>

      {text ? (
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function PublicHeader({ tenantSlug, name, logo }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const rootPath = `/site/${tenantSlug}`;
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";

  const itemIsActive = (item) => {
    const target = item.path ? `${rootPath}/${item.path}` : rootPath;

    if (!item.path) {
      return currentPath === target;
    }

    return currentPath === target || currentPath.startsWith(`${target}/`);
  };

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          className="group flex min-w-0 items-center gap-3"
          to={rootPath}
          aria-label={`${name} home`}
        >
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-2xl opacity-0 blur transition duration-300 group-hover:opacity-20"
              style={{
                backgroundColor: "var(--site-primary)",
              }}
            />

            <SiteImage
              className="relative h-11 w-11 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm"
              src={sectionImage(logo)}
              alt={name}
              decoding="async"
            />
          </div>

          <div className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-slate-950 sm:max-w-xs sm:text-base">
              {name}
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:block">
              Education Center
            </span>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/90 p-1.5 lg:flex"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => {
            const to = item.path ? `${rootPath}/${item.path}` : rootPath;

            const active = itemIsActive(item);

            return (
              <Link
                key={item.path || "home"}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition duration-200 ${
                  active
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: "var(--site-primary)",
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open ? (
        <div
          id="public-mobile-menu"
          className="site-mobile-menu border-t border-slate-200/80 bg-white px-4 py-4 shadow-xl shadow-slate-900/5 lg:hidden"
        >
          <nav
            className="mx-auto grid max-w-7xl gap-1"
            aria-label="Mobile navigation"
          >
            {navItems.map((item) => {
              const to = item.path ? `${rootPath}/${item.path}` : rootPath;

              const active = itemIsActive(item);

              return (
                <Link
                  key={item.path || "home-mobile"}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                      style={{
                        backgroundColor: "var(--site-primary)",
                      }}
                    />
                    {item.label}
                  </span>

                  <ChevronRight size={16} />
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Hero({ settings, tenantSlug, centerName }) {
  const image = sectionImage(
    settings.hero_image,
    settings.banner_image,
    settings.brand_logo,
  );

  const title = settings.hero_title || settings.center_name || centerName;

  return (
    <section className="relative isolate min-h-[78svh] overflow-hidden bg-slate-950 sm:min-h-[82svh]">
      <SiteImage
        className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
        src={image}
        alt={title}
        fetchPriority="high"
        decoding="async"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/25" />

      <div
        className="absolute -left-24 top-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--site-primary)" }}
      />
      <div
        className="absolute -right-24 bottom-0 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--site-accent)" }}
      />

      <div className="relative mx-auto flex min-h-[78svh] max-w-7xl items-center px-4 py-20 sm:min-h-[82svh] sm:px-6 lg:px-8">
        <div className="max-w-4xl text-white">
          {settings.hero_kicker ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
              <Sparkles size={15} style={{ color: "var(--site-accent)" }} />
              {settings.hero_kicker}
            </div>
          ) : null}

          <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>

          {settings.hero_subtitle ? (
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-xl sm:leading-8">
              {settings.hero_subtitle}
            </p>
          ) : null}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ActionLink
              tenantSlug={tenantSlug}
              url={settings.hero_primary_url || "contact"}
              label={settings.hero_primary_label || "Get in touch"}
            />

            <ActionLink
              tenantSlug={tenantSlug}
              url={settings.hero_secondary_url || "courses"}
              label={settings.hero_secondary_label || "Explore courses"}
              variant="secondary"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/30 to-transparent" />
    </section>
  );
}

function AboutPreview({ settings, tenantSlug, centerName }) {
  const highlights = Array.isArray(settings.about_highlights)
    ? settings.about_highlights
    : [];

  return (
    <section
      id="home-content"
      className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div
        className="absolute -right-32 top-10 h-80 w-80 rounded-full opacity-[0.06] blur-3xl"
        style={{ backgroundColor: "var(--site-primary)" }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span
              className="h-px w-8"
              style={{
                backgroundColor: "var(--site-accent)",
              }}
            />
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--site-primary)" }}
            >
              About us
            </p>
          </div>

          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {settings.about_title ||
              `About ${settings.center_name || centerName}`}
          </h2>

          {settings.about_body ? (
            <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-8 text-slate-600">
              {settings.about_body}
            </p>
          ) : null}

          {highlights.length > 0 ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {highlights.slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 shrink-0"
                    size={18}
                    style={{
                      color: "var(--site-primary)",
                    }}
                  />
                  <span className="text-sm font-medium leading-6 text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <Link
            className={`${primaryButtonClasses} mt-8`}
            to={`/site/${tenantSlug}/about`}
            style={{
              backgroundColor: "var(--site-primary)",
            }}
          >
            Learn more about us
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-4 rounded-[2.5rem] opacity-10 blur-2xl"
            style={{ backgroundColor: "var(--site-primary)" }}
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-slate-100 shadow-2xl shadow-slate-900/15">
            <SiteImage
              className="aspect-[4/3] w-full object-cover"
              src={sectionImage(settings.about_image, settings.banner_image)}
              alt={settings.about_title || settings.center_name || centerName}
              loading="lazy"
              decoding="async"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
          </div>

          {highlights[0] ? (
            <div className="absolute -bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:right-6 sm:max-w-xs">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  backgroundColor: "var(--site-primary)",
                }}
              >
                <Sparkles size={18} />
              </div>

              <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                {highlights[0]}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course }) {
  const description = course.summary || course.description;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/[0.08]">
      <div className="relative overflow-hidden bg-slate-100">
        <SiteImage
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
          src={sectionImage(course.image)}
          alt={course.title}
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-70" />

        <div
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg backdrop-blur"
          style={{ backgroundColor: "var(--site-primary)" }}
        >
          <GraduationCap size={19} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {course.duration ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {course.duration}
            </span>
          ) : null}

          {course.level ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {course.level}
            </span>
          ) : null}

          {course.mode ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {course.mode}
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-bold tracking-tight text-slate-950">
          {course.title}
        </h3>

        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}

        {course.price_label ? (
          <p
            className="mt-auto pt-5 text-sm font-bold"
            style={{ color: "var(--site-primary)" }}
          >
            {course.price_label}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function NewsCard({ item, tenantSlug }) {
  const detailUrl = `/site/${tenantSlug}/news/${item.slug}`;

  const image = (
    <SiteImage
      className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
      src={sectionImage(item.image)}
      alt={item.title}
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/[0.08]">
      <div className="relative overflow-hidden bg-slate-100">
        {item.slug ? (
          <Link to={detailUrl} aria-label={item.title}>
            {image}
          </Link>
        ) : (
          image
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {item.published_at ? (
            <time dateTime={item.published_at}>
              {formatDate(item.published_at)}
            </time>
          ) : null}

          {item.category ? (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span
                style={{
                  color: "var(--site-primary)",
                }}
              >
                {item.category}
              </span>
            </>
          ) : null}
        </div>

        <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
          {item.slug ? (
            <Link className="transition hover:opacity-70" to={detailUrl}>
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>

        {item.summary ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {item.summary}
          </p>
        ) : null}

        {item.slug ? (
          <Link
            className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold transition hover:gap-3"
            style={{ color: "var(--site-primary)" }}
            to={detailUrl}
          >
            Read article
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function EventCard({ event, tenantSlug }) {
  const detailUrl =
    tenantSlug && event.slug
      ? `/site/${tenantSlug}/events/${event.slug}`
      : null;

  return (
    <article className="group rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/[0.07] sm:p-6">
      <div className="flex gap-4 sm:gap-5">
        <time
          className="flex h-[78px] w-[70px] shrink-0 flex-col items-center justify-center rounded-2xl text-center text-white shadow-lg"
          style={{ backgroundColor: "var(--site-primary)" }}
          dateTime={event.starts_at || undefined}
        >
          <span className="text-2xl font-bold leading-none">
            {formatDay(event.starts_at)}
          </span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            {formatMonth(event.starts_at)}
          </span>
        </time>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold tracking-tight text-slate-950">
            {detailUrl ? (
              <Link className="transition hover:opacity-70" to={detailUrl}>
                {event.title}
              </Link>
            ) : (
              event.title
            )}
          </h3>

          {event.summary || event.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {event.summary || event.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
            {event.starts_at ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {formatTime(event.starts_at)}
              </span>
            ) : null}

            {event.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {event.location}
              </span>
            ) : null}
          </div>

          {detailUrl ? (
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3"
              style={{
                color: "var(--site-primary)",
              }}
              to={detailUrl}
            >
              View event
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AchievementCard({ item }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/[0.08]">
      <div className="relative overflow-hidden bg-slate-100">
        <SiteImage
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
          src={sectionImage(item.image)}
          alt={item.title}
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

        <div className="absolute bottom-4 left-4">
          {item.metric_value ? (
            <div className="rounded-2xl border border-white/30 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <p
                className="text-2xl font-bold leading-none"
                style={{
                  color: "var(--site-primary)",
                }}
              >
                {item.metric_value}
              </p>

              {item.metric_label ? (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  {item.metric_label}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
              <Award size={23} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-bold tracking-tight text-slate-950">
          {item.title}
        </h3>

        {item.achieved_on ? (
          <time
            className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            dateTime={item.achieved_on}
          >
            {formatDate(item.achieved_on)}
          </time>
        ) : null}

        {item.summary || item.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {item.summary || item.description}
          </p>
        ) : null}

        {item.summary && item.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {item.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function HomePage({ data, tenantSlug }) {
  const settings = data.settings;

  const featuredEvents = (
    data.upcoming_events.length ? data.upcoming_events : data.events
  ).slice(0, 4);

  return (
    <main>
      <Hero
        settings={settings}
        tenantSlug={tenantSlug}
        centerName={data.tenant.name}
      />

      <AboutPreview
        settings={settings}
        tenantSlug={tenantSlug}
        centerName={data.tenant.name}
      />

      <section className="relative overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div
          className="absolute -left-40 top-20 h-96 w-96 rounded-full opacity-[0.05] blur-3xl"
          style={{ backgroundColor: "var(--site-primary)" }}
        />

        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Learning programs"
            title="Courses and programs"
            text="Explore thoughtfully designed learning paths that help students build knowledge, confidence and practical skills."
          />

          {data.courses.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState label="Courses will be published here soon." />
          )}

          <div className="mt-10 text-center">
            <Link
              className={outlineButtonClasses}
              to={`/site/${tenantSlug}/courses`}
            >
              View all courses
              <BookOpen size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Latest updates"
            title="News and announcements"
            text="Stay informed about academic updates, community news and important announcements."
          />

          {data.announcements.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.announcements.slice(0, 3).map((item) => (
                <NewsCard key={item.id} item={item} tenantSlug={tenantSlug} />
              ))}
            </div>
          ) : (
            <EmptyState label="There are no announcements yet." />
          )}

          {data.announcements.length > 3 ? (
            <div className="mt-10 text-center">
              <Link
                className={outlineButtonClasses}
                to={`/site/${tenantSlug}/news`}
              >
                View all news
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8">
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--site-primary)" }}
        />

        <div
          className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "var(--site-accent)" }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="h-px w-8"
                style={{
                  backgroundColor: "var(--site-accent)",
                }}
              />
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--site-accent)" }}
              >
                Events
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Upcoming events
            </h2>

            <p className="mt-4 max-w-lg text-base leading-7 text-white/65">
              Explore public activities, academic dates and community learning
              sessions.
            </p>

            <Link
              className={`${primaryButtonClasses} mt-7`}
              to={`/site/${tenantSlug}/events`}
              style={{
                backgroundColor: "var(--site-primary)",
              }}
            >
              Explore all events
              <CalendarDays size={17} />
            </Link>
          </div>

          <div className="grid gap-4">
            {featuredEvents.length ? (
              featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  tenantSlug={tenantSlug}
                />
              ))
            ) : (
              <EmptyState label="No upcoming events have been published." />
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Success stories"
            title="Achievements"
            text="Celebrating milestones, student success and accomplishments across our learning community."
          />

          {data.achievements.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.achievements.slice(0, 3).map((item) => (
                <AchievementCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState label="Achievements will be published here soon." />
          )}

          {data.achievements.length > 3 ? (
            <div className="mt-10 text-center">
              <Link
                className={outlineButtonClasses}
                to={`/site/${tenantSlug}/achievements`}
              >
                View all achievements
                <Award size={17} />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <ContactCta settings={settings} tenantSlug={tenantSlug} />
    </main>
  );
}

function PageShell({ title, image, children, eyebrow = "Discover" }) {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <SiteImage
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src={image}
          alt=""
          decoding="async"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

        <div
          className="absolute -right-32 top-0 -z-10 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--site-primary)" }}
        />

        <div className="mx-auto max-w-7xl">
          {eyebrow ? (
            <div className="mb-5 flex items-center gap-3">
              <span
                className="h-px w-8"
                style={{
                  backgroundColor: "var(--site-accent)",
                }}
              />

              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--site-accent)" }}
              >
                {eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
      </section>

      <main className="min-h-[45vh] bg-slate-50/80 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  );
}

function AboutPage({ data }) {
  const settings = data.settings;
  const highlights = Array.isArray(settings.about_highlights)
    ? settings.about_highlights
    : [];

  return (
    <PageShell
      title={settings.about_title || `About ${data.tenant.name}`}
      image={sectionImage(settings.about_image, settings.banner_image)}
      eyebrow="Who we are"
    >
      <div
        className={`grid gap-8 ${
          highlights.length ? "lg:grid-cols-[1fr_0.72fr]" : "mx-auto max-w-4xl"
        }`}
      >
        <article className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
          <div
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{
              backgroundColor: "var(--site-primary)",
            }}
          >
            <GraduationCap size={23} />
          </div>

          <div className="whitespace-pre-line text-base leading-8 text-slate-700 sm:text-lg">
            {settings.about_body || settings.hero_subtitle}
          </div>
        </article>

        {highlights.length ? (
          <aside className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{
                color: "var(--site-primary)",
              }}
            >
              What makes us different
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              Our highlights
            </h2>

            <div className="mt-6 grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 shrink-0"
                    size={18}
                    style={{
                      color: "var(--site-primary)",
                    }}
                  />

                  <span className="text-sm font-medium leading-6 text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </PageShell>
  );
}

function CoursesPage({ data }) {
  return (
    <PageShell
      title="Courses and programs"
      image={sectionImage(data.settings.banner_image, data.settings.hero_image)}
      eyebrow="Start learning"
    >
      {data.courses.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState label="No courses have been published yet." />
      )}
    </PageShell>
  );
}

function NewsPage({ data, tenantSlug }) {
  return (
    <PageShell
      title="News and announcements"
      image={sectionImage(data.settings.banner_image, data.settings.hero_image)}
      eyebrow="Stay informed"
    >
      {data.announcements.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.announcements.map((item) => (
            <NewsCard key={item.id} item={item} tenantSlug={tenantSlug} />
          ))}
        </div>
      ) : (
        <EmptyState label="No announcements have been published yet." />
      )}
    </PageShell>
  );
}

function FormField({
  label,
  textarea = false,
  className = "",
  required,
  ...props
}) {
  const Component = textarea ? "textarea" : "input";

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>

      <Component
        {...props}
        required={required}
        className={`${inputClasses} ${textarea ? "min-h-32 resize-y" : ""}`}
      />
    </label>
  );
}

function CommentSection({ comments = [], tenantSlug, postSlug }) {
  const [items, setItems] = useState(comments);
  const [form, setForm] = useState({
    visitor_name: "",
    visitor_email: "",
    body: "",
    website: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setItems(Array.isArray(comments) ? comments : []);
  }, [comments]);

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setSubmitting(true);

    try {
      await instance.post(
        `/public/sites/${tenantSlug}/announcements/${postSlug}/comments/`,
        form,
      );

      setStatus("Thank you. Your comment was submitted for review.");

      setForm({
        visitor_name: "",
        visitor_email: "",
        body: "",
        website: "",
      });
    } catch (err) {
      setError(
        getApiError(
          err,
          "Your comment could not be submitted. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto mt-10 grid max-w-4xl gap-6">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{
                color: "var(--site-primary)",
              }}
            >
              Discussion
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Comments
            </h2>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            {items.length}
          </span>
        </div>

        <div className="mt-6 grid gap-4">
          {items.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-950">
                  {comment.visitor_name}
                </h3>

                <time
                  className="text-xs font-medium text-slate-400"
                  dateTime={comment.created_at}
                >
                  {formatDate(comment.created_at)}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {comment.body}
              </p>
            </article>
          ))}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No approved comments yet. Start the conversation.
            </div>
          ) : null}
        </div>
      </div>

      <form
        className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
        onSubmit={submit}
      >
        <p
          className="text-xs font-bold uppercase tracking-[0.16em]"
          style={{ color: "var(--site-primary)" }}
        >
          Join the conversation
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Leave a comment
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your comment will appear after it has been reviewed.
        </p>

        <div className="sr-only" aria-hidden="true">
          <input
            tabIndex="-1"
            autoComplete="off"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </div>

        <div aria-live="polite">
          {status ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {status}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Your name"
            required
            autoComplete="name"
            placeholder="Enter your name"
            value={form.visitor_name}
            onChange={(event) => update("visitor_name", event.target.value)}
          />

          <FormField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="Optional"
            value={form.visitor_email}
            onChange={(event) => update("visitor_email", event.target.value)}
          />
        </div>

        <FormField
          className="mt-4"
          label="Comment"
          textarea
          required
          placeholder="Write your comment..."
          value={form.body}
          onChange={(event) => update("body", event.target.value)}
        />

        <button
          className={`${primaryButtonClasses} mt-5 w-full sm:w-auto`}
          style={{
            backgroundColor: "var(--site-primary)",
          }}
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Send size={17} />
          )}

          {submitting ? "Submitting..." : "Submit comment"}
        </button>
      </form>
    </section>
  );
}

function NewsDetailPage({ data, post, comments, tenantSlug, postSlug }) {
  const item = post;

  if (!item) {
    return (
      <PageShell
        title="Announcement"
        image={sectionImage(data.settings.banner_image)}
        eyebrow="News"
      >
        <EmptyState label="This announcement could not be found." />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={item.title}
      image={sectionImage(item.image, data.settings.banner_image)}
      eyebrow={item.category || "Announcement"}
    >
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
          {item.published_at ? (
            <time dateTime={item.published_at}>
              {formatDate(item.published_at)}
            </time>
          ) : null}

          {item.category ? (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
                style={{
                  color: "var(--site-primary)",
                }}
              >
                {item.category}
              </span>
            </>
          ) : null}
        </div>

        {item.summary ? (
          <p
            className="mb-8 border-l-4 pl-5 text-lg font-medium leading-8 text-slate-700 sm:text-xl"
            style={{
              borderColor: "var(--site-primary)",
            }}
          >
            {item.summary}
          </p>
        ) : null}

        <div className="whitespace-pre-line text-base leading-8 text-slate-700 sm:text-lg">
          {item.body}
        </div>
      </article>

      <CommentSection
        comments={comments}
        tenantSlug={tenantSlug}
        postSlug={postSlug}
      />
    </PageShell>
  );
}

function EventsPage({ data, tenantSlug }) {
  const now = Date.now();

  const upcoming = [...data.events]
    .filter((event) => {
      const date = parseDate(event.starts_at);
      return date && date.getTime() >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );

  const past = [...data.events]
    .filter((event) => {
      const date = parseDate(event.starts_at);
      return date && date.getTime() < now;
    })
    .sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    );

  const undated = data.events.filter((event) => !parseDate(event.starts_at));

  return (
    <PageShell
      title="Events"
      image={sectionImage(data.settings.banner_image, data.settings.hero_image)}
      eyebrow="Join us"
    >
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{
                color: "var(--site-primary)",
              }}
            >
              What is coming next
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Upcoming events
            </h2>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm">
            {upcoming.length + undated.length} events
          </span>
        </div>

        {upcoming.length || undated.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[...upcoming, ...undated].map((event) => (
              <EventCard key={event.id} event={event} tenantSlug={tenantSlug} />
            ))}
          </div>
        ) : (
          <EmptyState label="There are no upcoming events yet." />
        )}
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <p
            className="text-xs font-bold uppercase tracking-[0.16em]"
            style={{ color: "var(--site-primary)" }}
          >
            Previous activities
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Past events
          </h2>
        </div>

        {past.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} tenantSlug={tenantSlug} />
            ))}
          </div>
        ) : (
          <EmptyState label="There are no past events yet." />
        )}
      </section>
    </PageShell>
  );
}

function EventDetailPage({ data, event }) {
  if (!event) {
    return (
      <PageShell
        title="Event"
        image={sectionImage(data.settings.banner_image)}
        eyebrow="Events"
      >
        <EmptyState label="This event could not be found." />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={event.title}
      image={sectionImage(event.image, data.settings.banner_image)}
      eyebrow="Event details"
    >
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {event.starts_at ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <CalendarDays
                size={19}
                style={{
                  color: "var(--site-primary)",
                }}
              />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Date
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatDate(event.starts_at)}
              </p>
            </div>
          ) : null}

          {event.starts_at ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <Clock
                size={19}
                style={{
                  color: "var(--site-primary)",
                }}
              />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Time
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatTime(event.starts_at)}
              </p>
            </div>
          ) : null}

          {event.location ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <MapPin
                size={19}
                style={{
                  color: "var(--site-primary)",
                }}
              />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Location
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {event.location}
              </p>
            </div>
          ) : null}
        </div>

        {event.summary ? (
          <p
            className="mb-7 border-l-4 pl-5 text-lg font-medium leading-8 text-slate-700 sm:text-xl"
            style={{
              borderColor: "var(--site-primary)",
            }}
          >
            {event.summary}
          </p>
        ) : null}

        <div className="whitespace-pre-line text-base leading-8 text-slate-700 sm:text-lg">
          {event.description}
        </div>
      </article>
    </PageShell>
  );
}

function AchievementsPage({ data }) {
  return (
    <PageShell
      title="Achievements"
      image={sectionImage(data.settings.banner_image, data.settings.hero_image)}
      eyebrow="Celebrating success"
    >
      {data.achievements.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.achievements.map((item) => (
            <AchievementCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState label="No achievements have been published yet." />
      )}
    </PageShell>
  );
}

function ContactItem({ icon, children, href }) {
  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: "var(--site-primary)" }}
      >
        {icon}
      </span>

      <span className="min-w-0 break-words text-sm font-semibold leading-6 text-slate-700">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
        href={href}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {content}
    </div>
  );
}

function ContactDetails({ settings, tenant }) {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <p
        className="text-xs font-bold uppercase tracking-[0.16em]"
        style={{ color: "var(--site-primary)" }}
      >
        Contact information
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        We would love to hear from you
      </h2>

      {settings.contact_body ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
          {settings.contact_body}
        </p>
      ) : null}

      <div className="mt-7 grid gap-3">
        {tenant.phone ? (
          <ContactItem href={`tel:${tenant.phone}`} icon={<Phone size={18} />}>
            {tenant.phone}
          </ContactItem>
        ) : null}

        {tenant.email ? (
          <ContactItem
            href={`mailto:${tenant.email}`}
            icon={<Mail size={18} />}
          >
            {tenant.email}
          </ContactItem>
        ) : null}

        {tenant.address ? (
          <ContactItem icon={<MapPin size={18} />}>
            {tenant.address}
          </ContactItem>
        ) : null}

        {settings.office_hours ? (
          <ContactItem icon={<Clock size={18} />}>
            {settings.office_hours}
          </ContactItem>
        ) : null}
      </div>

      {settings.map_url ? (
        <a
          className={`${primaryButtonClasses} mt-7`}
          href={settings.map_url}
          target="_blank"
          rel="noreferrer"
          style={{
            backgroundColor: "var(--site-primary)",
          }}
        >
          Open in maps
          <ExternalLink size={16} />
        </a>
      ) : null}
    </div>
  );
}

function ContactForm({ tenantSlug, source = "contact", compact = false }) {
  const [form, setForm] = useState({
    visitor_name: "",
    visitor_email: "",
    visitor_phone: "",
    subject: "",
    message: "",
    source,
    website: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setSubmitting(true);

    try {
      await instance.post(`/public/sites/${tenantSlug}/inquiries/`, {
        ...form,
        source,
      });

      setStatus(
        "Your message was sent successfully. We will get back to you soon.",
      );

      setForm({
        visitor_name: "",
        visitor_email: "",
        visitor_phone: "",
        subject: "",
        message: "",
        source,
        website: "",
      });
    } catch (err) {
      setError(
        getApiError(err, "Your message could not be sent. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className={
        compact
          ? "space-y-4"
          : "rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
      }
      onSubmit={submit}
    >
      {!compact ? (
        <>
          <p
            className="text-xs font-bold uppercase tracking-[0.16em]"
            style={{
              color: "var(--site-primary)",
            }}
          >
            Send an inquiry
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Send us a message
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Complete the form and our team will respond as soon as possible.
          </p>
        </>
      ) : null}

      <div className="sr-only" aria-hidden="true">
        <input
          tabIndex="-1"
          autoComplete="off"
          value={form.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <div aria-live="polite">
        {status ? (
          <div
            className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 ${
              compact ? "" : "mt-5"
            }`}
          >
            {status}
          </div>
        ) : null}

        {error ? (
          <div
            className={`rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 ${
              compact ? "" : "mt-5"
            }`}
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className={compact ? "" : "mt-6"}>
        <FormField
          label="Your name"
          required
          autoComplete="name"
          placeholder="Enter your full name"
          value={form.visitor_name}
          disabled={submitting}
          onChange={(event) => update("visitor_name", event.target.value)}
        />
      </div>

      <div className={`grid gap-4 ${compact ? "" : "mt-4 sm:grid-cols-2"}`}>
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.visitor_email}
          disabled={submitting}
          onChange={(event) => update("visitor_email", event.target.value)}
        />

        <FormField
          label="Phone number"
          type="tel"
          autoComplete="tel"
          placeholder="Your phone number"
          value={form.visitor_phone}
          disabled={submitting}
          onChange={(event) => update("visitor_phone", event.target.value)}
        />
      </div>

      <FormField
        className={compact ? "" : "mt-4"}
        label="Subject"
        placeholder="How can we help?"
        value={form.subject}
        disabled={submitting}
        onChange={(event) => update("subject", event.target.value)}
      />

      <FormField
        className={compact ? "" : "mt-4"}
        label="Message"
        textarea
        required
        placeholder="Write your message..."
        value={form.message}
        disabled={submitting}
        onChange={(event) => update("message", event.target.value)}
      />

      <button
        className={`${primaryButtonClasses} w-full ${compact ? "" : "mt-5"}`}
        style={{
          backgroundColor: "var(--site-primary)",
        }}
        type="submit"
        disabled={submitting}
      >
        {submitting ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <Send size={17} />
        )}

        {submitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function ContactPage({ data, tenantSlug }) {
  return (
    <PageShell
      title={data.settings.contact_title || "Contact us"}
      image={sectionImage(data.settings.banner_image, data.settings.hero_image)}
      eyebrow="Get in touch"
    >
      <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
        <ContactDetails settings={data.settings} tenant={data.tenant} />

        <ContactForm tenantSlug={tenantSlug} source="contact" />
      </div>
    </PageShell>
  );
}

function ContactCta({ settings, tenantSlug }) {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: "var(--site-primary)" }}
      />

      <div
        className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: "var(--site-accent)" }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 backdrop-blur sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span
              className="h-px w-8"
              style={{
                backgroundColor: "var(--site-accent)",
              }}
            />

            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--site-accent)" }}
            >
              Contact
            </p>
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {settings.contact_title || "Ready to start your learning journey?"}
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            {settings.contact_body ||
              settings.chat_welcome_message ||
              "Speak with our team to learn more about our programs and enrollment opportunities."}
          </p>
        </div>

        <Link
          className={`${primaryButtonClasses} shrink-0`}
          to={`/site/${tenantSlug}/contact`}
          style={{
            backgroundColor: "var(--site-primary)",
          }}
        >
          Contact our team
          <MessageCircle size={17} />
        </Link>
      </div>
    </section>
  );
}

function ChatWidget({ settings, tenantSlug }) {
  const [open, setOpen] = useState(false);

  if (!settings.chat_enabled) return null;

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="site-chat-enter mb-4 max-h-[calc(100svh-7rem)] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div
            className="relative overflow-hidden p-5 text-white"
            style={{
              backgroundColor: "var(--site-primary)",
            }}
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <MessageCircle size={20} />
                </div>

                <h2 className="text-base font-bold">
                  {settings.chat_title || "Need help?"}
                </h2>

                {settings.chat_welcome_message ? (
                  <p className="mt-1 text-xs leading-5 text-white/75">
                    {settings.chat_welcome_message}
                  </p>
                ) : null}
              </div>

              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="p-5">
            <ContactForm tenantSlug={tenantSlug} source="chat" compact />

            {settings.whatsapp_number ||
            settings.telegram_url ||
            settings.messenger_url ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Or connect through
                </p>

                <div className="flex flex-wrap gap-2">
                  {settings.whatsapp_number ? (
                    <a
                      className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      href={`https://wa.me/${settings.whatsapp_number.replace(
                        /[^\d]/g,
                        "",
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  ) : null}

                  {settings.telegram_url ? (
                    <a
                      className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                      href={settings.telegram_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Telegram
                    </a>
                  ) : null}

                  {settings.messenger_url ? (
                    <a
                      className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                      href={settings.messenger_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Messenger
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        className="group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl sm:h-16 sm:w-16"
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          backgroundColor: "var(--site-primary)",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
      >
        <span className="absolute inset-0 rounded-full ring-4 ring-white/30 transition group-hover:ring-8" />

        {open ? <X size={23} /> : <MessageCircle size={25} />}
      </button>
    </div>
  );
}

function PublicFooter({ name, logo, settings, tenant, tenantSlug }) {
  return (
    <footer className="bg-slate-950 px-4 pb-8 pt-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_1fr]">
          <div className="max-w-md">
            <Link
              className="inline-flex items-center gap-3"
              to={`/site/${tenantSlug}`}
            >
              <SiteImage
                className="h-12 w-12 rounded-2xl border border-white/10 bg-white object-cover"
                src={sectionImage(logo)}
                alt={name}
                loading="lazy"
              />

              <span className="text-lg font-bold">{name}</span>
            </Link>

            <p className="mt-5 text-sm leading-7 text-white/55">
              {settings.footer_note ||
                settings.hero_subtitle ||
                "Supporting learners through quality education, practical skills and meaningful opportunities."}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              Explore
            </h2>

            <nav className="mt-5 grid gap-3">
              {navItems.map((item) => {
                const to = item.path
                  ? `/site/${tenantSlug}/${item.path}`
                  : `/site/${tenantSlug}`;

                return (
                  <Link
                    key={item.path || "footer-home"}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-white/55 transition hover:text-white"
                    to={to}
                  >
                    <ChevronRight
                      className="transition group-hover:translate-x-0.5"
                      size={14}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              Contact
            </h2>

            <div className="mt-5 grid gap-4 text-sm text-white/55">
              {tenant.phone ? (
                <a
                  className="flex items-start gap-3 transition hover:text-white"
                  href={`tel:${tenant.phone}`}
                >
                  <Phone className="mt-0.5 shrink-0" size={16} />
                  {tenant.phone}
                </a>
              ) : null}

              {tenant.email ? (
                <a
                  className="flex items-start gap-3 break-all transition hover:text-white"
                  href={`mailto:${tenant.email}`}
                >
                  <Mail className="mt-0.5 shrink-0" size={16} />
                  {tenant.email}
                </a>
              ) : null}

              {tenant.address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  <span className="leading-6">{tenant.address}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </span>

          <span>
            {settings.footer_note || "Education center public website"}
          </span>
        </div>
      </div>
    </footer>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <BookOpen size={21} />
      </div>

      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
        {label}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-xl shadow-slate-900/10">
          <LoaderCircle className="animate-spin" size={28} />
        </div>

        <p className="mt-5 text-sm font-semibold text-slate-600">
          Loading website...
        </p>

        <p className="mt-1 text-xs text-slate-400">Please wait a moment</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/[0.06]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <X size={24} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-slate-950">
          Page unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export default function PublicSite({ page }) {
  const { tenantSlug, postSlug, eventSlug } = useParams();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [eventDetail, setEventDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.hash) {
      const timeout = window.setTimeout(() => {
        const element = document.getElementById(location.hash.replace("#", ""));

        element?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);

      return () => window.clearTimeout(timeout);
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    return undefined;
  }, [location.pathname, location.hash]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError("");
    setData(null);

    instance
      .get(`/public/sites/${tenantSlug}/`)
      .then((response) => {
        if (mounted) {
          setData(normalizeSiteData(response.data));
        }
      })
      .catch(() => {
        if (mounted) {
          setError("This public website is currently unavailable.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [tenantSlug]);

  useEffect(() => {
    if (page !== "news-detail" || !postSlug) {
      setPost(null);
      setComments([]);
      return undefined;
    }

    let mounted = true;

    setPost(null);
    setComments([]);

    instance
      .get(`/public/sites/${tenantSlug}/announcements/${postSlug}/`)
      .then((response) => {
        if (mounted) {
          setPost(response.data.post || null);
          setComments(response.data.comments || []);
        }
      })
      .catch(() => {
        if (mounted) {
          setPost(null);
          setComments([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [page, postSlug, tenantSlug]);

  useEffect(() => {
    if (page !== "event-detail" || !eventSlug) {
      setEventDetail(null);
      return undefined;
    }

    let mounted = true;

    setEventDetail(null);

    instance
      .get(`/public/sites/${tenantSlug}/events/${eventSlug}/`)
      .then((response) => {
        if (mounted) {
          setEventDetail(response.data.event || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setEventDetail(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [eventSlug, page, tenantSlug]);

  const seo = useMemo(() => {
    if (!data) return {};

    const settings = data.settings;

    const currentPost =
      post || data.announcements.find((item) => item.slug === postSlug);

    const currentEvent =
      eventDetail || data.events.find((item) => item.slug === eventSlug);

    if (page === "news-detail" && currentPost) {
      return {
        title:
          currentPost.seo_title || `${currentPost.title} | ${data.tenant.name}`,
        description:
          currentPost.seo_description ||
          currentPost.summary ||
          settings.seo_description,
        image:
          currentPost.image || settings.social_image || settings.hero_image,
        type: "article",
      };
    }

    if (page === "event-detail" && currentEvent) {
      return {
        title:
          currentEvent.seo_title ||
          `${currentEvent.title} | ${data.tenant.name}`,
        description:
          currentEvent.seo_description ||
          currentEvent.summary ||
          settings.seo_description,
        image:
          currentEvent.image || settings.social_image || settings.hero_image,
        type: "article",
      };
    }

    const pageTitles = {
      about: `About ${data.tenant.name}`,
      courses: `Courses and Programs | ${data.tenant.name}`,
      news: `News and Announcements | ${data.tenant.name}`,
      events: `Events | ${data.tenant.name}`,
      achievements: `Achievements | ${data.tenant.name}`,
      contact: `Contact ${data.tenant.name}`,
    };

    return {
      title: pageTitles[page] || settings.seo_title || data.tenant.name,
      description: settings.seo_description || settings.hero_subtitle,
      keywords: settings.seo_keywords,
      image:
        settings.social_image || settings.hero_image || settings.banner_image,
      type: "website",
    };
  }, [data, eventDetail, eventSlug, page, post, postSlug]);

  useEffect(() => {
    if (!seo.title) return;

    const canonical = absoluteUrl(location.pathname);
    const image = seo.image ? absoluteUrl(mediaUrl(seo.image)) : "";

    document.title = seo.title;

    updateMeta("description", seo.description);
    updateMeta("keywords", seo.keywords);
    updateMeta("robots", "index,follow");

    updateMeta("og:title", seo.title, "property");
    updateMeta("og:description", seo.description, "property");
    updateMeta("og:image", image, "property");
    updateMeta("og:url", canonical, "property");
    updateMeta("og:type", seo.type || "website", "property");

    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", seo.title);
    updateMeta("twitter:description", seo.description);
    updateMeta("twitter:image", image);

    updateLink("canonical", canonical);
  }, [location.pathname, seo]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState message={error || "Public website not found."} />;
  }

  const settings = data.settings;
  const name = data.tenant.name || settings.center_name || "Education Center";

  const logo = settings.brand_logo || settings.tenant_logo;

  const rootStyle = {
    "--site-primary": settings.primary_color || "#0f766e",
    "--site-accent": settings.accent_color || "#f59e0b",
  };

  const selectedPost =
    post || data.announcements.find((item) => item.slug === postSlug);

  const selectedEvent =
    eventDetail || data.events.find((item) => item.slug === eventSlug);

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 antialiased selection:bg-[var(--site-primary)] selection:text-white"
      style={rootStyle}
    >
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes public-page-enter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes public-menu-enter {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes public-chat-enter {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .site-page-enter {
          animation: public-page-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .site-mobile-menu {
          animation: public-menu-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .site-chat-enter {
          transform-origin: bottom right;
          animation: public-chat-enter 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .site-page-enter,
          .site-mobile-menu,
          .site-chat-enter {
            animation: none;
          }

          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <PublicHeader tenantSlug={tenantSlug} name={name} logo={logo} />

      <div key={location.pathname} className="site-page-enter">
        {page === "home" ? (
          <HomePage data={data} tenantSlug={tenantSlug} />
        ) : null}

        {page === "about" ? <AboutPage data={data} /> : null}

        {page === "courses" ? <CoursesPage data={data} /> : null}

        {page === "news" ? (
          <NewsPage data={data} tenantSlug={tenantSlug} />
        ) : null}

        {page === "news-detail" ? (
          <NewsDetailPage
            data={data}
            post={selectedPost}
            comments={comments}
            tenantSlug={tenantSlug}
            postSlug={postSlug}
          />
        ) : null}

        {page === "events" ? (
          <EventsPage data={data} tenantSlug={tenantSlug} />
        ) : null}

        {page === "event-detail" ? (
          <EventDetailPage data={data} event={selectedEvent} />
        ) : null}

        {page === "achievements" ? <AchievementsPage data={data} /> : null}

        {page === "contact" ? (
          <ContactPage data={data} tenantSlug={tenantSlug} />
        ) : null}
      </div>

      <PublicFooter
        name={name}
        logo={logo}
        settings={settings}
        tenant={data.tenant}
        tenantSlug={tenantSlug}
      />

      <ChatWidget settings={settings} tenantSlug={tenantSlug} />
    </div>
  );
}
