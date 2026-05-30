const pool = require("../db");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

exports.login = async (req, res) => {

  try {

    const {

      username,
      password

    } = req.body;

    const result =
      await pool.query(

        "SELECT * FROM users WHERE username = $1",

        [username]

      );

    if (result.rows.length === 0) {

      return res.status(401).json({

        success: false,

        error: "User tidak ditemukan"

      });

    }

    const user =
      result.rows[0];

    // sementara password polos

    const isMatch =
  await bcrypt.compare(

    password,

    user.password

  );

if (!isMatch) {

  return res.status(401).json({

    success: false,

    error: "Password salah"

  });

}

    const token = jwt.sign(

      {

        id: user.id,

        role: user.role

      },

      "RAHASIA_ADMIN_SANTRI",

      {

        expiresIn: "7d"

      }

    );

    res.json({

      success: true,

      token,

      user: {

        id: user.id,

        nama: user.nama,

        username: user.username,

        role: user.role

      }

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      error: "Login gagal"

    });

  }

};