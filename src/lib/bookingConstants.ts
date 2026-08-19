/**
 * Fixed time-of-day bands, not date-specific rows in the database (Phase 5
 * §2/§3: "Show available appointment slots where supported by the existing
 * database" — availability is computed from existing request counts per
 * date+slot rather than a separate scheduling table). No "server-only"
 * import here deliberately — both the public booking Client Components and
 * the server-side data-access/action layer need these same values.
 */
export const APPOINTMENT_TIME_SLOTS = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] as const;
export const HOME_COLLECTION_TIME_SLOTS = [
  "8:00 AM \u2013 10:00 AM",
  "10:00 AM \u2013 12:00 PM",
  "12:00 PM \u2013 2:00 PM",
  "2:00 PM \u2013 4:00 PM",
] as const;
