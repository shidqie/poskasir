/**
 * QRIS EMVCo Generator & Parser Helper
 * Standar QR Code Indonesian Standard (QRIS) Bank Indonesia / ASPI
 */

export const WARUNG_GARINUL_STATIC_QRIS =
  '00020101021126610014COM.GO-JEK.WWW01189360091432845408950210G2845408950303UMI51440014ID.CO.QRIS.WWW0215ID10254149086530303UMI5204549953033605802ID5921Warung Garinul, PACET6007CIANJUR61054325362070703A016304A676';

export const MIN_QRIS_AMOUNT = 10000; // Minimal transaksi QRIS: Rp 10.000 (10k)

/**
 * CRC-16 / CCITT-FALSE (0x1021, init 0xFFFF)
 */
export function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Format Tag-Length-Value (TLV)
 */
export function formatTLV(tag, value) {
  if (value === null || value === undefined) return '';
  const strVal = String(value);
  const len = String(strVal.length).padStart(2, '0');
  return `${tag}${len}${strVal}`;
}

/**
 * Parse top-level TLV tags dari string payload EMVCo QRIS
 */
export function parseEMVCo(payload) {
  const tags = {};
  if (!payload) return tags;

  let clean = payload.trim();
  if (clean.includes('6304')) {
    clean = clean.substring(0, clean.lastIndexOf('6304'));
  }

  let i = 0;
  while (i < clean.length) {
    if (i + 4 > clean.length) break;
    const tag = clean.substring(i, i + 2);
    const len = parseInt(clean.substring(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const val = clean.substring(i + 4, i + 4 + len);
    tags[tag] = val;
    i += 4 + len;
  }
  return tags;
}

/**
 * Konversi Static QRIS Payload menjadi Dynamic QRIS dengan Nominal Tersemat
 * Standar EMVCo TLV parsing & rekonstruksi ulang dengan CRC16 yang valid
 */
export function convertStaticToDynamic(staticPayload = WARUNG_GARINUL_STATIC_QRIS, amount = null) {
  const base = (staticPayload && staticPayload.trim()) || WARUNG_GARINUL_STATIC_QRIS;
  const tags = parseEMVCo(base);

  // Jika ada nominal, ubah menjadi Dynamic (Tag 01 = 12) dan isi Tag 54
  const numericAmount = Math.round(Number(amount) || 0);
  if (numericAmount > 0) {
    tags['01'] = '12'; // Dynamic QRIS
    tags['54'] = String(numericAmount); // Transaction Amount
  } else {
    tags['01'] = '11'; // Static QRIS
    delete tags['54'];
  }

  // Urutan standar EMVCo tags
  const standardOrder = [
    '00', '01', '26', '27', '28', '29', '30', '31', '32', '33',
    '34', '35', '36', '37', '38', '39', '40', '41', '42', '43',
    '44', '45', '46', '47', '48', '49', '50', '51', '52', '53',
    '54', '55', '56', '57', '58', '59', '60', '61', '62'
  ];

  let raw = '';
  // Susun tag sesuai urutan standar
  for (const t of standardOrder) {
    if (tags[t] !== undefined) {
      const v = tags[t];
      const len = String(v.length).padStart(2, '0');
      raw += `${t}${len}${v}`;
    }
  }

  // Tambahkan tag lainnya jika ada
  for (const t of Object.keys(tags)) {
    if (!standardOrder.includes(t)) {
      const v = tags[t];
      const len = String(v.length).padStart(2, '0');
      raw += `${t}${len}${v}`;
    }
  }

  // Hitung ulang CRC16
  raw += '6304';
  const checksum = crc16(raw);

  return raw + checksum;
}

/**
 * Generate Standard EMVCo QRIS dari Merchant Metadata
 */
export function generateEMVCoQRIS({
  nmid = 'ID1025414908653',
  merchantName = 'WARUNG GARINUL, PACET',
  merchantCity = 'CIANJUR',
  amount = null,
  acquirerId = '936009143284540895',
  merchantCriteria = 'UMI',
}) {
  return convertStaticToDynamic(WARUNG_GARINUL_STATIC_QRIS, amount);
}

export default {
  WARUNG_GARINUL_STATIC_QRIS,
  MIN_QRIS_AMOUNT,
  crc16,
  formatTLV,
  parseEMVCo,
  convertStaticToDynamic,
  generateEMVCoQRIS,
};
