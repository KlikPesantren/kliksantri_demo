const WALLET_FEATURE = Object.freeze({
  key: "wallet",
  label: "Dompet Santri",
  description: "Saldo, topup, mutasi, dan riwayat transaksi santri",
  is_core: true,
  sort_order: 39,
  enabled: true,
});

const WALLET_PERMISSION_FALLBACKS = Object.freeze({
  "wallet.view": "rfid.view",
  "wallet.manage": "rfid.manage",
});

function addVirtualWalletFeature(features) {
  if (features.some((feature) => feature.key === WALLET_FEATURE.key)) {
    return features.map((feature) =>
      feature.key === WALLET_FEATURE.key
        ? { ...feature, is_core: true, enabled: true }
        : feature,
    );
  }

  return [...features, { ...WALLET_FEATURE }].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );
}

function expandWalletPermissions(permissionKeys) {
  const expanded = new Set(permissionKeys || []);

  for (const [walletPermission, legacyPermission] of Object.entries(
    WALLET_PERMISSION_FALLBACKS,
  )) {
    if (expanded.has(legacyPermission)) expanded.add(walletPermission);
  }

  return expanded;
}

module.exports = {
  WALLET_FEATURE,
  WALLET_PERMISSION_FALLBACKS,
  addVirtualWalletFeature,
  expandWalletPermissions,
};
