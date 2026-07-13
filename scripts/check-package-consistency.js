const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const app = readJson("wali-app/app.json").expo;
const eas = readJson("wali-app/eas.json");
const firebase = readJson("wali-app/google-services.json");
const releaseDoc = readText("wali-app/docs/release-readiness.md");
const migrationChecklist = path.join(root, "docs/package-migration-checklist.md");

const androidPackage = app.android?.package;
const iosBundle = app.ios?.bundleIdentifier;
const expectedPackage = "com.klikpesantren.wali";
const firebasePackages = (firebase.client || [])
  .map((client) => client?.client_info?.android_client_info?.package_name)
  .filter(Boolean);
const production = eas.build?.production;
const failures = [];
const warnings = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(Boolean(androidPackage), "app.json android.package tidak tersedia");
check(androidPackage === expectedPackage, `Android package final harus ${expectedPackage}`);
check(androidPackage === iosBundle, "Android package dan iOS bundleIdentifier berbeda");
check(
  firebasePackages.filter((packageName) => packageName === androidPackage).length === 1,
  "google-services.json harus memiliki tepat satu client yang cocok dengan app.json",
);
check(app.scheme === "klikpesantren-wali", "Scheme final harus klikpesantren-wali");
check(Boolean(app.extra?.eas?.projectId), "EAS projectId tidak tersedia");
check(production?.android?.buildType === "app-bundle", "Profile production bukan app-bundle");
check(production?.distribution !== "internal", "Profile production masih internal distribution");
check(production?.environment === "production", "EAS environment production belum dipilih");
check(production?.channel === "production", "EAS channel production belum dipilih");
check(
  /^https:\/\//.test(production?.env?.EXPO_PUBLIC_API_BASE_URL || ""),
  "API production tidak menggunakan HTTPS",
);
check(fs.existsSync(migrationChecklist), "Checklist migrasi package belum tersedia");
check(
  releaseDoc.includes(androidPackage),
  "Release-readiness tidak mencatat package aktif",
);

if (firebasePackages.some((packageName) => packageName !== androidPackage)) {
  warnings.push(
    "google-services.json juga memuat client Firebase lain; Android memilih client yang cocok dengan applicationId final.",
  );
}
if (app.slug === "kliksantri-wali" && app.extra?.eas?.projectId) {
  warnings.push(
    "Slug lama dipertahankan karena projectId EAS sudah tertaut; ubah hanya setelah owner memverifikasi project EAS.",
  );
}
if (!Object.prototype.hasOwnProperty.call(app, "owner")) {
  warnings.push("expo.owner tidak ditetapkan eksplisit; verifikasi organisasi EAS secara manual.");
}

console.log(`Android package: ${androidPackage || "MISSING"}`);
console.log(`iOS bundle: ${iosBundle || "MISSING"}`);
console.log(`Firebase package: ${firebasePackages.join(", ") || "MISSING"}`);
warnings.forEach((warning) => console.warn(`WARN: ${warning}`));

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS: package, Firebase, scheme, EAS, dan dokumentasi konsisten.");
}
