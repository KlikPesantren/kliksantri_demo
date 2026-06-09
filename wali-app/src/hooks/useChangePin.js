import { useState, useCallback } from 'react';
import { pinApi } from '../api/pin.api';

export function useChangePin() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const changePin = useCallback(
    async ({ pin_lama, pin_baru, konfirmasi_pin }) => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        await pinApi.changePin({ pin_lama, pin_baru, konfirmasi_pin });
        setIsSuccess(true);
        return { success: true };
      } catch (err) {
        const msg =
          err.response?.data?.error ??
          'Gagal mengubah PIN. Periksa koneksi Anda.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return { changePin, isLoading, isSuccess, error, reset };
}
