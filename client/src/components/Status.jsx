// Label status berwarna. `map` menerjemahkan kode dari database (mis. 'paid') jadi teks Indonesia + warna.
function Status({ value }) {
  const map = {
    pending: ['Menunggu pembayaran', 'yellow'],
    paid: ['Lunas', 'green'],
    processing: ['Sedang dikerjakan', 'blue'],
    completed: ['Selesai', 'green'],
    cancelled: ['Dibatalkan', 'red'],
    waiting_payment: ['Menunggu pembayaran', 'yellow'],
  };
  const [label, color] = map[value] || [value, 'gray'];
  return (
    <span className={`status ${color}`}>
      <i></i>
      {label}
    </span>
  );
}

export default Status;
