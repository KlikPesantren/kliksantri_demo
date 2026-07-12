const assert = require("node:assert/strict");
const {
  addVirtualWalletFeature,
  expandWalletPermissions,
} = require("../config/walletAccessConfig");

function featureSet(keys) {
  return new Set(addVirtualWalletFeature(keys.map((key) => ({ key, enabled: true })))
    .filter((feature) => feature.enabled)
    .map((feature) => feature.key));
}

const cases = [
  { name: "wallet only", input: ["wallet"], wallet: true, rfid: false },
  { name: "wallet + rfid", input: ["wallet", "rfid"], wallet: true, rfid: true },
  { name: "legacy rfid", input: ["rfid"], wallet: true, rfid: true },
  { name: "tanpa row wallet", input: [], wallet: true, rfid: false },
];

for (const testCase of cases) {
  const enabled = featureSet(testCase.input);
  assert.equal(enabled.has("wallet"), testCase.wallet, `${testCase.name}: wallet`);
  assert.equal(enabled.has("rfid"), testCase.rfid, `${testCase.name}: rfid`);
}

const legacy = expandWalletPermissions(["rfid.view", "rfid.manage"]);
assert(legacy.has("wallet.view"));
assert(legacy.has("wallet.manage"));

const walletOnly = expandWalletPermissions(["wallet.view", "wallet.manage"]);
assert(!walletOnly.has("rfid.view"));
assert(!walletOnly.has("rfid.manage"));

console.log("Wallet core separation matrix: PASS");
