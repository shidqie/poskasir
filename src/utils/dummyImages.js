import React from 'react';
import {
  Coffee,
  CupSoda,
  UtensilsCrossed,
  Wheat,
  Flame,
  Sparkles,
  Package,
  ShoppingBag,
} from 'lucide-react';

/**
 * Mendapatkan tema visual (warna gradien & ikon) untuk kategori sembako
 */
export function getProductCategoryTheme(productName = '', categoryName = '') {
  const name = String(productName).toLowerCase();
  const cat = String(categoryName).toLowerCase();

  // 1. Minuman / Air Mineral / Teh / Kopi
  if (
    cat.includes('minum') ||
    name.includes('minerale') ||
    name.includes('aqua') ||
    name.includes('teh') ||
    name.includes('kopi') ||
    name.includes('susu') ||
    name.includes('jus') ||
    name.includes('larutan') ||
    name.includes('floridina') ||
    name.includes('pucuk')
  ) {
    return {
      bgGradient: 'from-sky-500 to-blue-600',
      iconBg: 'bg-white/20 text-white',
      accentColor: 'text-sky-600',
      tag: 'Minuman',
      Icon: CupSoda,
      photoUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
    };
  }

  // 2. Makanan / Mie Instan / Snack
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
    return {
      bgGradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-white/20 text-white',
      accentColor: 'text-amber-600',
      tag: 'Makanan',
      Icon: UtensilsCrossed,
      photoUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
    };
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
    return {
      bgGradient: 'from-yellow-500 to-amber-700',
      iconBg: 'bg-white/20 text-white',
      accentColor: 'text-yellow-600',
      tag: 'Beras & Tepung',
      Icon: Wheat,
      photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    };
  }

  // 4. Minyak / Gula / Garam / Bumbu Dapur
  if (
    cat.includes('bumbu') ||
    cat.includes('minyak') ||
    cat.includes('rempah') ||
    name.includes('minyak') ||
    name.includes('gula') ||
    name.includes('garam') ||
    name.includes('kecap') ||
    name.includes('saus') ||
    name.includes('royco') ||
    name.includes('masako')
  ) {
    return {
      bgGradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-white/20 text-white',
      accentColor: 'text-red-600',
      tag: 'Bumbu & Minyak',
      Icon: Flame,
      photoUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    };
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
    return {
      bgGradient: 'from-teal-500 to-emerald-600',
      iconBg: 'bg-white/20 text-white',
      accentColor: 'text-teal-600',
      tag: 'Kebutuhan Rumah',
      Icon: Sparkles,
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    };
  }

  // 6. Default Sembako
  return {
    bgGradient: 'from-slate-600 to-slate-800',
    iconBg: 'bg-white/20 text-white',
    accentColor: 'text-slate-600',
    tag: categoryName || 'Sembako',
    Icon: ShoppingBag,
    photoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
  };
}

export function getProductDummyImage(productName = '', categoryName = '', customUrl = null) {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim().length > 5) {
    return customUrl;
  }
  return getProductCategoryTheme(productName, categoryName).photoUrl;
}

export default getProductCategoryTheme;
