require("dotenv").config();

const { Pool } = require("pg");

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const pool = new Pool({
  user: requireEnv("DB_USER"),
  host: requireEnv("DB_HOST"),
  database: requireEnv("DB_NAME"),
  password: requireEnv("DB_PASSWORD"),
  port: Number(process.env.DB_PORT || 5432),
});

module.exports = pool;
