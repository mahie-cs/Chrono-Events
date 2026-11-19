import raw from "@/events.json";

export const PAGES = ["exams", "assignments", "events"] as const;
export type PageKey = (typeof PAGES)[number];

export const LABEL: Record<PageKey, string> = {
  exams: "Exams",
  assignments: "Assignments",
  events: "Events",
};

export type Status = "upcoming" | "ongoing" | "past" | "postponed" | "cancelled";
export type Bucket = "upcoming" | "ongoing" | "past";

/** Order the sections appear in on each page. */
export const ORDER: Bucket[] = ["upcoming", "ongoing", "past"];

export interface RawEvent {
  type: string;
  name: string;
  /** "YYYY-MM-DD", "-1" (postponed), "0" (cancelled) or "" (no date yet) */
  date?: string | number | null;
  endDate?: string | null;
  details: string;
}

export interface EventItem {
  id: string;
  name: string;
  details: string;
  status: Status;
  dateText: string;
  start: string;
  end: string;
  sortKey: string;
}

export type Grouped = Record<PageKey, Record<Bucket, EventItem[]>>;

const TYPE_TO_PAGE: Record<string, PageKey> = {
  exam: "exams",
  assignment: "assignments",
  event: "events",
};

const TZ = "Asia/Dhaka";

/** Today's date in Bangladesh time, as YYYY-MM-DD. */
export const dhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

const rawDate = (e: RawEvent) => String(e.date == null ? "" : e.date).trim();

const isValid = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(d + "T00:00:00Z");
  return !isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
};

const endOf = (e: RawEvent) => {
  const x = String(e.endDate == null ? "" : e.endDate).trim();
  return isValid(x) && x > rawDate(e) ? x : rawDate(e);
};

const fmt = (a: string, b: string) => {
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const f = (i: string) => new Date(i + "T00:00:00").toLocaleDateString("en-GB", o);
  return b && b !== a ? `${f(a)} – ${f(b)}` : f(a);
};

const statusOf = (e: RawEvent, today: string): Status => {
  const d = rawDate(e);
  if (d === "-1") return "postponed";
  if (d === "0") return "cancelled";
  if (!isValid(d)) return "upcoming";
  if (today < d) return "upcoming";
  if (today > endOf(e)) return "past";
  return "ongoing";
};

const dateTextOf = (e: RawEvent) => {
  const d = rawDate(e);
  if (d === "-1") return "Postponed";
  if (d === "0") return "Cancelled";
  if (d === "") return "Upcoming";
  return isValid(d) ? fmt(d, endOf(e)) : "Date TBA";
};

/** Postponed events sit with upcoming ones; cancelled events go to past. */
const bucketOf = (s: Status): Bucket =>
  s === "postponed" ? "upcoming" : s === "cancelled" ? "past" : s;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function groupEvents(events: RawEvent[], today: string): Grouped {
  const out = {} as Grouped;
  PAGES.forEach((p) => {
    out[p] = { upcoming: [], ongoing: [], past: [] };
  });

  events.forEach((e, i) => {
    const d = rawDate(e);
    const status = statusOf(e, today);
    const item: EventItem = {
      id: `e${i}`,
      name: e.name,
      details: e.details,
      status,
      dateText: dateTextOf(e),
      start: d,
      end: endOf(e),
      // undated events go after dated ones, postponed ones last
      sortKey: d === "-1" ? "9999-99-99" : isValid(d) ? d : "9999-99-98",
    };
    const page = TYPE_TO_PAGE[String(e.type).toLowerCase()] ?? "events";
    out[page][bucketOf(status)].push(item);
  });

  PAGES.forEach((p) => {
    const g = out[p];
    g.upcoming.sort((a, b) => cmp(a.sortKey, b.sortKey));
    g.ongoing.sort((a, b) => cmp(b.start, a.start));
    // cancelled events have no date, so they go after the dated past events
    g.past.sort((a, b) => {
      const ac = a.status === "cancelled";
      const bc = b.status === "cancelled";
      return ac !== bc ? (ac ? 1 : -1) : cmp(b.end, a.end);
    });
  });
  return out;
}

export const EVENTS = raw as unknown as RawEvent[];
