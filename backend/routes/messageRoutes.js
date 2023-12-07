const express = require("express");
const {
  allMessages,
  sendMessage,
  uploadImage
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/upload-image").post(uploadImage);

module.exports = router;
