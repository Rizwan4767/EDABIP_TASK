function normalizeColumns(columns, rows) {
  if (Array.isArray(columns) && columns.length) {
    return columns.map((column) =>
      typeof column === 'string' ? { key: column, label: column } : column
    );
  }

  const first = rows.find((row) => row && typeof row === 'object');
  if (!first) return [{ key: 'value', label: 'Value' }];

  return Object.keys(first)
    .filter((key) => first[key] == null || typeof first[key] !== 'object')
    .map((key) => ({ key, label: key }));
}

function cellValue(row, key) {
  if (row == null) return '';
  if (typeof row !== 'object') return String(row);
  const value = row[key];
  if (value == null || typeof value === 'object') return '';
  return String(value);
}

/**
 * Hands a blob to the browser as a file save.
 *
 * Exported so server-generated downloads (an authenticated CSV fetched
 * through the API client, say) go out the same way as the ones built here,
 * rather than each caller writing its own anchor dance.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(columns, rows) {
  const header = columns.map((column) => csvEscape(column.label)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => csvEscape(cellValue(row, column.key))).join(',')
  );
  return `\uFEFF${[header, ...body].join('\n')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toHtmlDocument(title, columns, rows) {
  const headerCells = columns
    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
    .join('');
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(cellValue(row, column.key))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; }
      h1 { font-size: 18px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;
}

function pdfEscape(value) {
  return String(value ?? '')
    .replaceAll('\\', String.raw`\\`)
    .replaceAll('(', String.raw`\(`)
    .replaceAll(')', String.raw`\)`)
    .replaceAll(/[^\x20-\x7E]/g, ' ');
}

function toPdf(title, columns, rows) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const lineHeight = 14;
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);
  const lines = [
    title,
    '',
    columns.map((column) => column.label).join(' | '),
    ...rows.map((row) =>
      columns.map((column) => cellValue(row, column.key)).join(' | ')
    ),
  ].map((line) => (line.length > 110 ? `${line.slice(0, 107)}...` : line));

  const pages = [];
  for (let index = 0; index < lines.length; index += maxLines) {
    pages.push(lines.slice(index, index + maxLines));
  }
  if (!pages.length) pages.push(['']);

  const objectCount = 3 + pages.length * 2;
  const objects = new Array(objectCount + 1);
  const kids = pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ');

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`;

  pages.forEach((pageLines, index) => {
    const pageNumber = 3 + index * 2;
    const contentNumber = pageNumber + 1;
    const commands = [
      'BT',
      '/F1 10 Tf',
      `${margin} ${pageHeight - margin} Td`,
      `${lineHeight} TL`,
      ...pageLines.map((line) => `(${pdfEscape(line)}) T*`),
      'ET',
    ].join('\n');
    objects[pageNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentNumber} 0 R /Resources << /Font << /F1 ${objectCount} 0 R >> >> >>`;
    objects[contentNumber] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });

  objects[objectCount] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let offset = 0;
  const xref = ['0000000000 65535 f '];
  const chunks = ['%PDF-1.4\n'];
  offset = chunks[0].length;

  for (let number = 1; number <= objectCount; number += 1) {
    xref.push(`${String(offset).padStart(10, '0')} 00000 n `);
    const object = `${number} 0 obj\n${objects[number]}\nendobj\n`;
    chunks.push(object);
    offset += object.length;
  }

  const xrefOffset = offset;
  chunks.push(
    `xref\n0 ${objectCount + 1}\n${xref.join('\n')}\n`,
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );
  return chunks.join('');
}

export function exportTable({ format, filename = 'export', title = 'Export', columns = [], rows = [] } = {}) {
  const safeRows = Array.isArray(rows) && rows.length ? rows : [{ value: 'No data available' }];
  const normalizedColumns = normalizeColumns(columns, safeRows);
  const safeName = String(filename || 'export').replace(/[^\w.-]+/g, '-');

  if (format === 'csv') {
    downloadBlob(new Blob([toCsv(normalizedColumns, safeRows)], { type: 'text/csv;charset=utf-8;' }), `${safeName}.csv`);
    return;
  }

  if (format === 'word') {
    downloadBlob(
      new Blob([toHtmlDocument(title, normalizedColumns, safeRows)], { type: 'application/msword' }),
      `${safeName}.doc`
    );
    return;
  }

  downloadBlob(new Blob([toPdf(title, normalizedColumns, safeRows)], { type: 'application/pdf' }), `${safeName}.pdf`);
}

export const exportToCSV = (data, filename) => {
  exportTable({ format: 'csv', filename, rows: data });
};

export const exportToPDF = (data, filename) => {
  exportTable({ format: 'pdf', filename, rows: data });
};
