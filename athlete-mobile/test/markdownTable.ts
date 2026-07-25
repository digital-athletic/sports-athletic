/**
 * Renders deterministic markdown value tables from a column spec, so a new
 * golden table costs a column array instead of a hand-written serializer.
 */

export interface ColumnSpec<T> {
  header: string;
  /** `null` renders as a blank cell, the convention for an unknown value. */
  value: (row: T) => string | number | null;
}

const formatRow = (cells: string[]): string => `| ${cells.join(" | ")} |`;

export function renderTable<T>(columns: ColumnSpec<T>[], rows: T[]): string {
  const lines = [
    formatRow(columns.map((column) => column.header)),
    formatRow(columns.map(() => "---")),
    ...rows.map((row) =>
      formatRow(
        columns.map((column) => {
          const value = column.value(row);
          return value === null ? "" : String(value);
        }),
      ),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
