// Format angka jadi rupiah, mis. 850000 menjadi 'Rp 850.000'.
export const money = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

// Ubah tanggal dari database (UTC, format 'YYYY-MM-DD HH:MM:SS') jadi tanggal lokal, mis. '05 Nov 2026'.
export const date = (s) =>
  s
    ? new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';
