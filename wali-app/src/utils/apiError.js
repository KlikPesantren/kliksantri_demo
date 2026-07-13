export function getApiErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  const status = Number(error?.response?.status) || null;

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Koneksi terlalu lama. Silakan coba lagi.';
  }

  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'Tidak dapat terhubung. Periksa koneksi internet Anda lalu coba lagi.';
  }

  if (status === 401) return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  if (status === 403) return 'Akses tidak tersedia untuk akun ini.';
  if (status === 404) return 'Data yang diminta tidak ditemukan.';
  if (status === 423) return 'Akun terkunci sementara. Coba lagi nanti.';
  if (status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (status >= 500) return 'Layanan sedang mengalami gangguan. Silakan coba lagi nanti.';

  return fallback;
}
