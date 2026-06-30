const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadImageBuffer } = require("../services/cloudinaryUploadService");

const router = express.Router();

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    return cb(new Error("Format file tidak didukung"));
  }

  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

router.use((req, _res, next) => {
  console.log("UPLOAD ROUTER", req.method, req.path);
  next();
});

router.post("/image", (req, res) => {
  console.log("UPLOAD ROUTE HIT", req.method, req.originalUrl);

  upload.single("file")(req, res, async (err) => {
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

    try {
      const result = await uploadImageBuffer(req.file.buffer, {
        originalName: req.file.originalname,
      });

      return res.json({
        success: true,
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (uploadErr) {
      console.error("[CLOUDINARY UPLOAD ERROR]", uploadErr);
      return res.status(500).json({
        success: false,
        error: uploadErr.code === "CLOUDINARY_NOT_CONFIGURED"
          ? uploadErr.message
          : "Upload Cloudinary gagal",
      });
    }
  });
});

module.exports = router;
