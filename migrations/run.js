require("dotenv").config();

const fs =
  require("fs");

const path =
  require("path");

const pool =
  require("../db");

async function run() {

  const files = [
    "001_wali_app.sql",
    "002_wali_app_seed_dev.sql"
  ];

  for (const file of files) {

    const sqlPath =
      path.join(
        __dirname,
        file
      );

    const sql =
      fs.readFileSync(
        sqlPath,
        "utf8"
      );

    console.log(
      "Running:",
      file
    );

    await pool.query(sql);

    console.log(
      "OK:",
      file
    );

  }

  await pool.end();

  console.log(
    "Migration selesai."
  );

}

run().catch((err) => {

  console.error(err);

  process.exit(1);

});
