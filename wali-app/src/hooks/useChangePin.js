import { useState, useCallback } from 'react';
import { pinApi } from '../api/pin.api';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';

export function useChangePin() {
  const { replaceToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const changePin = useCallback(
    async ({ pin_lama, pin_baru, konfirmasi_pin }) => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await pinApi.changePin({ pin_lama, pin_baru, konfirmasi_pin });
        if (result?.token) {
          await replaceToken(result.token);
        }
        setIsSuccess(true);
        return { success: true };
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Gagal mengubah PIN. Silakan coba lagi.');
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [replaceToken]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return { changePin, isLoading, isSuccess, error, reset };
}
