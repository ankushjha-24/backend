import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  getCurrentuser,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  updatecoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
//secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentuser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(
  verifyJWT,
  upload.single("avatar"),
  updateAvatar
);
router.route("/update-coverImage").patch(
  verifyJWT,
  upload.single("coverImage"),
  updatecoverImage
);
router.route("/channel/:username").get(getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
