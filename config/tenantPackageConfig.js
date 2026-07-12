const CORE_FEATURES = ["dashboard", "profil", "sistem", "wallet"];

const PACKAGE_BASIC = [
  "dashboard",
  "profil",
  "sistem",
  "wallet",
  "santri",
  "guru",
  "kelas",
  "wali",
  "pembayaran",
  "buku_kas",
  "pengumuman",
];

const PACKAGE_STANDARD = [
  ...PACKAGE_BASIC,
  "perizinan",
  "pelanggaran",
  "sahriyah",
];

const PACKAGE_PREMIUM = [
  ...PACKAGE_STANDARD,
  "rfid",
  "wali_app",
  "kas_instansi",
  "audit",
  "program_unit",
];

const PACKAGE_PRESETS = {
  basic: PACKAGE_BASIC,
  standard: PACKAGE_STANDARD,
  premium: PACKAGE_PREMIUM,
};

const VALID_PACKAGES = new Set(["basic", "standard", "premium", "custom"]);

function normalizePackage(pkg) {
  return String(pkg || "").trim().toLowerCase();
}

function resolveEnabledFeatures(packageName, customFeatures = []) {
  const pkg = normalizePackage(packageName);

  if (!VALID_PACKAGES.has(pkg)) {
    const err = new Error(
      "Package harus basic, standard, premium, atau custom"
    );
    err.status = 400;
    throw err;
  }

  const enabled = new Set(CORE_FEATURES);

  if (pkg === "custom") {
    if (Array.isArray(customFeatures)) {
      for (const key of customFeatures) {
        const k = String(key || "").trim();
        if (k) enabled.add(k);
      }
    }
    return enabled;
  }

  for (const key of PACKAGE_PRESETS[pkg]) {
    enabled.add(key);
  }

  return enabled;
}

function getPackageLabel(packageName) {
  const pkg = normalizePackage(packageName);
  if (pkg === "basic") return "Basic";
  if (pkg === "standard") return "Standard";
  if (pkg === "premium") return "Premium";
  return "Custom";
}

function detectPackageFromFeatures(features = []) {
  const enabled = new Set(
    features.filter((feature) => feature.enabled).map((feature) => feature.key)
  );

  for (const packageName of ["premium", "standard", "basic"]) {
    const preset = new Set(PACKAGE_PRESETS[packageName]);
    const matchesPreset =
      enabled.size === preset.size &&
      [...preset].every((featureKey) => enabled.has(featureKey));

    if (matchesPreset) {
      return {
        id: packageName,
        label: getPackageLabel(packageName),
      };
    }
  }

  return { id: "custom", label: "Custom" };
}

function getPackageOptions() {
  return [
    {
      id: "basic",
      label: "Basic",
      description: "Operasional dasar: santri, guru, kelas, wali, pembayaran, pengumuman",
      features: PACKAGE_BASIC,
    },
    {
      id: "standard",
      label: "Standard",
      description: "Basic + perizinan, pelanggaran, sahriyah",
      features: PACKAGE_STANDARD,
    },
    {
      id: "premium",
      label: "Premium",
      description: "Standard + RFID, wali app, kas instansi, audit, program unit",
      features: PACKAGE_PREMIUM,
    },
    {
      id: "custom",
      label: "Custom",
      description: "Pilih fitur secara manual (core selalu aktif)",
      features: [],
    },
  ];
}

module.exports = {
  CORE_FEATURES,
  PACKAGE_BASIC,
  PACKAGE_STANDARD,
  PACKAGE_PREMIUM,
  PACKAGE_PRESETS,
  VALID_PACKAGES,
  normalizePackage,
  resolveEnabledFeatures,
  detectPackageFromFeatures,
  getPackageOptions,
  getPackageLabel,
};
