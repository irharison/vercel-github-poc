"use client";

import { useMemo, useState } from "react";

export type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  sort?: (row: T) => string | number | null;
  render: (row: T) => React.ReactNode;
};

function rowId<T>(row: T, index: number): string | number {
  if (row && typeof row === "object") {
    const record = row as { id?: string | number; Id?: string | number };
    const id = record.id ?? record.Id;
    if (id != null) return id;
  }
  return index;
}

export function DataGrid<T>({
  rows,
  columns,
  onRow,
  selected,
  rowClass,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  onRow?: (row: T) => void;
  selected?: number | string | null;
  rowClass?: (row: T) => string;
  empty?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sort) return rows;
    return [...rows].sort((a, b) => {
      const av = column.sort!(a);
      const bv = column.sort!(b);
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, columns, sortKey, dir]);

  return (
    <div className="grid-wrap panel">
      <table className="grid">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === "right" ? "num" : ""}
                onClick={() => {
                  if (!column.sort) return;
                  if (sortKey === column.key) setDir((d) => (d === 1 ? -1 : 1));
                  else {
                    setSortKey(column.key);
                    setDir(1);
                  }
                }}
              >
                {column.label}
                {sortKey === column.key ? (dir === 1 ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="muted">
                {empty ?? "Nothing to show."}
              </td>
            </tr>
          ) : (
            sorted.map((row, index) => (
              <tr
                key={rowId(row, index)}
                className={`${rowClass?.(row) ?? ""} ${selected != null && rowId(row, index) === selected ? "selected" : ""}`}
                onClick={() => onRow?.(row)}
                style={{ cursor: onRow ? "pointer" : "default" }}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.align === "right" ? "num" : ""}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
