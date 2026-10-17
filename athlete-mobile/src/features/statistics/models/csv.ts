export type CsvField = string | number | null;

const BOM = String.fromCharCode(0xfeff);
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /[",\r\n]/;

/**
 * Escapes one field per RFC 4180. Text starting with a formula character gets
 * a `'` prefix so spreadsheets do not evaluate it. Numbers stay untouched.
 */
export const escapeCsvField = (value: CsvField): string => {
  if (value === null) return "";
  if (typeof value === "number") return String(value);

  const guarded = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return NEEDS_QUOTING.test(guarded)
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
};

/** Builds a UTF-8 CSV with BOM, comma separators and CRLF line ends. */
export const buildCsv = (header: string[], rows: CsvField[][]): string =>
  BOM +
  [header, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n") +
  "\r\n";
