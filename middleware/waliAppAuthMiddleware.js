const waliAppService =
  require("../services/waliAppService");

const waliAppAuthMiddleware = async (

  req,
  res,
  next

) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({

        success: false,

        error: "Token tidak ada"

      });

    }

    const parts =
      authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {

      return res.status(401).json({

        success: false,

        error: "Format token tidak valid"

      });

    }

    const token = parts[1];

    const decoded =
      waliAppService.verifyWaliToken(
        token
      );

    const akun =
      await waliAppService.getAkunStatus(
        decoded.wali_akun_id
      );

    if (!akun) {

      return res.status(401).json({

        success: false,

        error: "Akun tidak ditemukan"

      });

    }

    if (
      akun.status !== "active"
    ) {

      return res.status(403).json({

        success: false,

        error: "Akun wali ditangguhkan"

      });

    }

    const santriIds =
      await waliAppService.getSantriIdsForPhone(
        akun.nomor_hp
      );

    req.wali = {

      wali_akun_id: akun.id,

      nomor_hp: akun.nomor_hp,

      nama: akun.nama,

      must_change_pin:
        akun.must_change_pin,

      santri_ids: santriIds,

      token_payload: decoded

    };

    next();

  }

  catch (err) {

    console.log(err);

    return res.status(401).json({

      success: false,

      error: "Token tidak valid"

    });

  }

};

module.exports =
  waliAppAuthMiddleware;
