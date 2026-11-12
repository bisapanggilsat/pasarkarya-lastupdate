// Pembayaran lewat Midtrans Snap (popup). Tidak butuh library tambahan: snap.js dimuat saat pertama dipakai.
let snapLoading = null;

function loadSnap(src, clientKey) {
  if (window.snap) return Promise.resolve();
  if (!snapLoading) {
    snapLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.setAttribute('data-client-key', clientKey);
      script.onload = resolve;
      script.onerror = () => {
        snapLoading = null;
        reject(new Error('Gagal memuat Midtrans. Periksa koneksi internet.'));
      };
      document.head.appendChild(script);
    });
  }
  return snapLoading;
}

// 1) minta token ke server, 2) buka popup, 3) setelah popup selesai/ditutup, minta server cek status
// ke Midtrans. Langkah 3 selalu dijalankan supaya status benar walau webhook belum masuk.
// `request` adalah fungsi fetch ber-token milik lib/api.js.
export async function payWithSnap(request, orderId) {
  const { token, clientKey, snapJsUrl } = await request(`/orders/${orderId}/snap-token`, {
    method: 'POST',
  });
  await loadSnap(snapJsUrl, clientKey);

  const result = await new Promise((resolve) => {
    window.snap.pay(token, {
      onSuccess: () => resolve('success'),
      onPending: () => resolve('pending'),
      onError: () => resolve('error'),
      onClose: () => resolve('closed'),
    });
  });

  const order = await request(`/orders/${orderId}/sync`, { method: 'POST' });
  return { result, order };
}
