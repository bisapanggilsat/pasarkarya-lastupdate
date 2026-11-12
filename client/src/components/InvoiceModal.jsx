import { jsPDF } from 'jspdf';
import { date, money } from '../lib/format.js';
import { Command, Download, X } from 'lucide-react';
import Status from './Status.jsx';

// Popup invoice untuk pesanan, dengan tombol unduh PDF.
function InvoiceModal({ order, onClose }) {
  // Membuat file PDF langsung di browser memakai library jsPDF (server tidak dilibatkan).
  // Angka seperti 18 dan 22 adalah posisi teks (x, y) di halaman, dalam milimeter.
  function print() {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('PASARKARYA', 18, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('INVOICE PEMESANAN JASA DIGITAL', 18, 30);
    doc.line(18, 36, 192, 36);
    doc.setFontSize(11);
    doc.text(`Nomor: ${order.invoice_no}`, 18, 48);
    doc.text(`Tanggal: ${date(order.created_at)}`, 18, 56);
    doc.text(`Layanan: ${order.service_title}`, 18, 70);
    doc.text(`Metode: ${order.payment_method}`, 18, 78);
    doc.text(
      `Status: ${order.payment_status === 'paid' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}`,
      18,
      86,
    );
    doc.line(18, 96, 192, 96);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 18, 108);
    doc.text(money(order.amount), 192, 108, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      'Invoice ini diterbitkan secara otomatis oleh PasarKarya untuk transaksi demo.',
      18,
      130,
    );
    doc.save(`${order.invoice_no}.pdf`);
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="invoice-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="invoice-paper">
          <span className="brand">
            <span className="brandmark">
              <Command size={17} />
            </span>{' '}
            pasar<span className="brandaccent">karya.</span>
          </span>
          <div className="invoice-label">INVOICE</div>
          <h2>{order.invoice_no}</h2>
          <div className="invoice-row">
            <span>Tanggal</span>
            <b>{date(order.created_at)}</b>
          </div>
          <div className="invoice-row">
            <span>Layanan</span>
            <b>{order.service_title}</b>
          </div>
          <div className="invoice-row">
            <span>Metode pembayaran</span>
            <b>{order.payment_method}</b>
          </div>
          <div className="invoice-row">
            <span>Status</span>
            <Status value={order.payment_status} />
          </div>
          <div className="invoice-total">
            <span>Total</span>
            <b>{money(order.amount)}</b>
          </div>
          <small>Terima kasih telah mempercayai PasarKarya.</small>
        </div>
        <button className="btn btn-primary btn-block" onClick={print}>
          <Download size={17} /> Unduh invoice PDF
        </button>
      </div>
    </div>
  );
}

export default InvoiceModal;
