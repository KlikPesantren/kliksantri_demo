const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "pesantren");
const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : ".png";
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${unique}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    return cb(new Error("Format file tidak didukung"));
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

router.use((req, _res, next) => {
  console.log("UPLOAD ROUTER", req.method, req.path);
  next();
});

router.post("/image", (req, res) => {
  console.log("UPLOAD ROUTE HIT", req.method, req.originalUrl);

  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: "Ukuran maksimal 5MB",
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message || "Upload gagal",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File wajib diupload",
      });
    }

    return res.json({
      success: true,
      url: `/uploads/pesantren/${req.file.filename}`,
    });
  });
});

module.exports = router;
