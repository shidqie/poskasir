/**
 * Helper untuk menghasilkan foto dummy produk sembako berkualitas tinggi
 * berdasarkan kategori atau nama produk
 */
export function getProductDummyImage(productName = '', categoryName = '', customUrl = null) {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim().length > 5) {
    return customUrl;
  }

  const name = String(productName).toLowerCase();
  const cat = String(categoryName).toLowerCase();

  // 1. Minuman / Air Mineral / Kopi / Teh
  if (
    cat.includes('minum') ||
    name.includes('le minerale') ||
    name.includes('aqua') ||
    name.includes('teh') ||
    name.includes('kopi') ||
    name.includes('susu') ||
    name.includes('jus') ||
    name.includes('larutan') ||
    name.includes('floridina') ||
    name.includes('pucuk')
  ) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80';
  }

  // 2. Mie Instan / Makanan / Snack
  if (
    cat.includes('makan') ||
    cat.includes('mie') ||
    cat.includes('snack') ||
    name.includes('indomie') ||
    name.includes('sedap') ||
    name.includes('sarimi') ||
    name.includes('biskuit') ||
    name.includes('roti') ||
    name.includes('chiki')
  ) {
    return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80';
  }

  // 3. Beras / Tepung / Biji-bijian
  if (
    cat.includes('beras') ||
    name.includes('beras') ||
    name.includes('tepung') ||
    name.includes('ketan') ||
    name.includes('sagu') ||
    name.includes('tapioka')
  ) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80';
  }

  // 4. Minyak Goreng / Gula / Garam / Bumbu Dapur
  if (
    cat.includes('bumbu') ||
    cat.includes('minyak') ||
    name.includes('minyak') ||
    name.includes('gula') ||
    name.includes('garam') ||
    name.includes('kecap') ||
    name.includes('saus') ||
    name.includes('royco') ||
    name.includes('masako')
  ) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80';
  }

  // 5. Kebutuhan Rumah Tangga / Sabun / Deterjen
  if (
    cat.includes('rumah') ||
    cat.includes('sabun') ||
    name.includes('sunlight') ||
    name.includes('rinso') ||
    name.includes('daia') ||
    name.includes('mama lemon') ||
    name.includes('pepsodent') ||
    name.includes('shampo')
  ) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
  }

  // 6. Default Sembako Umum
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
}

export default getProductDummyImage;
