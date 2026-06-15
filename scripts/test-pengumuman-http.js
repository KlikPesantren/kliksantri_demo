/**
 * HTTP smoke test POST/GET /pengumuman (requires running server + valid login).
 * Run: node scripts/test-pengumuman-http.js [username] [password]
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const axios = require("axios");

const BASE = (process.env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const [username, password] = process.argv.slice(2);

async function main() {
  if (!username || !password) {
    console.log("Usage: node scripts/test-pengumuman-http.js <username> <password>");
    console.log("Skipping HTTP test — DB-level tests already passed in fix-pengumuman-schema.js");
    process.exit(0);
  }

  const client = axios.create({ baseURL: BASE, validateStatus: () => true });

  const login = await client.post("/auth/login", { username, password });
  if (login.status !== 200 || !login.data?.token) {
    console.error("Login failed", login.status, login.data);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${login.data.token}` };
  const ts = Date.now();

  const postA = await client.post(
    "/pengumuman",
    { judul: `HTTP A ${ts}`, isi: "Tanpa cover", prioritas: "normal", is_active: true },
    { headers }
  );
  console.log("POST without cover:", postA.status, postA.data?.success ? "OK" : postA.data);

  const postB = await client.post(
    "/pengumuman",
    {
      judul: `HTTP B ${ts}`,
      isi: "Dengan cover",
      cover_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==",
      prioritas: "normal",
      is_active: true,
    },
    { headers }
  );
  console.log("POST with cover:", postB.status, postB.data?.success ? "OK" : postB.data);

  const get = await client.get("/pengumuman", { headers });
  console.log("GET /pengumuman:", get.status, get.data?.success ? `OK (${get.data.data?.length ?? 0} rows)` : get.data);

  const ids = [postA.data?.data?.id, postB.data?.data?.id].filter(Boolean);
  for (const id of ids) {
    await client.delete(`/pengumuman/${id}`, { headers });
  }
  if (ids.length) console.log("Cleanup deleted ids:", ids);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
