const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const multer = require("multer");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const backupService = require("../services/platformBackupService");

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await backupService.ensureBackupDirectories();
        cb(null, backupService.UPLOAD_DIR);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.backup`);
    },
  }),
  limits: {
    fileSize: Number(process.env.BACKUP_UPLOAD_MAX_BYTES || 1024 * 1024 * 1024),
  },
});

router.use(platformAuthMiddleware);

function requirePlatformSuperadmin(req, res, next) {
  if (req.platformUser?.role !== "platform_superadmin") {
    return res.status(403).json({
      success: false,
      error: "Hanya platform_superadmin yang boleh mengelola backup",
    });
  }
  next();
}

router.use(requirePlatformSuperadmin);

router.get("/history", async (req, res) => {
  try {
    const data = await backupService.listBackups();
    res.json({ success: true, data });
  } catch (err) {
    console.error("[platform backup history]", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post("/create", async (req, res) => {
  try {
    const backup = await backupService.createBackup();
    res.json({
      success: true,
      filename: backup.filename,
      size: backup.size,
      created_at: backup.created_at,
    });
  } catch (err) {
    console.error("[platform backup create]", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/download/:filename", async (req, res) => {
  try {
    const filename = backupService.assertBackupFilename(req.params.filename);
    const filePath = backupService.resolveBackupPath(filename);

    res.download(filePath, filename);
  } catch (err) {
    console.error("[platform backup download]", err);
    res.status(err.statusCode || 404).json({
      success: false,
      error: err.message,
    });
  }
});

router.post("/restore", upload.single("backup_file"), async (req, res) => {
  const uploadedPath = req.file?.path;

  try {
    const confirmed =
      req.body?.confirm_restore === "true" ||
      req.body?.confirm_restore === true;

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: "Konfirmasi restore wajib dicentang",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "backup_file wajib diupload",
      });
    }

    if (path.extname(req.file.originalname || "").toLowerCase() !== ".backup") {
      return res.status(400).json({
        success: false,
        error: "File restore harus berekstensi .backup",
      });
    }

    await backupService.restoreBackup(uploadedPath);

    res.json({
      success: true,
      message: "Restore database selesai",
      filename: req.file.originalname,
    });
  } catch (err) {
    console.error("[platform backup restore]", err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (uploadedPath) {
      await fs.rm(uploadedPath, { force: true }).catch(() => {});
    }
  }
});

module.exports = router;
