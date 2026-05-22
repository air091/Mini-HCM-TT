const BUSINESS_TIMEZONE_OFFSET_HOURS = 8;
const BUSINESS_TIMEZONE_OFFSET_MS =
  BUSINESS_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;

type BusinessDateParts = {
  year: number;
  monthIndex: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export function parseBusinessDateTime(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  if (value instanceof Date) {
    return assertValidDate(value);
  }

  if (typeof value !== "string") {
    throw new Error("Invalid punch time");
  }

  const trimmed = value.trim();
  const localDateTime = parseLocalDateTime(trimmed);

  if (localDateTime) {
    return localDateTime;
  }

  return assertValidDate(new Date(trimmed));
}

export function getBusinessDateParts(date: Date): BusinessDateParts {
  const shifted = new Date(date.getTime() + BUSINESS_TIMEZONE_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    seconds: shifted.getUTCSeconds(),
    milliseconds: shifted.getUTCMilliseconds(),
  };
}

export function fromBusinessDateParts(
  year: number,
  monthIndex: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
): Date {
  return new Date(
    Date.UTC(year, monthIndex, day, hours, minutes, seconds, milliseconds) -
      BUSINESS_TIMEZONE_OFFSET_MS,
  );
}

export function getBusinessClockParts(date: Date) {
  const parts = getBusinessDateParts(date);

  return {
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: parts.seconds,
    milliseconds: parts.milliseconds,
  };
}

export function formatBusinessDate(value: unknown): string | null {
  if (!value) return null;

  const date: Date =
    typeof (value as { toDate?: unknown })?.toDate === "function"
      ? (value as { toDate: () => Date }).toDate()
      : value instanceof Date
        ? value
        : new Date(value as string);

  if (Number.isNaN(date.getTime())) return null;

  const parts = getBusinessDateParts(date);
  const mm = String(parts.monthIndex + 1).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  const yy = String(parts.year).slice(-2);

  let hours = parts.hours;
  const minutes = String(parts.minutes).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours %= 12;
  hours = hours === 0 ? 12 : hours;

  const hh = String(hours).padStart(2, "0");

  return `${mm}/${dd}/${yy} ${hh}:${minutes} ${ampm}`;
}

function parseLocalDateTime(value: string): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value,
    );

  if (!match) return null;

  const [, year, month, day, hours, minutes, seconds = "0", ms = "0"] = match;

  return fromBusinessDateParts(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
    Number(ms.padEnd(3, "0")),
  );
}

function assertValidDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid punch time");
  }

  return date;
}
