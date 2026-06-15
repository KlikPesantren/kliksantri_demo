const http = require("http");

const URLS = [
  "http://10.160.153.56:3000",
  "http://10.160.153.189:3000",
  "http://10.161.70.56:3000",
];

function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
        timeout: 8000,
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode, body: parsed, raw });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(Object.assign(new Error("ETIMEDOUT"), { code: "ETIMEDOUT" }));
    });
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log("=== WALI LOGIN REACHABILITY AUDIT ===");
  console.log("Target: POST /wali-app/login from LAN (bukan localhost)\n");

  for (const base of URLS) {
    console.log(`--- ${base} ---`);
    try {
      const root = await request("GET", `${base}/`);
      console.log("GET /", root.status, typeof root.body === "string" ? root.body.slice(0, 80) : root.body);
    } catch (err) {
      console.log("GET / NETWORK", err.code || err.message);
    }
    try {
      const post = await request("POST", `${base}/wali-app/login`, {
        nomor_hp: "081234567890",
        pin: "123456",
      });
      console.log("POST /wali-app/login", post.status, post.body);
    } catch (err) {
      console.log("POST /wali-app/login NETWORK", err.code || err.message);
    }
    console.log("");
  }
})();
