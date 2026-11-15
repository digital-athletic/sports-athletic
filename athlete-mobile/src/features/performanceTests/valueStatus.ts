export type ValueStatus = "IN_RANGE" | "BELOW_RANGE" | "ABOVE_RANGE";

export type ValueRange = { rangeStart: number; rangeEnd: number };

/** Rates a value against a range whose end is the stronger result. */
export function rateValue(value: number, range: ValueRange): ValueStatus {
  // +1 when a higher value is stronger, -1 when a lower one is (sprint seconds).
  const direction = range.rangeStart <= range.rangeEnd ? 1 : -1;

  if ((value - range.rangeEnd) * direction > 0) return "ABOVE_RANGE";
  if ((value - range.rangeStart) * direction < 0) return "BELOW_RANGE";
  return "IN_RANGE";
}
