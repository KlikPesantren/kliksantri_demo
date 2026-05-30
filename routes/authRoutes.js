const express =
  require("express");

const jwt =
  require("jsonwebtoken");

const pool =
  require("../db");

const router =
  express.Router();

// =====================
// SECRET KEY
// =====================

const SECRET_KEY =
  "PESANTREN_SECRET";

// =====================
// LOGIN
// =====================

router.post(

  "/login",

  async (req, res) => {

    try {

      const {

        username,
        password

      } = req.body;

      const result =

        await pool.query(

          `
          SELECT *

          FROM users

          WHERE username = $1
          `,

          [

            username

          ]

        );

      // ======================
      // USER TIDAK ADA
      // ======================

      if (

        result.rows.length === 0

      ) {

        return res.status(401).json({

          success: false,

          error:
            "User tidak ditemukan"

        });

      }

      const user =
        result.rows[0];

      // ======================
      // PASSWORD SALAH
      // ======================

      if (

        user.password !== password

      ) {

        return res.status(401).json({

          success: false,

          error:
            "Password salah"

        });

      }

      // ======================
      // JWT
      // ======================

      const jwt =
        require("jsonwebtoken");

      const token =

        jwt.sign(

          {

            id:
              user.id,

            username:
              user.username,

            nama:
              user.nama,

            role:
              user.role

          },

          "SECRET_KEY",

          {

            expiresIn:
              "7d"

          }

        );

      // ======================
      // RESPONSE
      // ======================

      res.json({

        success: true,

        token,

        user: {

          id:
            user.id,

          nama:
            user.nama,

          username:
            user.username,

          role:
            user.role

        }

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// =====================
// VERIFY TOKEN
// =====================

router.get(

  "/me",

  async (req, res) => {

    try {

      const authHeader =

        req.headers.authorization;

      if (

        !authHeader

      ) {

        return res.status(401).json({

          success: false,

          error:
            "Token tidak ada"

        });

      }

      const token =

        authHeader.split(" ")[1];

      const decoded =

        jwt.verify(

          token,

          SECRET_KEY

        );

      const result =

        await pool.query(

          `
          SELECT

            id,
            nama,
            username,
            role

          FROM users

          WHERE id = $1
          `,

          [

            decoded.id

          ]

        );

      if (

        result.rows.length
        === 0

      ) {

        return res.status(404).json({

          success: false,

          error:
            "User tidak ditemukan"

        });

      }

      res.json({

        success: true,

        user:
          result.rows[0]

      });

    }

    catch (err) {

      console.log(err);

      res.status(401).json({

        success: false,

        error:
          "Token invalid"

      });

    }
  }
);

// =====================
// REGISTER USER
// =====================

router.post(

  "/register",

  async (req, res) => {

    try {

      const {

        nama,
        username,
        password,
        role

      } = req.body;

      // =====================
      // CHECK USERNAME
      // =====================

      const checkUser =

        await pool.query(

          `
          SELECT *

          FROM users

          WHERE username = $1
          `,

          [username]

        );

      if (

        checkUser.rows.length
        > 0

      ) {

        return res.status(400).json({

          success: false,

          error:
            "Username sudah digunakan"

        });

      }

      // =====================
      // INSERT USER
      // =====================

      const result =

        await pool.query(

          `
          INSERT INTO users
          (

            nama,
            username,
            password,
            role

          )

          VALUES

          (

            $1,
            $2,
            $3,
            $4

          )

          RETURNING

            id,
            nama,
            username,
            role
          `,

          [

            nama,
            username,
            password,
            role

          ]

        );

      res.json({

        success: true,

        data:
          result.rows[0]

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }
  }
);

module.exports =
  router;