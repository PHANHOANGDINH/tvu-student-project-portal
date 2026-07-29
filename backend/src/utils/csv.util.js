const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function parseCsv(text) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n') { row.push(value); rows.push(row); row = []; value = ''; }
    else if (char !== '\r') value += char;
  }
  if (quoted) throw new Error('CSV có ô chưa đóng dấu ngoặc kép.');
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows.filter((item) => item.some((cell) => String(cell).trim() !== ''));
}

function safeCell(value) {
  let text = String(value ?? '');
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function createCsv(headers, rows) {
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(safeCell).join(',')).join('\r\n');
}

export function csvRecords(text, expectedHeaders) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('File CSV không có dữ liệu.');
  const headers = rows[0].map((value) => String(value).trim());
  if (headers.length !== expectedHeaders.length || headers.some((value, index) => value !== expectedHeaders[index])) {
    throw new Error(`Header CSV phải là: ${expectedHeaders.join(',')}`);
  }
  return rows.slice(1).map((values, index) => ({
    rowNumber: index + 2,
    data: Object.fromEntries(expectedHeaders.map((header, column) => [header, String(values[column] ?? '').trim()])),
    extraColumns: values.slice(expectedHeaders.length).some((value) => String(value).trim() !== ''),
  }));
}
