const {

  Pool

} = require("pg");

const pool =

  new Pool({

    user: "postgres",

    host: "localhost",

    database:
      "Administrasi Santri Digital",

    password: "313333",

    port: 5432

  });

module.exports =
  pool;