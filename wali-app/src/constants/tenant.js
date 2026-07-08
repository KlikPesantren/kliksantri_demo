export const TENANT_INACTIVE_MESSAGE =
  'Layanan KlikPesantren untuk pesantren ini sedang tidak aktif.';

export function isTenantSuspendedResponse(status, data) {
  if (status !== 403) return false;
  const msg = data?.error || data?.message;
  return msg === TENANT_INACTIVE_MESSAGE;
}
