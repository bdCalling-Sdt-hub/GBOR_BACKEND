const multer = require("multer");
const path = require("path");

const manyFileUpload = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, path.join(__dirname, "../upload/banner"));
      } else {
        cb(new Error("Invalid file type"));
      }
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      file.fieldname === "bannerImages" &&
      (file.mimetype === "image/jpeg" || file.mimetype === "image/png")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }).fields([{ name: "bannerImages", maxCount: 5 }]); // Assuming a maximum of 5 files can be uploaded, adjust as needed

  return upload;
};

module.exports = manyFileUpload;
