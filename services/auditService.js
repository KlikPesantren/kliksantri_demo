    const pool =
  require("../db");

const createAuditLog =
  async (

    user_id,
    aksi,
    target

  ) => {

    try {

      await pool.query(

        `INSERT INTO audit_logs (

          user_id,
          aksi,
          target

        )

        VALUES (

          $1,
          $2,
          $3

        )`,

        [

          user_id,
          aksi,
          target

        ]

      );

    } catch (err) {

      console.log(err);

    }

};

module.exports =
  createAuditLog;
