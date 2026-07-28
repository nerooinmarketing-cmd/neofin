/** tr-TR Excel için noktalı virgülle ayrılmış, UTF-8 BOM'lu CSV üretir. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  function escapeCell(value: string | number): string {
    const str = String(value);
    if (/[";\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [headers.map(escapeCell).join(";"), ...rows.map((row) => row.map(escapeCell).join(";"))];
  return `﻿${lines.join("\r\n")}`;
}
