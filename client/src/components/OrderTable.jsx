import { date } from '../lib/format.js';
import Status from './Status.jsx';

// Tabel pesanan untuk admin. Dropdown status memanggil updateStatus() milik halaman Admin,
// yang lalu mengirim perubahan ke backend.
function OrderTable({ orders, updateStatus }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice / Pelanggan</th>
            <th>Layanan</th>
            <th>Tanggal</th>
            <th>Pembayaran</th>
            <th>Status pesanan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b>{o.invoice_no}</b>
                <small className="cell-sub">{o.customer_name || 'Pelanggan'}</small>
              </td>
              <td>{o.service_title}</td>
              <td>{date(o.created_at)}</td>
              <td>
                <Status value={o.payment_status} />
              </td>
              <td>
                <Status value={o.order_status} />
              </td>
              <td>
                {o.payment_status === 'paid' &&
                !['completed', 'cancelled'].includes(o.order_status) ? (
                  <select
                    className="action-select"
                    value={o.order_status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    <option value="processing">Diproses</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Batalkan</option>
                  </select>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <div className="table-empty">Belum ada pesanan.</div>}
    </div>
  );
}

export default OrderTable;
