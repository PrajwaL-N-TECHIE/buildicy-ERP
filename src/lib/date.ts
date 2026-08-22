/**
 * Date helpers used across the SPA. Centralised so demo / placeholder
 * dates never sneak back into a component.
 */

/** YYYY-MM-DD for "today" in the user's local timezone. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True if a task was logged today. */
export function isToday(isoDate: string | null | undefined): boolean {
  return isoDate === todayIso();
}
