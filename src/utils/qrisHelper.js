/**
 * QRIS EMVCo Generator & Parser Helper
 * Standar QR Code Indonesian Standard (QRIS) Bank Indonesia / ASPI
 */

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
 * Konversi Static QRIS Payload menjadi Dynamic QRIS dengan Nominal Tersemat
 * Serta menghitung ulang CRC16
 */
export function convertStaticToDynamic(staticPayload, amount) {
  if (!staticPayload || !amount) return staticPayload;

  let clean = staticPayload.trim();

  // Jika string memiliki CRC (6304XXXX) di belakang, hapus 4 karakter CRC
  if (clean.includes('6304')) {
    clean = clean.substring(0, clean.lastIndexOf('6304'));
  }

  // Ganti Point of Initiation Method dari 11 (Static) ke 12 (Dynamic)
  // Tag 01: 010211 -> 010212
  if (clean.includes('010211')) {
    clean = clean.replace('010211', '010212');
  }

  // Format Tag 54 (Transaction Amount)
  const amountStr = String(Math.round(Number(amount)));
  const tag54 = formatTLV('54', amountStr);

  // Jika tag 54 sudah ada, ganti dengan nominal baru
  const tag54Regex = /54\d{2}\d+/;
  if (tag54Regex.test(clean)) {
    clean = clean.replace(tag54Regex, tag54);
  } else {
    // Sisipkan Tag 54 sebelum Tag 58 (Country Code '5802ID')
    if (clean.includes('5802ID') || clean.includes('5802id')) {
      clean = clean.replace('5802ID', `${tag54}5802ID`);
    } else {
      clean = clean + tag54;
    }
  }

  // Tambahkan tag 6304 dan hitung CRC16 baru
  clean = clean + '6304';
  const checksum = crc16(clean);

  return clean + checksum;
}

/**
 * Generate Standard EMVCo QRIS dari Merchant Metadata
 */
export function generateEMVCoQRIS({
  nmid = 'ID1025414908653',
  merchantName = 'WARUNG GARINUL, PACET',
  merchantCity = 'PACET',
  amount = null,
  acquirerId = '936009140000000000',
  merchantCriteria = 'A01',
}) {
  // Sub-tags untuk Tag 26 (Merchant Account Information)
  const sub00 = formatTLV('00', 'ID.CO.QRIS.WWW');
  const sub01 = formatTLV('01', acquirerId);
  const sub02 = formatTLV('02', nmid);
  const sub03 = formatTLV('03', merchantCriteria);
  const tag26 = formatTLV('26', sub00 + sub01 + sub02 + sub03);

  let raw = '';
  raw += formatTLV('00', '01'); // 00: Format Indicator (01)
  raw += formatTLV('01', amount && Number(amount) > 0 ? '12' : '11'); // 01: 11 = Static, 12 = Dynamic
  raw += tag26; // 26: Merchant Account Information
  raw += formatTLV('51', formatTLV('00', 'ID.CO.QRIS.WWW') + formatTLV('02', nmid)); // 51: National Merchant ID
  raw += formatTLV('52', '5411'); // 52: MCC (5411 = Grocery / Supermarket)
  raw += formatTLV('53', '360'); // 53: Currency (360 = IDR)

  if (amount && Number(amount) > 0) {
    raw += formatTLV('54', String(Math.round(Number(amount)))); // 54: Amount
  }

  raw += formatTLV('58', 'ID'); // 58: Country (ID)
  raw += formatTLV('59', merchantName.substring(0, 25)); // 59: Merchant Name
  raw += formatTLV('60', merchantCity.substring(0, 15)); // 60: City

  // Tag 63: CRC placeholder
  raw += '6304';
  const checksum = crc16(raw);

  return raw + checksum;
}
