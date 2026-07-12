export const WALLET_TRANSACTION_METHODS = Object.freeze({
  MANUAL: "manual",
  RFID: "rfid",
  FUTURE_QRIS: "future_qris",
  FUTURE_TRANSFER: "future_transfer",
  FUTURE_CASHIER: "future_cashier",
});

export function inferTransactionMethod(transaction = {}) {
  if (transaction.transaction_method) return transaction.transaction_method;

  const hasRfidContext = Boolean(
    transaction.device_id || transaction.merchant_id || transaction.uid_rfid,
  );

  return hasRfidContext ? WALLET_TRANSACTION_METHODS.RFID : WALLET_TRANSACTION_METHODS.MANUAL;
}

export function transactionMethodLabel(method) {
  const labels = {
    manual: "Manual",
    rfid: "RFID",
    future_qris: "QRIS (segera)",
    future_transfer: "Transfer (segera)",
    future_cashier: "Kasir (segera)",
  };

  return labels[method] || "Manual";
}
