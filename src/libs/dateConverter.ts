export const toDateSafe = (value: any): Date | null => {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const formatTimestamp = (value: any) => {
  if (!value) return null;

  const date = value?.toDate ? value.toDate() : new Date(value);

  return {
    _seconds: Math.floor(date.getTime() / 1000),
    _nanoseconds: (date.getTime() % 1000) * 1_000_000,
  };
};
