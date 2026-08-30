import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { transactionService } from '@/services/transactionService';

function formatDate(dt) {
  return new Date(dt).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', debt: 'HUTANG (BON)' };

export default function ReceiptPrintPage() {
  const { id } = useParams();

  const { data: trx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getTransactionById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (trx) {
      document.title = `Struk ${trx.transaction_number}`;
      setTimeout(() => window.print(), 500);
    }
  }, [trx]);

  if (isLoading || !trx) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        Menyiapkan struk...
      </div>
    );
  }

  const items = trx.transaction_items || [];
  const total = Number(trx.total_amount);
  const paid = Number(trx.payment_amount);
  const change = Number(trx.change_amount);
  const isDebt = trx.payment_method === 'debt';

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .receipt { box-shadow: none !important; border: none !important; }
        }
        body { font-family: 'Courier New', Courier, monospace; background: #f3f4f6; }
        .receipt { width: 76mm; margin: 16px auto; background: white; padding: 8mm; }
        .dashed { border-top: 1px dashed #999; margin: 6px 0; }
      `}</style>

      <div className="receipt no-receipt-shadow" style={{ fontSize: '11px', lineHeight: '1.5' }}>
        {/* Header Toko */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', margin: '0 auto 4px', display: 'block', objectFit: 'contain' }} />
          <div style={{ fontSize: '15px', fontWeight: 'bold' }}>WARUNG GARINUL</div>
          <div style={{ fontSize: '10px', color: '#555' }}>Toko Sembako & Kebutuhan Harian</div>
          {isDebt && (
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309', marginTop: '2px' }}>
              [ NOTA TRANSAKSI HUTANG ]
            </div>
          )}
        </div>

        <div className="dashed" />

        {/* Info Transaksi */}
        <div style={{ fontSize: '10px', color: '#444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>No. Struk</span>
            <span style={{ fontWeight: 'bold' }}>{trx.transaction_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tanggal</span>
            <span>{formatDate(trx.transaction_date)}</span>
          </div>
          {trx.customer?.name && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111', fontWeight: 'bold' }}>
              <span>Pelanggan</span>
              <span>{trx.customer.name}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Kasir</span>
            <span>{trx.cashier?.full_name || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Metode</span>
            <span style={{ fontWeight: 'bold' }}>{METHOD_LABELS[trx.payment_method] || trx.payment_method}</span>
          </div>
        </div>

        <div className="dashed" />

        {/* Daftar Item */}
        {items.map((item, idx) => {
          const unitLabel = item.sale_unit_name || item.unit_name || 'Pcs';
          const itemName = item.variant_name
            ? `${item.item_name} - ${item.variant_name}`
            : item.item_name;

          return (
            <div key={item.id || idx} style={{ marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                {itemName} {item.sale_unit_name ? `(${item.sale_unit_name})` : ''}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#444' }}>
                <span>{Number(item.quantity)} {unitLabel} × Rp{Number(item.price).toLocaleString('id-ID')}</span>
                <span style={{ fontWeight: 'bold', color: '#111' }}>Rp{Number(item.subtotal).toLocaleString('id-ID')}</span>
              </div>
            </div>
          );
        })}

        <div className="dashed" />

        {/* Ringkasan Pembayaran */}
        <div style={{ fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Subtotal ({trx.total_quantity} item)</span>
            <span>Rp{Number(trx.subtotal || trx.total_amount).toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', margin: '4px 0' }}>
            <span>{isDebt ? 'TOTAL HUTANG' : 'TOTAL'}</span>
            <span style={{ color: isDebt ? '#b45309' : '#111' }}>Rp{total.toLocaleString('id-ID')}</span>
          </div>

          {!isDebt ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                <span>Bayar ({METHOD_LABELS[trx.payment_method] || ''})</span>
                <span>Rp{paid.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#16a34a' }}>
                <span>Kembalian</span>
                <span>Rp{change.toLocaleString('id-ID')}</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#b45309', margin: '6px 0', fontSize: '10px' }}>
              *** TERCATAT KE BUKU PIUTANG ***
            </div>
          )}
        </div>

        <div className="dashed" />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '6px' }}>
          <div>Terima kasih atas kunjungan Anda!</div>
          <div>Barang yang sudah dibeli tidak dapat dikembalikan.</div>
        </div>
      </div>

      {/* Tombol Tutup (tidak ikut print) */}
      <div className="no-print" style={{ textAlign: 'center', margin: '16px' }}>
        <button
          onClick={() => window.close()}
          style={{
            padding: '8px 24px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          Tutup Tab
        </button>
      </div>
    </>
  );
}
