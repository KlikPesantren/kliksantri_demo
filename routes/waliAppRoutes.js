console.log(
  "WALI APP ROUTES LOADED"
);

const express =
  require("express");

const router =
  express.Router();

const waliAppService =
  require("../services/waliAppService");

const waliAppAuthMiddleware =
  require("../middleware/waliAppAuthMiddleware");

// =====================
// POST /wali-app/login
// =====================

router.post(

  "/login",

  async (req, res) => {

    try {

      const {

        nomor_hp,
        pin

      } = req.body;

      const normalized =
        waliAppService.normalizePhone(
          nomor_hp
        );

      if (
        !normalized ||
        !waliAppService.isValidPin(pin)
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Nomor HP atau PIN tidak valid"

        });

      }

      const akun =
        await waliAppService.findAkunByPhone(
          normalized
        );

      if (!akun) {

        await waliAppService.writeAudit({

          nomorHp: normalized,

          event: "login_failed",

          ipAddress: req.ip,

          userAgent:
            req.headers["user-agent"]

        });

        return res.status(401).json({

          success: false,

          error:
            "Nomor HP atau PIN salah"

        });

      }

      if (
        akun.status !== "active"
      ) {

        return res.status(403).json({

          success: false,

          error:
            "Akun wali ditangguhkan"

        });

      }

      if (
        waliAppService.isAccountLocked(
          akun
        )
      ) {

        return res.status(423).json({

          success: false,

          error:
            "Akun terkunci. Coba lagi nanti."

        });

      }

      const pinValid =
        await waliAppService.verifyPin(
          pin,
          akun.pin_hash
        );

      if (!pinValid) {

        await waliAppService.registerFailedLogin(
          akun.id
        );

        await waliAppService.writeAudit({

          nomorHp: normalized,

          event: "login_failed",

          ipAddress: req.ip,

          userAgent:
            req.headers["user-agent"]

        });

        return res.status(401).json({

          success: false,

          error:
            "Nomor HP atau PIN salah"

        });

      }

      await waliAppService.registerSuccessfulLogin(
        akun.id
      );

      const freshAkun =
        await waliAppService.findAkunByPhone(
          normalized
        );

      const loginData =
        await waliAppService.buildLoginResponse(
          freshAkun
        );

      await waliAppService.writeAudit({

        nomorHp: normalized,

        event: "login_success",

        ipAddress: req.ip,

        userAgent:
          req.headers["user-agent"]

      });

      res.json({

        success: true,

        ...loginData

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error: err.message

      });

    }

  }

);

// =====================
// GET /wali-app/me
// =====================

router.get(

  "/me",

  waliAppAuthMiddleware,

  async (req, res) => {

    try {

      const anak =
        await waliAppService.getAnakList(
          req.wali.nomor_hp
        );

      res.json({

        success: true,

        wali:
          waliAppService.buildWaliProfile({

            nomor_hp:
              req.wali.nomor_hp,

            nama:
              req.wali.nama,

            must_change_pin:
              req.wali.must_change_pin

          }),

        anak,

        santri_ids:
          req.wali.santri_ids

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error: err.message

      });

    }

  }

);

// =====================
// GET /wali-app/anak
// =====================

router.get(

  "/anak",

  waliAppAuthMiddleware,

  async (req, res) => {

    try {

      const anak =
        await waliAppService.getAnakList(
          req.wali.nomor_hp
        );

      res.json({

        success: true,

        data: anak,

        total: anak.length

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error: err.message

      });

    }

  }

);

module.exports = router;
