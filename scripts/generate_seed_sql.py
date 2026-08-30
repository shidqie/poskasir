import zipfile
import xml.etree.ElementTree as ET

def generate_sql():
    with zipfile.ZipFile('Daftar_Barang_Full_dengan_Varian_dan_Harga.xlsx') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t_elems = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared_strings.append(''.join([t.text for t in t_elems if t.text]))
        
        tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
        
        items = []
        current_category = ''
        categories_set = set()
        units_set = set()
        
        for r_idx, row in enumerate(rows[3:]):
            cells = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r_attr = c.get('r')
                col_letter = ''.join([ch for ch in r_attr if ch.isalpha()])
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v.text if v is not None else ''
                if c.get('t') == 's' and val.isdigit():
                    val = shared_strings[int(val)]
                cells[col_letter] = val.strip()
                
            kat = cells.get('A', '') or current_category
            if cells.get('A'): current_category = cells.get('A')
            nama = cells.get('B', '')
            varian = cells.get('C', '')
            harga_str = cells.get('D', '')
            satuan = cells.get('E', '') or 'Pcs'
            harga_pack = cells.get('F', '')
            satuan_pack = cells.get('G', '')
            sumber = cells.get('H', '')
            catatan = cells.get('I', '')
            
            if nama:
                categories_set.add(kat)
                units_set.add(satuan)
                try:
                    price = float(harga_str) if harga_str else 0
                except:
                    price = 0
                
                note_parts = []
                if sumber: note_parts.append(f'Sumber: {sumber}')
                if catatan: note_parts.append(catatan)
                if harga_pack and satuan_pack: note_parts.append(f'Harga Pack ({satuan_pack}): Rp {harga_pack}')
                
                items.append({
                    'category': kat,
                    'name': nama,
                    'variant_name': varian if varian else None,
                    'selling_price': price,
                    'unit': satuan,
                    'notes': ' | '.join(note_parts) if note_parts else None
                })

    sql_lines = []
    sql_lines.append('-- ==============================================================================')
    sql_lines.append('-- SEED 185 PENGAJUAN BARANG DARI EXCEL (Daftar_Barang_Full_dengan_Varian_dan_Harga.xlsx)')
    sql_lines.append('-- Status: pending (Menunggu Persetujuan Pemilik Toko)')
    sql_lines.append('-- Jalankan di SQL Editor Supabase Dashboard')
    sql_lines.append('-- ==============================================================================\n')

    sql_lines.append('-- 0. Pastikan Tabel product_submissions Tersedia')
    sql_lines.append('''CREATE TABLE IF NOT EXISTS public.product_submissions (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type      TEXT          NOT NULL DEFAULT 'new_product' CHECK (submission_type IN ('new_product', 'new_variant')),
    parent_product_id    UUID          NULL REFERENCES public.products(id) ON DELETE SET NULL,
    name                 TEXT          NOT NULL,
    variant_name         TEXT          NULL,
    barcode              TEXT          NULL,
    selling_price        NUMERIC(14,2) NOT NULL CHECK (selling_price >= 0),
    unit_id              UUID          NULL REFERENCES public.units(id) ON DELETE SET NULL,
    category_id          UUID          NULL REFERENCES public.categories(id) ON DELETE SET NULL,
    notes                TEXT          NULL,
    status               TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by         UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    submitted_at         TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by          UUID          NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_at          TIMESTAMPTZ   NULL,
    rejection_reason     TEXT          NULL,
    approved_product_id  UUID          NULL REFERENCES public.products(id) ON DELETE SET NULL,
    approved_variant_id  UUID          NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_submissions_status       ON public.product_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON public.product_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submissions_barcode      ON public.product_submissions(barcode);
CREATE INDEX IF NOT EXISTS idx_submissions_created      ON public.product_submissions(created_at DESC);

ALTER TABLE public.product_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Submissions select policy" ON public.product_submissions;
CREATE POLICY "Submissions select policy" ON public.product_submissions
    FOR SELECT TO authenticated
    USING (submitted_by = auth.uid() OR status = 'pending' OR public.is_owner());

DROP POLICY IF EXISTS "Submissions insert policy" ON public.product_submissions;
CREATE POLICY "Submissions insert policy" ON public.product_submissions
    FOR INSERT TO authenticated
    WITH CHECK (submitted_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Submissions update policy by owner" ON public.product_submissions;
CREATE POLICY "Submissions update policy by owner" ON public.product_submissions
    FOR UPDATE TO authenticated
    USING (public.is_owner()) WITH CHECK (public.is_owner());
''')

    sql_lines.append('-- 1. Pastikan semua Kategori terdaftar')
    for kat in sorted(list(categories_set)):
        if kat:
            kat_clean = kat.replace("'", "''")
            sql_lines.append(f"INSERT INTO public.categories (name) VALUES ('{kat_clean}') ON CONFLICT DO NOTHING;")

    sql_lines.append('\n-- 2. Pastikan semua Satuan terdaftar')
    for u in sorted(list(units_set)):
        if u:
            u_clean = u.replace("'", "''")
            sym = u_clean.lower()
            sql_lines.append(f"INSERT INTO public.units (name, symbol) VALUES ('{u_clean.title()}', '{sym}') ON CONFLICT DO NOTHING;")

    sql_lines.append('\n-- 3. Masukkan 185 Pengajuan Barang Baru ke product_submissions')
    sql_lines.append('DO $SEED$')
    sql_lines.append('DECLARE')
    sql_lines.append('    v_cashier_id UUID;')
    sql_lines.append('BEGIN')
    sql_lines.append("    SELECT id INTO v_cashier_id FROM public.profiles WHERE role = 'cashier' LIMIT 1;")
    sql_lines.append('    IF v_cashier_id IS NULL THEN')
    sql_lines.append('        SELECT id INTO v_cashier_id FROM public.profiles LIMIT 1;')
    sql_lines.append('    END IF;')
    sql_lines.append('    IF v_cashier_id IS NULL THEN')
    sql_lines.append("        RAISE EXCEPTION 'Tidak ditemukan profile user di database.';")
    sql_lines.append('    END IF;\n')

    for idx, it in enumerate(items):
        name_esc = it['name'].replace("'", "''")
        var_esc = f"'{it['variant_name'].replace('\'', '\'\'')}'" if it['variant_name'] else 'NULL'
        kat_esc = it['category'].replace("'", "''") if it['category'] else ''
        unit_esc = it['unit'].replace("'", "''") if it['unit'] else 'Pcs'
        notes_esc = f"'{it['notes'].replace('\'', '\'\'')}'" if it['notes'] else 'NULL'
        price = it['selling_price']
        
        sql_lines.append(f"    INSERT INTO public.product_submissions (")
        sql_lines.append(f"        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes")
        sql_lines.append(f"    ) VALUES (")
        sql_lines.append(f"        '{name_esc}', {var_esc}, {price}, 'pending', v_cashier_id,")
        sql_lines.append(f"        (SELECT id FROM public.categories WHERE lower(name) = lower('{kat_esc}') LIMIT 1),")
        sql_lines.append(f"        (SELECT id FROM public.units WHERE lower(name) = lower('{unit_esc}') OR lower(symbol) = lower('{unit_esc}') LIMIT 1),")
        sql_lines.append(f"        {notes_esc}")
        sql_lines.append(f"    );\n")

    sql_lines.append('END $SEED$;\n')
    sql_lines.append("NOTIFY pgrst, 'reload schema';")

    with open('supabase/seed_excel_submissions.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Done! {len(items)} items generated to supabase/seed_excel_submissions.sql")

if __name__ == '__main__':
    generate_sql()
