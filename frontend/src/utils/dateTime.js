const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = validDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(value, { connector = " lúc " } = {}) {
  const date = validDate(value);
  if (!date) return "—";
  return `${dateFormatter.format(date)}${connector}${timeFormatter.format(date)}`;
}

export function formatDateRange(start, end) {
  return `${formatDateTime(start, { connector: ", " })} – ${formatDateTime(end, { connector: ", " })}`;
}
