import { supabase } from '@/lib/supabase';
import { productService } from './productService';

export const productSubmissionService = {
  /**
   * Mengambil daftar pengajuan barang
   */
  async getSubmissions({ status = 'all', submittedBy = null, search = '', submissionType = 'all' } = {}) {
    let query = supabase
      .from('product_submissions')
      .select(`
        *,
        submitter:profiles!submitted_by(id, full_name, role),
        reviewer:profiles!reviewed_by(id, full_name, role),
        parent_product:products!parent_product_id(id, name, code),
        approved_product:products!approved_product_id(id, name, code),
        unit:units!unit_id(id, name, symbol),
        category:categories!category_id(id, name)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all' && status) {
      query = query.eq('status', status);
    }

    if (submissionType !== 'all' && submissionType) {
      query = query.eq('submission_type', submissionType);
    }

    if (submittedBy) {
      query = query.eq('submitted_by', submittedBy);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,barcode.ilike.%${term}%,variant_name.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback query if some relations don't match
      console.warn('[productSubmissionService] getSubmissions join error, trying simple select:', error);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('product_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

    return data || [];
  },

  /**
   * Mengambil jumlah pengajuan yang berstatus 'pending' (untuk badge notifikasi Owner)
   */
  async getPendingCount() {
    try {
      const { count, error } = await supabase
        .from('product_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.warn('[productSubmissionService] getPendingCount error:', error);
        return 0;
      }
      return count || 0;
    } catch (e) {
      return 0;
    }
  },

  /**
   * Mengambil detail satu pengajuan berdasarkan ID
   */
  async getSubmissionById(id) {
    const { data, error } = await supabase
      .from('product_submissions')
      .select(`
        *,
        submitter:profiles!submitted_by(id, full_name, role),
        reviewer:profiles!reviewed_by(id, full_name, role),
        parent_product:products!parent_product_id(id, name, code),
        approved_product:products!approved_product_id(id, name, code),
        unit:units!unit_id(id, name, symbol),
        category:categories!category_id(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengajukan barang / varian baru (dilakukan oleh Kasir atau Pemilik)
   */
  async createSubmission({
    name,
    selling_price,
    barcode = null,
    unit_id = null,
    category_id = null,
    notes = null,
    submission_type = 'new_product',
    parent_product_id = null,
    variant_name = null,
  }) {
    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Nama barang wajib diisi.');
    if (Number(selling_price) < 0) throw new Error('Harga jual tidak boleh bernilai negatif.');

    const trimmedBarcode = barcode?.trim() || null;

    // Cek jika barcode sudah terdaftar resmi
    if (trimmedBarcode) {
      const existing = await this.checkDuplicate({ barcode: trimmedBarcode });
      if (existing.isDuplicate) {
        throw new Error(`Barcode "${trimmedBarcode}" sudah terdaftar sebagai ${existing.description}.`);
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Pengguna tidak terautentikasi.');

    const insertPayload = {
      name: trimmedName,
      selling_price: Number(selling_price) || 0,
      barcode: trimmedBarcode,
      unit_id: unit_id || null,
      category_id: category_id || null,
      notes: notes?.trim() || null,
      submission_type,
      parent_product_id: parent_product_id || null,
      variant_name: variant_name?.trim() || null,
      status: 'pending',
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('product_submissions')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Setujui Pengajuan & Daftarkan ke Data Barang Resmi
   */
  async approveSubmission({
    submission_id,
    category_id = null,
    unit_id = null,
    cost_price = 0,
    initial_stock = 0,
    minimum_stock = 5,
    has_variants = false,
    barcode = null,
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Ambil detail pengajuan
    const sub = await this.getSubmissionById(submission_id);
    if (!sub) throw new Error('Data pengajuan tidak ditemukan.');

    const finalCategoryId = category_id || sub.category_id;
    const finalUnitId = unit_id || sub.unit_id;
    const finalBarcode = barcode?.trim() || sub.barcode?.trim() || null;
    const finalInitialStock = Number(initial_stock) || 0;
    const finalMinStock = Number(minimum_stock) || 5;

    // 2. Cek apakah varian baru untuk produk induk yang sudah ada
    if (sub.submission_type === 'new_variant' && sub.parent_product_id) {
      // Buat varian baru
      const { data: varData, error: varErr } = await supabase
        .from('product_variants')
        .insert([
          {
            product_id: sub.parent_product_id,
            variant_name: sub.variant_name || sub.name,
            code: `VAR-${Date.now().toString().slice(-4)}`,
            barcode: finalBarcode,
            selling_price: Number(sub.selling_price) || 0,
            stock: finalInitialStock,
            minimum_stock: finalMinStock,
            unit_id: finalUnitId,
            status: true,
            created_by: user?.id || null,
          },
        ])
        .select()
        .single();

      if (varErr) throw varErr;

      // Update produk induk agar has_variants = true
      await supabase
        .from('products')
        .update({ has_variants: true, updated_at: new Date().toISOString() })
        .eq('id', sub.parent_product_id);

      // Update status submission
      await supabase
        .from('product_submissions')
        .update({
          status: 'approved',
          approved_variant_id: varData.id,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission_id);

      return {
        success: true,
        message: 'Varian produk berhasil disetujui & didaftarkan ke data resmi.',
        variant_id: varData.id,
      };
    } else {
      // Kasus Produk Baru
      if (!finalCategoryId) throw new Error('Kategori barang wajib dipilih.');
      if (!finalUnitId) throw new Error('Satuan barang wajib dipilih.');

      const productCode = await productService.getNextProductCode();

      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert([
          {
            name: sub.name.trim(),
            code: productCode,
            barcode: finalBarcode,
            category_id: finalCategoryId,
            unit_id: finalUnitId,
            selling_price: has_variants ? 0 : Number(sub.selling_price) || 0,
            stock: has_variants ? 0 : finalInitialStock,
            minimum_stock: has_variants ? 0 : finalMinStock,
            has_variants: Boolean(has_variants || sub.variant_name),
            status: true,
            created_by: user?.id || null,
            updated_by: user?.id || null,
          },
        ])
        .select()
        .single();

      if (prodErr) throw prodErr;

      // Jika ada nama varian, tambahkan varian pertama
      if (sub.variant_name) {
        await supabase.from('product_variants').insert([
          {
            product_id: newProd.id,
            variant_name: sub.variant_name.trim(),
            code: `${productCode}-V1`,
            barcode: finalBarcode,
            selling_price: Number(sub.selling_price) || 0,
            stock: finalInitialStock,
            minimum_stock: finalMinStock,
            unit_id: finalUnitId,
            status: true,
            created_by: user?.id || null,
          },
        ]);
      }

      // Update status submission
      await supabase
        .from('product_submissions')
        .update({
          status: 'approved',
          category_id: finalCategoryId,
          unit_id: finalUnitId,
          approved_product_id: newProd.id,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission_id);

      return {
        success: true,
        message: 'Barang baru berhasil disetujui & resmi masuk Data Barang.',
        product_id: newProd.id,
      };
    }
  },

  /**
   * Tolak Pengajuan Barang (RPC PostgreSQL)
   */
  async rejectSubmission({ submission_id, rejection_reason }) {
    const reason = rejection_reason?.trim();
    if (!reason) throw new Error('Alasan penolakan wajib diisi.');

    const { data, error } = await supabase.rpc('reject_product_submission', {
      p_submission_id: submission_id,
      p_rejection_reason: reason,
    });

    if (error) {
      console.error('[productSubmissionService] RPC reject error:', error);
      throw new Error(error.message || 'Gagal menolak pengajuan barang.');
    }

    return data;
  },

  /**
   * Memeriksa kemungkinan duplikasi barcode atau nama barang serupa
   */
  async checkDuplicate({ barcode = null, name = '' }) {
    const trimmedBarcode = barcode?.trim();
    const trimmedName = name?.trim();

    // 1. Cek Barcode di Products
    if (trimmedBarcode) {
      const { data: prodBarcode } = await supabase
        .from('products')
        .select('id, name, code, barcode')
        .eq('barcode', trimmedBarcode)
        .maybeSingle();

      if (prodBarcode) {
        return {
          isDuplicate: true,
          type: 'barcode_product',
          description: `Produk Resmi: "${prodBarcode.name}" (${prodBarcode.code})`,
          item: prodBarcode,
        };
      }

      // Cek Barcode di Product Variants
      const { data: varBarcode } = await supabase
        .from('product_variants')
        .select('id, name, barcode, product:products(name)')
        .eq('barcode', trimmedBarcode)
        .maybeSingle();

      if (varBarcode) {
        return {
          isDuplicate: true,
          type: 'barcode_variant',
          description: `Varian Produk: "${varBarcode.product?.name} - ${varBarcode.name}"`,
          item: varBarcode,
        };
      }
    }

    // 2. Cek Nama Mirip di Products
    if (trimmedName && trimmedName.length >= 3) {
      const { data: similarProds } = await supabase
        .from('products')
        .select('id, name, code, selling_price')
        .ilike('name', `%${trimmedName}%`)
        .limit(3);

      if (similarProds && similarProds.length > 0) {
        return {
          isDuplicate: false,
          hasSimilar: true,
          similarItems: similarProds,
          description: `Ditemukan ${similarProds.length} produk resmi serupa`,
        };
      }
    }

    return { isDuplicate: false, hasSimilar: false };
  },

  /**
   * Mengubah / Mengedit data pengajuan barang (dapat dilakukan oleh Pemilik)
   */
  async updateSubmission(id, {
    name,
    variant_name,
    selling_price,
    barcode,
    category_id,
    unit_id,
    notes,
  }) {
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (variant_name !== undefined) updatePayload.variant_name = variant_name?.trim() || null;
    if (selling_price !== undefined) updatePayload.selling_price = Number(selling_price) || 0;
    if (barcode !== undefined) updatePayload.barcode = barcode?.trim() || null;
    if (category_id !== undefined) updatePayload.category_id = category_id || null;
    if (unit_id !== undefined) updatePayload.unit_id = unit_id || null;
    if (notes !== undefined) updatePayload.notes = notes?.trim() || null;
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('product_submissions')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        submitter:profiles!submitted_by(id, full_name, role),
        reviewer:profiles!reviewed_by(id, full_name, role),
        parent_product:products!parent_product_id(id, name, code),
        approved_product:products!approved_product_id(id, name, code),
        unit:units!unit_id(id, name, symbol),
        category:categories!category_id(id, name)
      `)
      .single();

    if (error) {
      console.error('[productSubmissionService] updateSubmission error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Menghapus pengajuan barang (dapat dilakukan oleh Pemilik)
   */
  async deleteSubmission(id) {
    const { error } = await supabase
      .from('product_submissions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[productSubmissionService] deleteSubmission error:', error);
      throw error;
    }
    return true;
  },

  /**
   * Menghapus banyak pengajuan barang sekaligus
   */
  async bulkDeleteSubmissions(ids) {
    if (!ids || ids.length === 0) return true;
    const { error } = await supabase
      .from('product_submissions')
      .delete()
      .in('id', ids);
    if (error) {
      console.error('[productSubmissionService] bulkDeleteSubmissions error:', error);
      throw error;
    }
    return true;
  },
};

export default productSubmissionService;
