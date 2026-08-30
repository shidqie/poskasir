/**
 * Format number to Indonesian Rupiah currency format (e.g. Rp15.000)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

/**
 * Format ISO date string to Indonesian formatted date
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatTanggal(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format ISO date string to Indonesian time format (HH:MM)
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatWaktu(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format ISO date string to full Indonesian date & time
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatTanggalWaktu(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
