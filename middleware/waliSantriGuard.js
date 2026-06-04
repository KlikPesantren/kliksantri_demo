const waliAppService =
  require("../services/waliAppService");

const waliSantriGuard = async (

  req,
  res,
  next

) => {

  try {

    if (!req.wali) {

      return res.status(401).json({

        success: false,

        error: "Autentikasi wali diperlukan"

      });

    }

    const rawSantriId =
      req.headers["x-santri-id"];

    if (
      rawSantriId === undefined ||
      rawSantriId === null ||
      rawSantriId === ""
    ) {

      return res.status(400).json({

        success: false,

        error: "Header X-Santri-Id wajib diisi"

      });

    }

    const santriId =
      Number(rawSantriId);

    if (
      !Number.isInteger(santriId) ||
      santriId <= 0
    ) {

      return res.status(400).json({

        success: false,

        error: "X-Santri-Id tidak valid"

      });

    }

    const allowed =
      req.wali.santri_ids.includes(
        santriId
      );

    if (!allowed) {

      const stillOwned =
        await waliAppService.ownsSantri(
          req.wali.nomor_hp,
          santriId
        );

      if (!stillOwned) {

        return res.status(403).json({

          success: false,

          error: "Bukan anak Anda"

        });

      }

      req.wali.santri_ids.push(
        santriId
      );

    }

    req.santriId = santriId;

    next();

  }

  catch (err) {

    console.log(err);

    return res.status(500).json({

      success: false,

      error: "Validasi santri gagal"

    });

  }

};

module.exports =
  waliSantriGuard;
